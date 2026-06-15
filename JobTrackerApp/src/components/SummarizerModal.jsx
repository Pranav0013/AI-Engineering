import { useState } from 'react'
import { summarizeJD } from '../lib/jdSummarizer'
import { CloseIcon, SparklesIcon } from './icons'

const inputClass =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-applied/50 focus:border-applied'

const SECTIONS = [
  { key: 'keyResponsibilities', title: 'Key Responsibilities' },
  { key: 'requiredSkills', title: 'Required Skills' },
  { key: 'niceToHaveSkills', title: 'Nice-to-Have Skills' },
  { key: 'salaryInfo', title: 'Salary Information' },
  { key: 'experienceRequirements', title: 'Experience Requirements' },
  { key: 'redFlags', title: 'Potential Red Flags', accent: 'rejected' },
]

export default function SummarizerModal({ apiKey, onClose }) {
  const [jdText, setJdText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleAnalyze() {
    if (!jdText.trim()) return
    setLoading(true)
    try {
      const res = await summarizeJD(jdText, apiKey)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 animate-pop max-h-[90vh] overflow-y-auto scroll-thin"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SparklesIcon className="size-5 text-applied" />
            Job Description Summarizer
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Paste the job description
            </label>
            <textarea
              className={`${inputClass} min-h-40 resize-y`}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here..."
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {apiKey
                ? 'AI-enhanced mode (GROQ) — your key is used directly from your browser.'
                : 'Local analysis mode — runs entirely in your browser. Add a GROQ API key in Settings for AI-enhanced results.'}
            </p>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!jdText.trim() || loading}
              className="inline-flex items-center gap-1.5 rounded-md gradient-brand hover:brightness-110 shadow-sm shadow-brand/30 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 transition-colors shrink-0 ml-3"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          {result?.warning && (
            <p className="text-xs text-followup bg-followup/10 border border-followup/30 rounded-md px-3 py-2">
              {result.warning}
            </p>
          )}

          {result && (
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              {SECTIONS.map(({ key, title, accent }) => (
                <div
                  key={key}
                  className={`rounded-lg border p-3 ${
                    accent === 'rejected'
                      ? 'border-rejected/30 bg-rejected/5'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <h3
                    className={`text-sm font-semibold mb-1.5 ${
                      accent === 'rejected'
                        ? 'text-rejected'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {title}
                  </h3>
                  {result[key]?.length ? (
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                      {result[key].map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                      Not specified in this JD.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
