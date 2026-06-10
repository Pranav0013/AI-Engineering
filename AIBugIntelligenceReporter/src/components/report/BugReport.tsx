import { motion } from 'framer-motion'
import {
  FileText, ListOrdered, CheckCircle2, XCircle,
  Lightbulb, AlertTriangle, Tag, GitBranch, Info
} from 'lucide-react'
import { BugReport as BugReportType, JiraProject } from '@/types'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { SeverityBadge } from './SeverityBadge'
import { ExportActions } from './ExportActions'
import { ReportSection, StepsList, ErrorBlock, BulletList } from './ReportSection'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface BugReportProps {
  report: BugReportType
  projects: JiraProject[]
  projectsLoading: boolean
}

export function BugReport({ report, projects, projectsLoading }: BugReportProps) {
  const { report: r, observation, classification, rootCause } = report

  return (
    <div className="flex h-full gap-0">
      {/* Main report - left column */}
      <ScrollArea className="flex-1 min-w-0">
        <div className="max-w-3xl p-6 space-y-7">
          {/* Title block */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge severity={classification.severity} size="sm" />
              <Badge variant="default" className="text-[11px]">
                {classification.category}
              </Badge>
              <span className="text-xs text-white/30 font-mono">{report.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight">{r.title}</h1>
            <p className="text-sm text-white/55 leading-relaxed">{r.description}</p>
          </motion.div>

          <Separator />

          {/* Steps to reproduce */}
          <ReportSection icon={ListOrdered} title="Steps to Reproduce" delay={0.05}>
            <StepsList steps={r.stepsToReproduce} />
          </ReportSection>

          {/* Expected / Actual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReportSection icon={CheckCircle2} title="Expected" accent="green" delay={0.08}>
              <p className="text-sm text-white/65 leading-relaxed">{r.expectedResult}</p>
            </ReportSection>
            <ReportSection icon={XCircle} title="Actual" accent="red" delay={0.1}>
              <p className="text-sm text-white/65 leading-relaxed">{r.actualResult}</p>
            </ReportSection>
          </div>

          {/* Error messages verbatim */}
          {observation.errorMessages.length > 0 && (
            <ReportSection icon={AlertTriangle} title="Error Messages (Verbatim)" accent="red" delay={0.12}>
              <ErrorBlock messages={observation.errorMessages} />
            </ReportSection>
          )}

          <Separator />

          {/* Root cause */}
          <ReportSection icon={GitBranch} title="Root Cause Analysis" accent="violet" delay={0.14}>
            <div className="space-y-3">
              <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 p-3">
                <p className="text-sm text-white/75 leading-relaxed">{rootCause.hypothesis}</p>
              </div>
              {rootCause.evidence.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-white/35 mb-2 uppercase tracking-wider">Evidence</p>
                  <BulletList items={rootCause.evidence} />
                </div>
              )}
              {rootCause.technicalDetails && (
                <div>
                  <p className="text-xs font-medium text-white/35 mb-2 uppercase tracking-wider">Technical Details</p>
                  <p className="text-sm text-white/55 leading-relaxed">{rootCause.technicalDetails}</p>
                </div>
              )}
            </div>
          </ReportSection>

          {/* Suggested fix */}
          <ReportSection icon={Lightbulb} title="Suggested Fix" accent="orange" delay={0.16}>
            <div className="rounded-lg border border-orange-500/15 bg-orange-500/5 p-3">
              <p className="text-sm text-white/75 leading-relaxed">{r.suggestedFix}</p>
            </div>
          </ReportSection>

          {/* Tags */}
          {classification.tags && classification.tags.length > 0 && (
            <ReportSection icon={Tag} title="Tags" delay={0.18}>
              <div className="flex flex-wrap gap-1.5">
                {classification.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </ReportSection>
          )}

          {/* Additional context */}
          {r.additionalContext && (
            <ReportSection icon={Info} title="Additional Context" delay={0.2}>
              <p className="text-sm text-white/50 leading-relaxed">{r.additionalContext}</p>
            </ReportSection>
          )}

          {/* Description from observation */}
          <ReportSection icon={FileText} title="AI Observation" delay={0.22}>
            <p className="text-sm text-white/40 leading-relaxed italic">{observation.rawDescription}</p>
          </ReportSection>
        </div>
      </ScrollArea>

      {/* Sidebar - right column */}
      <div className="w-72 shrink-0 border-l border-white/[0.06] bg-[#111113]">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            <SeverityBadge severity={classification.severity} confidence={classification.confidence} />
            <ExportActions report={report} projects={projects} projectsLoading={projectsLoading} />

            {/* Meta */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Details</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/35">Component</span>
                  <span className="text-white/65 font-medium text-right max-w-[130px] truncate">
                    {classification.affectedComponent || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/35">Bug type</span>
                  <span className="text-white/65 font-medium text-right max-w-[130px] truncate">
                    {classification.bugType || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/35">Category</span>
                  <span className="text-white/65 font-medium capitalize">{classification.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/35">Regression</span>
                  <span className={rootCause.possibleRegression ? 'text-orange-400 font-medium' : 'text-white/40'}>
                    {rootCause.possibleRegression ? 'Possible' : 'Unlikely'}
                  </span>
                </div>
                {classification.environment && (
                  <div className="flex justify-between">
                    <span className="text-white/35">Environment</span>
                    <span className="text-white/65 font-medium text-right max-w-[130px] truncate">
                      {classification.environment}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
