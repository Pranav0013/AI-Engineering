import { useState } from 'react'
import { generateAnswer, generateInterviewQuestions, QUESTION_CATEGORIES } from '../lib/interviewQuestions'
import { nowISO } from '../lib/utils'
import ConfirmDialog from './ConfirmDialog'
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CloseIcon,
  CopyIcon,
  InterviewPrepIcon,
  LightbulbIcon,
  RefreshIcon,
  StarIcon,
  TrashIcon,
} from './icons'

const DIFFICULTY_CLASS = {
  Easy: 'text-offer bg-offer/10 border-offer/30',
  Medium: 'text-followup bg-followup/10 border-followup/30',
  Hard: 'text-rejected bg-rejected/10 border-rejected/30',
}

function ActionButton({ onClick, title, icon: Icon, active, activeClass, loading, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center size-7 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? activeClass || 'text-applied bg-applied/10'
          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className={`size-3.5 ${loading ? 'animate-spin' : ''}`} fill={active && Icon === StarIcon ? 'currentColor' : 'none'} />
    </button>
  )
}

function QuestionRow({ q, categoryKey, onCopy, onTogglePracticed, onToggleFavorite, onDelete, onShowAnswer, answerLoading, copied }) {
  const isCoding = categoryKey === 'codingQuestions'

  return (
    <li className="rounded-md border border-slate-200 dark:border-slate-800 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p
          className={`text-sm flex-1 ${
            q.practiced ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'
          }`}
        >
          {q.question}
        </p>
        <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${DIFFICULTY_CLASS[q.difficulty]}`}>
          {q.difficulty}
        </span>
      </div>

      <div className="flex items-center gap-1 mt-1.5">
        <ActionButton
          onClick={onCopy}
          title={copied ? 'Copied!' : 'Copy question'}
          icon={CopyIcon}
          active={copied}
          activeClass="text-offer bg-offer/10"
        />
        <ActionButton
          onClick={onTogglePracticed}
          title={q.practiced ? 'Marked as practiced' : 'Mark as practiced'}
          icon={CheckCircleIcon}
          active={q.practiced}
          activeClass="text-offer bg-offer/10"
        />
        <ActionButton
          onClick={onToggleFavorite}
          title={q.favorite ? 'Remove favorite' : 'Favorite'}
          icon={StarIcon}
          active={q.favorite}
          activeClass="text-followup bg-followup/10"
        />
        <ActionButton
          onClick={onShowAnswer}
          title={
            q.answer
              ? q.showAnswer
                ? 'Hide suggested answer'
                : isCoding
                  ? 'Show code solution'
                  : 'Show suggested answer'
              : isCoding
                ? 'Generate code solution'
                : 'Generate suggested answer'
          }
          icon={LightbulbIcon}
          active={q.showAnswer}
          activeClass="text-interview bg-interview/10"
          loading={answerLoading}
        />
        <ActionButton onClick={onDelete} title="Delete question" icon={TrashIcon} activeClass="text-rejected bg-rejected/10" />
      </div>

      {q.showAnswer && q.answer && (
        isCoding ? (
          <pre className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-md p-2 overflow-x-auto font-mono whitespace-pre">
            {q.answer}
          </pre>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-md p-2 whitespace-pre-wrap">
            {q.answer}
          </p>
        )
      )}
    </li>
  )
}

export default function InterviewPrepModal({ job, apiKey, onSave, onEditJob, onOpenSettings, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [expanded, setExpanded] = useState(() => new Set([QUESTION_CATEGORIES[0].key]))
  const [answerLoadingId, setAnswerLoadingId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const prep = job.interviewPreparation
  const hasJD = Boolean(job.jobDescription?.trim())

  function persist(updatedPrep) {
    return onSave({ ...job, interviewPreparation: updatedPrep, updatedAt: nowISO() })
  }

  async function runGenerate() {
    setLoading(true)
    setError('')
    try {
      const input = {
        jobTitle: job.role,
        companyName: job.company,
        jobDescription: job.jobDescription,
      }
      const result = await generateInterviewQuestions(input, apiKey)
      await persist(result)
      setExpanded(new Set([QUESTION_CATEGORIES[0].key]))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleGenerateClick() {
    if (prep) {
      setConfirmRegenerate(true)
    } else {
      runGenerate()
    }
  }

  function handleConfirmRegenerate() {
    setConfirmRegenerate(false)
    runGenerate()
  }

  function toggleSection(key) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function updateQuestion(categoryKey, questionId, changes) {
    const updatedPrep = {
      ...prep,
      [categoryKey]: prep[categoryKey].map((q) => (q.id === questionId ? { ...q, ...changes } : q)),
    }
    persist(updatedPrep)
  }

  function deleteQuestion(categoryKey, questionId) {
    const updatedPrep = {
      ...prep,
      [categoryKey]: prep[categoryKey].filter((q) => q.id !== questionId),
    }
    persist(updatedPrep)
  }

  async function handleCopy(q) {
    const text = q.answer ? `Q: ${q.question}\nA: ${q.answer}` : q.question
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(q.id)
      setTimeout(() => setCopiedId((id) => (id === q.id ? null : id)), 1500)
    } catch {
      // clipboard access denied — silently ignore
    }
  }

  async function handleShowAnswer(categoryKey, q) {
    if (q.answer) {
      updateQuestion(categoryKey, q.id, { showAnswer: !q.showAnswer })
      return
    }
    setAnswerLoadingId(q.id)
    setError('')
    try {
      const answer = await generateAnswer(
        {
          question: q.question,
          jobTitle: job.role,
          companyName: job.company,
          jobDescription: job.jobDescription,
          category: categoryKey,
        },
        apiKey
      )
      updateQuestion(categoryKey, q.id, { answer, showAnswer: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setAnswerLoadingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-md p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 animate-pop max-h-[90vh] overflow-y-auto scroll-thin"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <InterviewPrepIcon className="size-5 text-interview" />
              Interview Preparation
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {job.role} · {job.company}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          {!hasJD ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Add a job description for this job to generate tailored interview questions.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEditJob(job)
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md gradient-brand hover:brightness-110 shadow-sm shadow-brand/30 text-white text-sm font-medium px-3 py-1.5 transition-colors cursor-pointer"
              >
                Add job description
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {prep ? `Generated ${new Date(prep.generatedAt).toLocaleString()}` : 'No questions generated yet.'}
                </p>
                <button
                  type="button"
                  onClick={handleGenerateClick}
                  disabled={loading || !apiKey}
                  className="inline-flex items-center gap-1.5 rounded-md gradient-brand hover:brightness-110 shadow-sm shadow-brand/30 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 transition-colors cursor-pointer"
                >
                  <RefreshIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Generating questions...' : prep ? 'Regenerate' : 'Generate Interview Questions'}
                </button>
              </div>

              {!apiKey && (
                <p className="text-xs text-followup bg-followup/10 border border-followup/30 rounded-md px-3 py-2">
                  Add your GROQ API key in{' '}
                  <button type="button" onClick={onOpenSettings} className="underline cursor-pointer">
                    Settings
                  </button>{' '}
                  to enable AI interview question generation.
                </p>
              )}

              {error && (
                <p className="text-xs text-rejected bg-rejected/10 border border-rejected/30 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              {prep && (
                <div className="space-y-2 pt-1">
                  {QUESTION_CATEGORIES.map(({ key, label, optional }) => {
                    const questions = prep[key] || []
                    if (optional && questions.length === 0) return null
                    const isOpen = expanded.has(key)
                    return (
                      <div key={key} className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleSection(key)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <span>
                            {label} ({questions.length})
                          </span>
                          <ChevronDownIcon className={`size-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-3">
                            {questions.length === 0 ? (
                              <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                                {key === 'systemDesignQuestions'
                                  ? 'Not generated for this role — typically reserved for senior positions.'
                                  : 'No questions.'}
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {questions.map((q) => (
                                  <QuestionRow
                                    key={q.id}
                                    q={q}
                                    categoryKey={key}
                                    copied={copiedId === q.id}
                                    answerLoading={answerLoadingId === q.id}
                                    onCopy={() => handleCopy(q)}
                                    onTogglePracticed={() => updateQuestion(key, q.id, { practiced: !q.practiced })}
                                    onToggleFavorite={() => updateQuestion(key, q.id, { favorite: !q.favorite })}
                                    onDelete={() => deleteQuestion(key, q.id)}
                                    onShowAnswer={() => handleShowAnswer(key, q)}
                                  />
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {confirmRegenerate && (
        <ConfirmDialog
          title="Regenerate interview questions?"
          message="This will replace your current question set. Any favorites, practiced marks, and suggested answers on the existing questions will be lost."
          confirmLabel="Regenerate"
          danger
          onConfirm={handleConfirmRegenerate}
          onCancel={() => setConfirmRegenerate(false)}
        />
      )}
    </div>
  )
}
