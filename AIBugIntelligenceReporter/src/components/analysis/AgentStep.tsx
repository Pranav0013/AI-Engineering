import { motion } from 'framer-motion'
import { Check, Loader2, AlertCircle, Circle } from 'lucide-react'
import { AgentStep as AgentStepType } from '@/types'
import { formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface AgentStepProps {
  step: AgentStepType
  index: number
  isLast: boolean
}

export function AgentStep({ step, index, isLast }: AgentStepProps) {
  const isRunning = step.status === 'running'
  const isComplete = step.status === 'complete'
  const isError = step.status === 'error'
  const isPending = step.status === 'pending'

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="relative flex gap-4"
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[18px] top-10 bottom-0 w-px">
          <div
            className={cn(
              'h-full w-full transition-all duration-700',
              isComplete ? 'bg-violet-500/40' : 'bg-white/[0.06]'
            )}
          />
        </div>
      )}

      {/* Icon */}
      <div className="relative z-10 flex-shrink-0 mt-0.5">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300',
            isComplete && 'border-violet-500/50 bg-violet-500/10',
            isRunning && 'border-violet-500/80 bg-violet-500/15',
            isError && 'border-red-500/50 bg-red-500/10',
            isPending && 'border-white/[0.10] bg-white/[0.03]'
          )}
        >
          {isRunning && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-pulse-ring" />
            </>
          )}
          {isComplete && <Check className="h-4 w-4 text-violet-400" strokeWidth={2.5} />}
          {isError && <AlertCircle className="h-4 w-4 text-red-400" />}
          {isPending && <Circle className="h-3 w-3 text-white/20 fill-white/10" />}
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 rounded-xl border p-4 mb-3 transition-all duration-300',
          isRunning && 'border-violet-500/25 bg-violet-500/5 shadow-lg shadow-violet-500/10',
          isComplete && 'border-white/[0.06] bg-white/[0.02]',
          isError && 'border-red-500/20 bg-red-500/5',
          isPending && 'border-white/[0.04] bg-transparent opacity-50'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  'text-sm font-semibold',
                  isRunning && 'text-white',
                  isComplete && 'text-white/80',
                  isError && 'text-red-300',
                  isPending && 'text-white/30'
                )}
              >
                {step.label}
              </p>
              {isRunning && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                  <span className="h-1 w-1 rounded-full bg-violet-400 animate-pulse" />
                  Running
                </span>
              )}
            </div>
            <p
              className={cn(
                'mt-0.5 text-xs leading-relaxed',
                isRunning ? 'text-white/50' : 'text-white/30'
              )}
            >
              {isError ? step.error : step.description}
            </p>
          </div>

          {isComplete && step.duration !== undefined && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="shrink-0 text-xs text-white/30 font-mono"
            >
              {formatDuration(step.duration)}
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
