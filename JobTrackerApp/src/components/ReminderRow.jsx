import { useState } from 'react'
import {
  addDays,
  dueLabel,
  PRIORITY_META,
  REMINDER_STATUS_META,
  reminderStatus,
  reminderTypeLabel,
} from '../lib/reminders'
import { todayISODate } from '../lib/utils'
import { CheckCircleIcon, ClockIcon, PencilIcon, TrashIcon } from './icons'

const STATUS_CHIP = {
  overdue: 'text-rejected bg-rejected/10 border-rejected/30',
  dueToday: 'text-followup bg-followup/10 border-followup/30',
  upcoming: 'text-offer bg-offer/10 border-offer/30',
  completed: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
}

function RowButton({ onClick, title, icon: Icon, active, activeClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center size-7 rounded-md transition-colors cursor-pointer ${
        active
          ? activeClass || 'text-applied bg-applied/10'
          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className="size-3.5" />
    </button>
  )
}

export default function ReminderRow({ reminder, jobLabel, onToggleComplete, onSnooze, onDelete, onEdit }) {
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const today = todayISODate()
  const status = reminderStatus(reminder, today)
  const meta = REMINDER_STATUS_META[status]
  const priority = PRIORITY_META[reminder.priority] || PRIORITY_META.MEDIUM

  function snooze(days) {
    setSnoozeOpen(false)
    onSnooze(addDays(today, days))
  }

  return (
    <li className="rounded-md border border-slate-200 dark:border-slate-800 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${
              reminder.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {reminder.title}
          </p>
          {jobLabel && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{jobLabel}</p>}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_CHIP[status]}`}>
              {meta.emoji} {dueLabel(reminder, today)}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {reminderTypeLabel(reminder.type)}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${priority.className}`}>{priority.label}</span>
          </div>
          {reminder.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 whitespace-pre-wrap">{reminder.notes}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 mt-1.5">
        <RowButton
          onClick={onToggleComplete}
          title={reminder.completed ? 'Reopen' : 'Mark complete'}
          icon={CheckCircleIcon}
          active={reminder.completed}
          activeClass="text-offer bg-offer/10"
        />
        {!reminder.completed && (
          <RowButton
            onClick={() => setSnoozeOpen((v) => !v)}
            title="Snooze"
            icon={ClockIcon}
            active={snoozeOpen}
            activeClass="text-followup bg-followup/10"
          />
        )}
        {onEdit && <RowButton onClick={onEdit} title="Edit reminder" icon={PencilIcon} />}
        <RowButton onClick={onDelete} title="Delete reminder" icon={TrashIcon} activeClass="text-rejected bg-rejected/10" />
      </div>

      {snoozeOpen && !reminder.completed && (
        <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">Snooze to:</span>
          <button type="button" onClick={() => snooze(1)} className="text-xs px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            Tomorrow
          </button>
          <button type="button" onClick={() => snooze(3)} className="text-xs px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            +3 days
          </button>
          <button type="button" onClick={() => snooze(7)} className="text-xs px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            +7 days
          </button>
          <input
            type="date"
            defaultValue={reminder.dueDate}
            onChange={(e) => {
              if (e.target.value) {
                setSnoozeOpen(false)
                onSnooze(e.target.value)
              }
            }}
            className="text-xs px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
          />
        </div>
      )}
    </li>
  )
}
