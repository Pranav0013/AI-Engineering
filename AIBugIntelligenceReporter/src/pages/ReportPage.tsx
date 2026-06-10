import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock } from 'lucide-react'
import { useHistoryStore } from '@/store/historyStore'
import { useAnalysisStore } from '@/store/analysisStore'
import { useJiraProjects } from '@/hooks/useJiraProjects'
import { BugReport } from '@/components/report/BugReport'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/common/StatusBadge'

export function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const getReport = useHistoryStore((s) => s.getReport)
  const currentReport = useAnalysisStore((s) => s.currentReport)
  const { data: projects = [], isLoading: projectsLoading } = useJiraProjects()

  const report = (id ? getReport(id) : null) ?? currentReport

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-white/60">Report not found</p>
          <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0b] overflow-hidden">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#111113] px-4"
      >
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-white/[0.08]" />
        <StatusBadge severity={report.classification.severity} size="sm" />
        <p className="flex-1 truncate text-sm font-semibold text-white/80">{report.report.title}</p>
        <div className="flex items-center gap-1.5 text-xs text-white/30 shrink-0">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatDate(report.createdAt)}</span>
        </div>
      </motion.div>

      {/* Report content */}
      <div className="flex-1 overflow-hidden">
        <BugReport report={report} projects={projects} projectsLoading={projectsLoading} />
      </div>
    </div>
  )
}
