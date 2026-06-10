import { Severity } from '@/types'
import { SEVERITY_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  severity: Severity | null
  size?: 'sm' | 'md' | 'lg'
  showDot?: boolean
  className?: string
}

export function StatusBadge({ severity, size = 'md', showDot = true, className }: StatusBadgeProps) {
  if (!severity) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 font-medium text-white/40',
          size === 'sm' && 'px-2 py-0.5 text-xs',
          size === 'md' && 'px-2.5 py-1 text-xs',
          size === 'lg' && 'px-3 py-1.5 text-sm',
          className
        )}
      >
        {showDot && <span className="h-1.5 w-1.5 rounded-full bg-white/20" />}
        Unknown
      </span>
    )
  }

  const config = SEVERITY_CONFIG[severity]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.badge,
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1.5 text-sm',
        className
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />}
      {config.label}
    </span>
  )
}
