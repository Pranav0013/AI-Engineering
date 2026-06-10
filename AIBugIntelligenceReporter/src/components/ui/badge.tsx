import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-white/10 bg-white/5 text-white/70',
        secondary: 'border-white/8 bg-white/4 text-white/60',
        outline: 'border-white/15 bg-transparent text-white/70',
        violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
        critical: 'border-red-500/30 bg-red-500/10 text-red-300',
        high: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
        medium: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
        low: 'border-green-500/30 bg-green-500/10 text-green-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
