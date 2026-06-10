import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FileImage, Video, FlaskConical, Terminal, ExternalLink, Trash2 } from 'lucide-react'
import { BugReport, MediaType } from '@/types'
import { useHistoryStore } from '@/store/historyStore'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'

const MEDIA_ICONS: Record<MediaType, typeof FileImage> = {
  screenshot: FileImage,
  video: Video,
  playwright_trace: FlaskConical,
  console_log: Terminal,
}

const MEDIA_COLORS: Record<MediaType, string> = {
  screenshot: 'text-blue-400 bg-blue-500/10',
  video: 'text-purple-400 bg-purple-500/10',
  playwright_trace: 'text-green-400 bg-green-500/10',
  console_log: 'text-orange-400 bg-orange-500/10',
}

interface ReportCardProps {
  report: BugReport
  index: number
}

export function ReportCard({ report, index }: ReportCardProps) {
  const navigate = useNavigate()
  const removeReport = useHistoryStore((s) => s.removeReport)
  const Icon = MEDIA_ICONS[report.mediaType]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-[#16161a] p-4 transition-all duration-200 hover:border-white/[0.12] hover:bg-[#1c1c21]"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', MEDIA_COLORS[report.mediaType])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-white/85 leading-snug">
            {report.report.title}
          </p>
          <p className="mt-0.5 text-xs text-white/35 truncate">{report.filename}</p>
        </div>
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge severity={report.classification.severity} size="sm" />
        <Badge variant="secondary" className="text-[10px]">{report.classification.category}</Badge>
        {report.jiraTicket && (
          <Badge variant="violet" className="text-[10px] font-mono">
            {report.jiraTicket.ticketId}
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/25">{formatRelative(report.createdAt)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => { e.stopPropagation(); removeReport(report.id) }}
          >
            <Trash2 className="h-3.5 w-3.5 text-white/30" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => navigate(`/report/${report.id}`)}
          >
            <ExternalLink className="h-3.5 w-3.5 text-white/50" />
          </Button>
        </div>
      </div>

      {/* Click overlay */}
      <button
        onClick={() => navigate(`/report/${report.id}`)}
        className="absolute inset-0 rounded-xl"
        aria-label={`View report: ${report.report.title}`}
      />
    </motion.div>
  )
}
