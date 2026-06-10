import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatDuration } from '@/lib/utils'
import { AgentStep } from './AgentStep'
import { Progress } from '@/components/ui/progress'

export function AnalysisProgress() {
  const { analysisState, pendingUpload } = useAnalysisStore()
  const { steps, isComplete, error, elapsedMs } = analysisState
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickElapsed = useAnalysisStore((s) => s.tickElapsed)

  useEffect(() => {
    if (!isComplete && !error) {
      timerRef.current = setInterval(tickElapsed, 100)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isComplete, error, tickElapsed])

  const completedCount = steps.filter((s) => s.status === 'complete').length
  const progressPct = (completedCount / steps.length) * 100

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0b] bg-grid-pattern px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/30">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Analyzing Bug Evidence</h1>
          <p className="mt-1.5 text-sm text-white/40">
            {pendingUpload?.filename ?? 'Processing your file'} · 4 AI agents running
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{completedCount} of {steps.length} agents complete</span>
            <span className="font-mono">{formatDuration(elapsedMs)}</span>
          </div>
          <Progress value={progressPct} />
        </motion.div>

        {/* Agent steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {steps.map((step, i) => (
            <AgentStep
              key={step.name}
              step={step}
              index={i}
              isLast={i === steps.length - 1}
            />
          ))}
        </motion.div>

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
