import { useMemo, useState } from 'react'
import {
  createReminder,
  REMINDER_PRIORITIES,
  REMINDER_STATUS_META,
  REMINDER_TYPES,
  reminderStatus,
  toggleComplete,
} from '../lib/reminders'
import { todayISODate } from '../lib/utils'
import { BellIcon, CloseIcon, PlusIcon } from './icons'
import ReminderRow from './ReminderRow'

const inputClass =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-applied/50 focus:border-applied'
const labelClass = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'

const STATUS_ORDER = ['overdue', 'dueToday', 'upcoming', 'completed']

function emptyForm() {
  return { id: null, title: '', type: 'CUSTOM', dueDate: todayISODate(), priority: 'MEDIUM', notes: '' }
}

export default function ReminderModal({ job, initialEditId, onUpdateReminders, onClose }) {
  const reminders = useMemo(() => job.reminders || [], [job.reminders])

  const [form, setForm] = useState(() => {
    if (initialEditId) {
      const r = reminders.find((x) => x.id === initialEditId)
      if (r) return { id: r.id, title: r.title, type: r.type, dueDate: r.dueDate, priority: r.priority, notes: r.notes || '' }
    }
    return emptyForm()
  })
  const [error, setError] = useState('')

  const grouped = useMemo(() => {
    const today = todayISODate()
    const byStatus = { overdue: [], dueToday: [], upcoming: [], completed: [] }
    for (const r of reminders) byStatus[reminderStatus(r, today)].push(r)
    byStatus.overdue.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
    byStatus.upcoming.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
    byStatus.completed.sort((a, b) => ((a.completedAt || '') > (b.completedAt || '') ? -1 : 1))
    return byStatus
  }, [reminders])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    if (!form.dueDate) {
      setError('Due date is required.')
      return
    }
    setError('')

    if (form.id) {
      onUpdateReminders(
        reminders.map((r) =>
          r.id === form.id
            ? { ...r, title: form.title.trim(), type: form.type, dueDate: form.dueDate, priority: form.priority, notes: form.notes.trim() }
            : r
        )
      )
    } else {
      const reminder = createReminder({
        jobId: job.id,
        title: form.title,
        type: form.type,
        dueDate: form.dueDate,
        priority: form.priority,
        notes: form.notes,
      })
      onUpdateReminders([...reminders, reminder])
    }
    setForm(emptyForm())
  }

  function mutate(id, fn) {
    onUpdateReminders(reminders.map((r) => (r.id === id ? fn(r) : r)))
  }

  function removeReminder(id) {
    if (form.id === id) setForm(emptyForm())
    onUpdateReminders(reminders.filter((r) => r.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-md p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 animate-pop max-h-[90vh] overflow-y-auto scroll-thin"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BellIcon className="size-5 text-applied" />
              Reminders
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {job.role} · {job.company}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {form.id ? 'Edit reminder' : 'Add reminder'}
          </p>
          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Send thank-you email" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Type</label>
              <select className={inputClass} value={form.type} onChange={(e) => update('type', e.target.value)}>
                {REMINDER_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select className={inputClass} value={form.priority} onChange={(e) => update('priority', e.target.value)}>
                {REMINDER_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Due date *</label>
              <input type="date" className={inputClass} value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <input className={inputClass} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Optional" />
            </div>
          </div>
          {error && <p className="text-xs text-rejected">{error}</p>}
          <div className="flex justify-end gap-2">
            {form.id && (
              <button type="button" onClick={() => setForm(emptyForm())} className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                Cancel edit
              </button>
            )}
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-md gradient-brand hover:brightness-110 shadow-sm shadow-brand/30 text-white text-sm font-medium px-3 py-1.5 transition-colors cursor-pointer">
              <PlusIcon className="size-4" />
              {form.id ? 'Save reminder' : 'Add reminder'}
            </button>
          </div>
        </form>

        <div className="px-6 py-4 space-y-4">
          {reminders.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">No reminders yet. Add one above.</p>
          )}
          {STATUS_ORDER.map((status) => {
            const list = grouped[status]
            if (list.length === 0) return null
            const meta = REMINDER_STATUS_META[status]
            return (
              <div key={status}>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  {meta.emoji} {meta.label} ({list.length})
                </h3>
                <ul className="space-y-2">
                  {list.map((r) => (
                    <ReminderRow
                      key={r.id}
                      reminder={r}
                      onToggleComplete={() => mutate(r.id, toggleComplete)}
                      onSnooze={(newDate) => mutate(r.id, (x) => ({ ...x, dueDate: newDate }))}
                      onDelete={() => removeReminder(r.id)}
                      onEdit={() => setForm({ id: r.id, title: r.title, type: r.type, dueDate: r.dueDate, priority: r.priority, notes: r.notes || '' })}
                    />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
