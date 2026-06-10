import { motion } from 'framer-motion'
import { ShieldAlert, ShieldX, Shield, ShieldCheck } from 'lucide-react'
import { Severity } from '@/types'
import { SEVERITY_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'

const ICONS = {
  critical: ShieldX,
  high: ShieldAlert,
  medium: Shield,
  low: ShieldCheck,
}

interface SeverityBadgeProps {
  severity: Severity | null
  confidence?: number
}

export function SeverityBadge({ severity, confidence }: SeverityBadgeProps) {
  if (!severity) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
        <p className="text-sm font-semibold text-white/40">Severity Undetermined</p>
        <p className="mt-1 text-xs text-white/25">Please set manually before export</p>
      </div>
    )
  }

  const config = SEVERITY_CONFIG[severity]
  const Icon = ICONS[severity]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn('rounded-xl border p-4', config.bg, config.border)}
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', config.bg, 'border', config.border)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Severity</p>
          <p className={cn('text-lg font-bold mt-0.5', config.color)}>{config.label}</p>
        </div>
      </div>
      {confidence !== undefined && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-white/40">AI confidence</span>
          <span className="text-xs font-mono font-medium text-white/60">{confidence}%</span>
        </div>
      )}
    </motion.div>
  )
}
