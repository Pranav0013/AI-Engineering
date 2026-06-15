import { useMemo, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core'
import Column from './Column'
import { JobCardContent } from './JobCard'
import { BORDER_COLOR, STATUSES } from '../lib/utils'

export default function Board({ jobsByStatus, onDragEnd, onEdit, onDelete, onOpenInterviewPrep, onOpenReminders }) {
  const [activeJob, setActiveJob] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const allJobs = useMemo(() => Object.values(jobsByStatus).flat(), [jobsByStatus])

  function handleDragStart(event) {
    setActiveJob(allJobs.find((job) => job.id === event.active.id) ?? null)
  }

  function handleDragEnd(event) {
    setActiveJob(null)
    onDragEnd(event)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveJob(null)}
    >
      <div className="flex-1 flex gap-4 sm:gap-5 overflow-x-auto scroll-thin items-stretch pb-1">
        {STATUSES.map((status) => (
          <Column
            key={status.id}
            status={status}
            jobs={jobsByStatus[status.id] || []}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenInterviewPrep={onOpenInterviewPrep}
            onOpenReminders={onOpenReminders}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeJob && (
          <div
            className={`rotate-3 scale-[1.03] cursor-grabbing rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${BORDER_COLOR[activeJob.status]} bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/25 ring-1 ring-black/5 p-3 flex flex-col gap-1.5 w-72`}
          >
            <JobCardContent job={activeJob} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
