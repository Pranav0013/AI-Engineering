import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BORDER_COLOR, daysSince } from '../lib/utils'
import { cardIndicator } from '../lib/reminders'
import { BellIcon, ExternalLinkIcon, InterviewPrepIcon, TrashIcon } from './icons'

const INDICATOR_CLASS = {
  overdue: 'text-rejected bg-rejected/10 border-rejected/30',
  dueToday: 'text-followup bg-followup/10 border-followup/30',
  upcoming: 'text-offer bg-offer/10 border-offer/30',
}

const INDICATOR_EMOJI = { overdue: '🔴', dueToday: '🟡', upcoming: '🟢' }

export function JobCardContent({ job, onDelete, onOpenInterviewPrep, onOpenReminders }) {
  const days = daysSince(job.dateApplied)
  const dayLabel = days === null ? '' : days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`
  const indicator = cardIndicator(job)
  const activeReminders = (job.reminders || []).filter((r) => !r.completed).length

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate tracking-tight">
          {job.company}
        </h3>
        <div className="flex items-center gap-0.5 shrink-0">
          {job.jobUrl && (
            <a
              href={job.jobUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-slate-400 hover:text-brand p-1 -m-1 rounded-md hover:bg-brand/10 transition-colors"
              title="Open job posting"
            >
              <ExternalLinkIcon className="size-3.5" />
            </a>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(job)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-slate-300 dark:text-slate-600 hover:text-rejected p-1 -m-1 rounded-md hover:bg-rejected/10 transition-all opacity-0 group-hover:opacity-100"
              title="Delete"
            >
              <TrashIcon className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate">{job.role}</p>

      <div className="flex items-center justify-between gap-2 mt-0.5">
        {job.resume ? (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[60%]">
            {job.resume}
          </span>
        ) : (
          <span />
        )}
        {dayLabel && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{dayLabel}</span>
        )}
      </div>

      {indicator && (
        <span
          className={`mt-1 inline-flex items-center gap-1 self-start rounded-md border px-2 py-0.5 text-[11px] font-semibold ${INDICATOR_CLASS[indicator.status]}`}
          title="Most urgent reminder"
        >
          {INDICATOR_EMOJI[indicator.status]} {indicator.label}
        </span>
      )}

      {(onOpenReminders || onOpenInterviewPrep) && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {onOpenReminders && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenReminders(job)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="relative flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-applied/25 bg-applied/10 hover:bg-applied/20 text-applied text-xs font-semibold py-1.5 transition-all active:scale-[0.97] cursor-pointer"
              title="Manage reminders for this job"
              aria-label="Manage reminders"
            >
              <BellIcon className="size-3.5" />
              Reminders
              {activeReminders > 0 && (
                <span className="ml-0.5 min-w-4 h-4 px-1 rounded-full bg-applied text-white text-[10px] font-bold flex items-center justify-center">
                  {activeReminders > 9 ? '9+' : activeReminders}
                </span>
              )}
            </button>
          )}
          {onOpenInterviewPrep && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenInterviewPrep(job)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-interview/25 bg-interview/10 hover:bg-interview/20 text-interview text-xs font-semibold py-1.5 transition-all active:scale-[0.97] cursor-pointer"
              title="Generate AI interview prep questions"
              aria-label="Generate AI interview prep questions"
            >
              <InterviewPrepIcon className="size-3.5" />
              Prep
            </button>
          )}
        </div>
      )}
    </>
  )
}

export default function JobCard({ job, onEdit, onDelete, onOpenInterviewPrep, onOpenReminders }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: job.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(job)}
      className={`group cursor-grab active:cursor-grabbing rounded-xl border border-slate-200/80 dark:border-slate-700/50 border-l-4 ${BORDER_COLOR[job.status]} bg-white dark:bg-slate-900/80 shadow-sm hover:shadow-xl hover:shadow-slate-900/10 dark:hover:shadow-black/40 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 p-3 flex flex-col gap-1.5`}
    >
      <JobCardContent
        job={job}
        onDelete={onDelete}
        onOpenInterviewPrep={onOpenInterviewPrep}
        onOpenReminders={onOpenReminders}
      />
    </div>
  )
}
