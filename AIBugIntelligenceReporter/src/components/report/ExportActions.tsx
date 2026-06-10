import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Download, Loader2, CheckCircle2, AlertCircle, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { BugReport, JiraAttachment, JiraProject } from '@/types'
import { useAnalysisStore } from '@/store/analysisStore'
import { useHistoryStore } from '@/store/historyStore'
import { downloadJSON, getReportAttachments } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface ExportActionsProps {
  report: BugReport
  projects: JiraProject[]
  projectsLoading: boolean
}

export function ExportActions({ report, projects, projectsLoading }: ExportActionsProps) {
  const [jiraLoading, setJiraLoading] = useState(false)
  const [jiraSuccess, setJiraSuccess] = useState(false)
  const [attachDialogOpen, setAttachDialogOpen] = useState(false)
  const [selectedProjectKey, setSelectedProjectKey] = useState(report.jiraTicket?.projectKey ?? '')
  const updateCurrentReportJira = useAnalysisStore((s) => s.updateCurrentReportJira)
  const pendingUpload = useAnalysisStore((s) => s.pendingUpload)
  const updateReport = useHistoryStore((s) => s.updateReport)

  const attachments = useMemo(() => getReportAttachments(pendingUpload), [pendingUpload])

  async function exportToJira(attachmentsToSend?: JiraAttachment[]) {
    if (!selectedProjectKey) {
      toast.error('Select a Jira project first')
      return
    }
    setJiraLoading(true)
    try {
      const res = await fetch('/api/jira/create-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bugReport: report,
          projectKey: selectedProjectKey,
          attachments: attachmentsToSend,
        }),
      })
      const data = await res.json() as { ticketId: string; ticketUrl: string; projectKey: string; error?: string; attachmentError?: string }
      if (!res.ok) throw new Error(data.error ?? 'Jira export failed')

      const jiraRef = { ticketId: data.ticketId, ticketUrl: data.ticketUrl, projectKey: data.projectKey }
      updateCurrentReportJira(jiraRef)
      updateReport(report.id, { jiraTicket: jiraRef })
      setJiraSuccess(true)
      toast.success(`Ticket created: ${data.ticketId}`, {
        action: { label: 'Open', onClick: () => window.open(data.ticketUrl, '_blank') },
      })
      if (data.attachmentError) {
        toast.warning(data.attachmentError)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create Jira ticket')
    } finally {
      setJiraLoading(false)
    }
  }

  function handleCreateClick() {
    if (!selectedProjectKey) {
      toast.error('Select a Jira project first')
      return
    }
    if (attachments.length > 0) {
      setAttachDialogOpen(true)
      return
    }
    void exportToJira()
  }

  function handleAttachChoice(attach: boolean) {
    setAttachDialogOpen(false)
    void exportToJira(attach ? attachments : undefined)
  }

  function exportJSON() {
    downloadJSON(report, `bugreport-${report.id}.json`)
    toast.success('Bug report downloaded as JSON')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-3"
    >
      {/* Jira Export */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/20">
            <span className="text-[10px] font-bold text-blue-400">J</span>
          </div>
          <p className="text-sm font-semibold text-white/80">Export to Jira</p>
        </div>

        {report.jiraTicket ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-green-300">{report.jiraTicket.ticketId}</p>
            </div>
            <a
              href={report.jiraTicket.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-green-400 hover:text-green-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.length === 0 && !projectsLoading && (
              <div className="flex items-center gap-2 text-xs text-orange-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Jira not configured — add credentials to .env</span>
              </div>
            )}
            <Select
              value={selectedProjectKey}
              onValueChange={setSelectedProjectKey}
              disabled={projectsLoading || projects.length === 0}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={projectsLoading ? 'Loading projects…' : 'Select project…'} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.key} value={p.key} className="text-xs">
                    <span className="font-mono text-violet-300 mr-2">{p.key}</span>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleCreateClick}
              disabled={jiraLoading || !selectedProjectKey || jiraSuccess}
              className="w-full h-8 text-xs"
              variant={jiraSuccess ? 'outline' : 'default'}
            >
              {jiraLoading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating ticket…</>
              ) : jiraSuccess ? (
                <><CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Created</>
              ) : (
                <><ExternalLink className="h-3.5 w-3.5" /> Create Jira Ticket</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* JSON Export */}
      <Button onClick={exportJSON} variant="outline" className="w-full h-9 text-xs gap-2">
        <Download className="h-3.5 w-3.5" />
        Download as JSON
      </Button>

      {/* Attach evidence dialog */}
      <Dialog open={attachDialogOpen} onOpenChange={setAttachDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-violet-400" />
              Attach evidence to ticket?
            </DialogTitle>
            <DialogDescription>
              {attachments.length === 1
                ? 'You have 1 screenshot from this analysis. Attach it to the Jira ticket as supporting evidence?'
                : `You have ${attachments.length} ${report.mediaType === 'video' ? 'video frames' : 'screenshots'} from this analysis. Attach them to the Jira ticket as supporting evidence?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => handleAttachChoice(false)}>
              Skip
            </Button>
            <Button size="sm" onClick={() => handleAttachChoice(true)}>
              <Paperclip className="h-3.5 w-3.5" />
              Attach {attachments.length > 1 ? `(${attachments.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
