import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import JobCard from './JobCard'

const DOT_COLOR = {
  wishlist: 'bg-wishlist ring-wishlist/25',
  applied: 'bg-applied ring-applied/25',
  followup: 'bg-followup ring-followup/25',
  interview: 'bg-interview ring-interview/25',
  offer: 'bg-offer ring-offer/25',
  rejected: 'bg-rejected ring-rejected/25',
}

// Static per-status header tint (dynamic class names can't be JIT-compiled).
const HEADER_TINT = {
  wishlist: 'from-wishlist/10',
  applied: 'from-applied/10',
  followup: 'from-followup/10',
  interview: 'from-interview/10',
  offer: 'from-offer/10',
  rejected: 'from-rejected/10',
}

export default function Column({ status, jobs, onEdit, onDelete, onOpenInterviewPrep, onOpenReminders }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id })

  return (
    <div className="flex flex-col w-72 shrink-0 rounded-2xl glass border border-white/60 dark:border-white/5 shadow-lg shadow-slate-900/5 overflow-hidden">
      <div
        className={`flex items-center justify-between px-3.5 py-3 border-b border-slate-200/60 dark:border-white/5 bg-linear-to-b to-transparent ${HEADER_TINT[status.id]}`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ring-4 ${DOT_COLOR[status.id]}`} />
          <h2 className="text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-200">{status.label}</h2>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 ring-1 ring-slate-200/70 dark:ring-slate-700/70 rounded-full px-2 py-0.5 min-w-6 text-center">
          {jobs.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto scroll-thin p-2.5 flex flex-col gap-2.5 min-h-32 transition-colors duration-200 ${
          isOver ? 'bg-brand/5' : ''
        }`}
      >
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenInterviewPrep={onOpenInterviewPrep}
              onOpenReminders={onOpenReminders}
            />
          ))}
        </SortableContext>
        {jobs.length === 0 && (
          <div
            className={`m-1 flex-1 min-h-24 rounded-xl border border-dashed flex items-center justify-center transition-colors ${
              isOver
                ? 'border-brand/50 text-brand'
                : 'border-slate-300/70 dark:border-slate-700/60 text-slate-400 dark:text-slate-600'
            }`}
          >
            <p className="text-xs font-medium">{isOver ? 'Drop here' : 'No jobs'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
