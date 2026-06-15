import { useMemo, useState } from 'react'
import {
  flattenReminders,
  groupUpcoming,
  REMINDER_PRIORITIES,
  REMINDER_TYPES,
  reminderStatus,
  summarizeReminders,
  toggleComplete,
} from '../lib/reminders'
import { todayISODate } from '../lib/utils'
import { BellIcon, CloseIcon } from './icons'
import ReminderRow from './ReminderRow'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'dueToday', label: 'Due Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
]

const UPCOMING_BUCKETS = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'nextWeek', label: 'Next Week' },
  { key: 'later', label: 'Later' },
]

const selectClass =
  'rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-applied/50 cursor-pointer'

const METRIC_COLOR = {
  rejected: 'text-rejected',
  followup: 'text-followup',
  offer: 'text-offer',
  applied: 'text-applied',
}

function Metric({ label, value, token }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-center">
      <div className={`text-lg font-bold ${METRIC_COLOR[token] || 'text-slate-900 dark:text-slate-100'}`}>{value}</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  )
}

export default function ReminderCenter({ jobs, onUpdateJobReminders, onEditReminder, onClose }) {
  const [tab, setTab] = useState('all')
  const [filters, setFilters] = useState({ priority: 'all', type: 'all', company: 'all', from: '', to: '' })

  const today = todayISODate()
  const metrics = useMemo(() => summarizeReminders(jobs, today), [jobs, today])

  const companies = useMemo(() => {
    const set = new Set()
    for (const { job } of flattenReminders(jobs)) set.add(job.company)
    return [...set].sort()
  }, [jobs])

  // Items filtered by everything EXCEPT the active tab (so tab counts reflect other filters).
  const baseItems = useMemo(() => {
    return flattenReminders(jobs).filter(({ reminder, job }) => {
      if (filters.priority !== 'all' && reminder.priority !== filters.priority) return false
      if (filters.type !== 'all' && reminder.type !== filters.type) return false
      if (filters.company !== 'all' && job.company !== filters.company) return false
      if (filters.from && reminder.dueDate < filters.from) return false
      if (filters.to && reminder.dueDate > filters.to) return false
      return true
    })
  }, [jobs, filters])

  const tabCounts = useMemo(() => {
    const counts = { all: baseItems.length, overdue: 0, dueToday: 0, upcoming: 0, completed: 0 }
    for (const { reminder } of baseItems) counts[reminderStatus(reminder, today)] += 1
    return counts
  }, [baseItems, today])

  const visible = useMemo(() => {
    const items = tab === 'all' ? baseItems : baseItems.filter(({ reminder }) => reminderStatus(reminder, today) === tab)
    return [...items].sort((a, b) => {
      if (a.reminder.completed && b.reminder.completed) return (a.reminder.completedAt || '') > (b.reminder.completedAt || '') ? -1 : 1
      return a.reminder.dueDate < b.reminder.dueDate ? -1 : 1
    })
  }, [baseItems, tab, today])

  function rowFor(item) {
    const { reminder, job } = item
    return (
      <ReminderRow
        key={reminder.id}
        reminder={reminder}
        jobLabel={`${job.company} · ${job.role}`}
        onToggleComplete={() =>
          onUpdateJobReminders(job.id, (job.reminders || []).map((r) => (r.id === reminder.id ? toggleComplete(r) : r)))
        }
        onSnooze={(newDate) =>
          onUpdateJobReminders(job.id, (job.reminders || []).map((r) => (r.id === reminder.id ? { ...r, dueDate: newDate } : r)))
        }
        onDelete={() => onUpdateJobReminders(job.id, (job.reminders || []).filter((r) => r.id !== reminder.id))}
        onEdit={() => onEditReminder(job, reminder.id)}
      />
    )
  }

  const upcomingGroups = useMemo(() => (tab === 'upcoming' ? groupUpcoming(visible, today) : null), [tab, visible, today])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-md p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 animate-pop max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BellIcon className="size-5 text-applied" />
            Reminder Center
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <Metric label="Total" value={metrics.total} />
            <Metric label="Overdue" value={metrics.overdue} token="rejected" />
            <Metric label="Due Today" value={metrics.dueToday} token="followup" />
            <Metric label="Upcoming" value={metrics.upcoming} token="offer" />
            <Metric label="Completed" value={metrics.completed} />
            <Metric label="Completion" value={`${metrics.completionRate}%`} token="applied" />
          </div>
        </div>

        <div className="px-6 pt-3 flex items-center gap-1 flex-wrap border-b border-slate-200 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`text-sm px-3 py-1.5 rounded-t-md border-b-2 transition-colors cursor-pointer ${
                tab === t.key
                  ? 'border-applied text-applied font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t.label} ({tabCounts[t.key]})
            </button>
          ))}
        </div>

        <div className="px-6 py-3 flex items-center gap-2 flex-wrap border-b border-slate-200 dark:border-slate-800">
          <select className={selectClass} value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
            <option value="all">All priorities</option>
            {REMINDER_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <select className={selectClass} value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
            <option value="all">All types</option>
            {REMINDER_TYPES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <select className={selectClass} value={filters.company} onChange={(e) => setFilters((f) => ({ ...f, company: e.target.value }))}>
            <option value="all">All companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input type="date" className={selectClass} value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} title="Due from" />
          <input type="date" className={selectClass} value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} title="Due to" />
          <button
            type="button"
            onClick={() => setFilters({ priority: 'all', type: 'all', company: 'all', from: '', to: '' })}
            className="text-xs px-2 py-1 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Clear
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto scroll-thin flex-1">
          {visible.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No reminders match.</p>
          ) : tab === 'upcoming' ? (
            <div className="space-y-4">
              {UPCOMING_BUCKETS.map(({ key, label }) => {
                const list = upcomingGroups[key]
                if (!list || list.length === 0) return null
                return (
                  <div key={key}>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                      {label} ({list.length})
                    </h3>
                    <ul className="space-y-2">{list.map(rowFor)}</ul>
                  </div>
                )
              })}
            </div>
          ) : (
            <ul className="space-y-2">{visible.map(rowFor)}</ul>
          )}
        </div>
      </div>
    </div>
  )
}
