import { motion } from 'framer-motion'
import { Image, Video, FlaskConical, Terminal } from 'lucide-react'
import { MediaType } from '@/types'
import { MEDIA_TYPE_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'

const ICONS = { Image, Video, FlaskConical, Terminal }

interface FileTypeCardProps {
  type: MediaType
  selected: boolean
  onSelect: (type: MediaType) => void
}

export function FileTypeCard({ type, selected, onSelect }: FileTypeCardProps) {
  const config = MEDIA_TYPE_CONFIG[type]
  const Icon = ICONS[config.icon as keyof typeof ICONS]

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(type)}
      className={cn(
        'relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200',
        selected
          ? 'border-violet-500/40 bg-violet-500/8 shadow-lg shadow-violet-500/10'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
      )}
    >
      {selected && (
        <motion.div
          layoutId="selected-indicator"
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/8 to-purple-500/4"
        />
      )}
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br',
          config.gradient
        )}
      >
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="relative">
        <p className={cn('text-sm font-medium', selected ? 'text-white' : 'text-white/70')}>
          {config.label}
        </p>
        <p className="mt-0.5 text-xs text-white/35 leading-relaxed">{config.description}</p>
      </div>
      {selected && (
        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-violet-400 shadow-sm shadow-violet-400/50" />
      )}
    </motion.button>
  )
}
