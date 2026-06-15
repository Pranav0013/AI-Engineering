import { nowISO, todayISODate } from './utils'

export const REMINDER_TYPES = [
  { key: 'FOLLOW_UP', label: 'Follow Up' },
  { key: 'INTERVIEW', label: 'Interview' },
  { key: 'RECRUITER_RESPONSE', label: 'Recruiter Response' },
  { key: 'APPLICATION_CHECK', label: 'Application Check' },
  { key: 'OFFER_DEADLINE', label: 'Offer Deadline' },
  { key: 'CUSTOM', label: 'Custom' },
]

const TYPE_LABEL = Object.fromEntries(REMINDER_TYPES.map((t) => [t.key, t.label]))
export function reminderTypeLabel(type) {
  return TYPE_LABEL[type] || 'Custom'
}

export const REMINDER_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']

export const PRIORITY_META = {
  LOW: { label: 'Low', className: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300' },
  MEDIUM: { label: 'Medium', className: 'text-applied bg-applied/10' },
  HIGH: { label: 'High', className: 'text-rejected bg-rejected/10' },
}

// status → display metadata (reuses existing theme color tokens)
export const REMINDER_STATUS_META = {
  overdue: { label: 'Overdue', emoji: '🔴', token: 'rejected' },
  dueToday: { label: 'Due Today', emoji: '🟡', token: 'followup' },
  upcoming: { label: 'Upcoming', emoji: '🟢', token: 'offer' },
  completed: { label: 'Completed', emoji: '✅', token: 'slate' },
}

// --- date helpers (UTC-safe; ISO date strings are 'YYYY-MM-DD') ---

export function addDays(isoDate, n) {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function daysUntil(dueDate, today = todayISODate()) {
  const a = new Date(today)
  const b = new Date(dueDate)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

// --- status ---

export function reminderStatus(reminder, today = todayISODate()) {
  if (reminder.completed) return 'completed'
  if (reminder.dueDate < today) return 'overdue'
  if (reminder.dueDate === today) return 'dueToday'
  return 'upcoming'
}

// A short label for card/center display, e.g. "Overdue by 3d" / "Due today" / "in 4d"
export function dueLabel(reminder, today = todayISODate()) {
  const status = reminderStatus(reminder, today)
  if (status === 'completed') return 'Completed'
  const diff = daysUntil(reminder.dueDate, today)
  if (status === 'overdue') return `Overdue by ${Math.abs(diff)}d`
  if (status === 'dueToday') return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `Due in ${diff}d`
}

// --- creation ---

export function createReminder({ jobId, title, type = 'CUSTOM', dueDate, priority = 'MEDIUM', notes = '', auto = false }) {
  return {
    id: crypto.randomUUID(),
    jobId,
    title: String(title || '').trim(),
    type,
    dueDate,
    completed: false,
    completedAt: null,
    notes: String(notes || '').trim(),
    priority: REMINDER_PRIORITIES.includes(priority) ? priority : 'MEDIUM',
    auto,
  }
}

// --- auto reminders driven by job status ---

// Returns a descriptor for the auto reminder a status should create, or null.
function autoReminderSpec(job) {
  const today = todayISODate()
  switch (job.status) {
    case 'applied':
      return {
        type: 'FOLLOW_UP',
        title: 'Follow up with recruiter',
        dueDate: addDays(job.dateApplied || today, 7),
        priority: 'MEDIUM',
      }
    case 'followup':
      return {
        type: 'RECRUITER_RESPONSE',
        title: 'Check recruiter response',
        dueDate: addDays(today, 5),
        priority: 'MEDIUM',
      }
    case 'interview':
      return {
        type: 'INTERVIEW',
        title: 'Prepare for interview',
        dueDate: addDays(today, 2),
        priority: 'HIGH',
      }
    case 'offer':
      return {
        type: 'OFFER_DEADLINE',
        title: 'Review & respond to offer',
        dueDate: addDays(today, 3),
        priority: 'HIGH',
      }
    default:
      return null // wishlist, rejected → no auto reminder
  }
}

// Returns a (possibly unchanged) reminders array for the job, appending the
// status-appropriate auto reminder only if no reminder of that type exists yet.
export function appendAutoReminder(job) {
  const existing = job.reminders || []
  const spec = autoReminderSpec(job)
  if (!spec) return existing
  if (existing.some((r) => r.type === spec.type)) return existing
  return [...existing, createReminder({ jobId: job.id, auto: true, ...spec })]
}

// --- aggregation for the Reminder Center ---

export function flattenReminders(jobs) {
  const out = []
  for (const job of jobs) {
    for (const reminder of job.reminders || []) {
      out.push({ reminder, job })
    }
  }
  return out
}

export function summarizeReminders(jobs, today = todayISODate()) {
  let total = 0
  let overdue = 0
  let dueToday = 0
  let upcoming = 0
  let completed = 0
  for (const { reminder } of flattenReminders(jobs)) {
    total += 1
    const status = reminderStatus(reminder, today)
    if (status === 'overdue') overdue += 1
    else if (status === 'dueToday') dueToday += 1
    else if (status === 'upcoming') upcoming += 1
    else if (status === 'completed') completed += 1
  }
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { total, overdue, dueToday, upcoming, completed, completionRate }
}

// The single most-urgent active reminder for a job card (or null).
export function cardIndicator(job, today = todayISODate()) {
  const active = (job.reminders || []).filter((r) => !r.completed)
  if (active.length === 0) return null

  const overdue = active.filter((r) => reminderStatus(r, today) === 'overdue')
  if (overdue.length) {
    const soonest = overdue.reduce((a, b) => (a.dueDate <= b.dueDate ? a : b))
    return { status: 'overdue', label: `${reminderTypeLabel(soonest.type)} overdue` }
  }

  const dueToday = active.filter((r) => reminderStatus(r, today) === 'dueToday')
  if (dueToday.length) {
    return { status: 'dueToday', label: 'Action due today' }
  }

  const next = active.reduce((a, b) => (a.dueDate <= b.dueDate ? a : b))
  return { status: 'upcoming', label: `Next action in ${daysUntil(next.dueDate, today)}d` }
}

// Buckets upcoming items (each { reminder, job }) by timeframe for the Center.
export function groupUpcoming(items, today = todayISODate()) {
  const buckets = { today: [], tomorrow: [], thisWeek: [], nextWeek: [], later: [] }
  for (const item of items) {
    const diff = daysUntil(item.reminder.dueDate, today)
    if (diff <= 0) buckets.today.push(item)
    else if (diff === 1) buckets.tomorrow.push(item)
    else if (diff <= 7) buckets.thisWeek.push(item)
    else if (diff <= 14) buckets.nextWeek.push(item)
    else buckets.later.push(item)
  }
  return buckets
}

// Mark complete / reopen helpers (pure — return a new reminder).
export function toggleComplete(reminder) {
  if (reminder.completed) return { ...reminder, completed: false, completedAt: null }
  return { ...reminder, completed: true, completedAt: nowISO() }
}
