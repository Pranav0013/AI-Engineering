import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReportSectionProps {
  icon: LucideIcon
  title: string
  children: ReactNode
  className?: string
  accent?: 'default' | 'violet' | 'red' | 'orange' | 'green'
  delay?: number
}

const ACCENT_STYLES = {
  default: 'text-white/40 bg-white/[0.05]',
  violet: 'text-violet-400 bg-violet-500/10',
  red: 'text-red-400 bg-red-500/10',
  orange: 'text-orange-400 bg-orange-500/10',
  green: 'text-green-400 bg-green-500/10',
}

export function ReportSection({
  icon: Icon,
  title,
  children,
  className,
  accent = 'default',
  delay = 0,
}: ReportSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn('space-y-3', className)}
    >
      <div className="flex items-center gap-2.5">
        <div className={cn('flex h-6 w-6 items-center justify-center rounded-md', ACCENT_STYLES[accent])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">{title}</h3>
      </div>
      <div>{children}</div>
    </motion.div>
  )
}

export function StepsList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm text-white/70">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] font-bold text-white/40 mt-0.5">
            {i + 1}
          </span>
          <span className="leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  )
}

export function ErrorBlock({ messages }: { messages: string[] }) {
  return (
    <div className="rounded-lg bg-[#0a0a0b] border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
        <div className="flex gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
        </div>
        <span className="text-[10px] text-white/20 font-mono">error log</span>
      </div>
      <pre className="p-3 text-xs font-mono text-red-300/80 whitespace-pre-wrap break-all leading-relaxed">
        {messages.join('\n')}
      </pre>
    </div>
  )
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-white/65">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/25" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}
