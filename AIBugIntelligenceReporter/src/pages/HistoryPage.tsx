import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { History, Trash2, Upload, Filter } from 'lucide-react'
import { useHistoryStore } from '@/store/historyStore'
import { Severity } from '@/types'
import { ReportCard } from '@/components/dashboard/ReportCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SEVERITY_CONFIG } from '@/lib/constants'

type FilterSeverity = Severity | 'all'

const FILTERS: { label: string; value: FilterSeverity }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
]

export function HistoryPage() {
  const navigate = useNavigate()
  const { reports, clearAll } = useHistoryStore()
  const [filter, setFilter] = useState<FilterSeverity>('all')

  const filtered = filter === 'all'
    ? reports
    : reports.filter((r) => r.classification.severity === filter)

  const stats = {
    critical: reports.filter((r) => r.classification.severity === 'critical').length,
    high: reports.filter((r) => r.classification.severity === 'high').length,
    medium: reports.filter((r) => r.classification.severity === 'medium').length,
    low: reports.filter((r) => r.classification.severity === 'low').length,
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0a0a0b]/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <History className="h-5 w-5 text-violet-400" />
              <h1 className="text-base font-bold text-white">Bug History</h1>
              <Badge variant="violet" className="text-xs">{reports.length}</Badge>
            </div>
            {reports.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white/30 hover:text-red-400 gap-1.5 text-xs"
                onClick={() => {
                  if (confirm('Clear all reports? This cannot be undone.')) clearAll()
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear all
              </Button>
            )}
          </div>

          {/* Stats */}
          {reports.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(stats) as Severity[]).map((sev) => (
                stats[sev] > 0 && (
                  <div
                    key={sev}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${SEVERITY_CONFIG[sev].badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_CONFIG[sev].dot}`} />
                    {stats[sev]} {SEVERITY_CONFIG[sev].label}
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {reports.length === 0 ? (
          <EmptyState
            icon={History}
            title="No bug reports yet"
            description="Upload a screenshot, video, trace, or log file to generate your first AI-powered bug report."
            action={
              <Button onClick={() => navigate('/')} variant="outline" size="sm" className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Analyze a bug
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Severity filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-white/30 shrink-0" />
              {FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    filter === value
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                      : 'border-white/[0.06] bg-transparent text-white/40 hover:border-white/[0.12] hover:text-white/60'
                  }`}
                >
                  {label}
                  {value !== 'all' && stats[value as Severity] > 0 && (
                    <span className="ml-1.5 opacity-60">{stats[value as Severity]}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <p className="text-sm text-white/30">No reports match this filter</p>
              </motion.div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((report, i) => (
                  <ReportCard key={report.id} report={report} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
