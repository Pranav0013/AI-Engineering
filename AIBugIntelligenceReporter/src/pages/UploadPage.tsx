import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ChevronRight } from 'lucide-react'
import { MediaType, UploadedMedia } from '@/types'
import { useAnalysisStore } from '@/store/analysisStore'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useJiraProjects } from '@/hooks/useJiraProjects'
import { FileTypeCard } from '@/components/upload/FileTypeCard'
import { UploadZone } from '@/components/upload/UploadZone'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

const MEDIA_TYPES: MediaType[] = ['screenshot', 'video', 'playwright_trace', 'console_log']

export function UploadPage() {
  const [selectedType, setSelectedType] = useState<MediaType>('screenshot')
  const { pendingUpload, userContext, selectedProject, setPendingUpload, setUserContext, setSelectedProject } =
    useAnalysisStore()
  const { run } = useAnalysis()
  const { data: projects = [], isLoading: projectsLoading } = useJiraProjects()

  function handleFileReady(media: UploadedMedia) {
    setPendingUpload(media)
  }

  function handleTypeSelect(type: MediaType) {
    setSelectedType(type)
    setPendingUpload(null)
  }

  const canAnalyze = !!pendingUpload

  return (
    <div className="min-h-screen bg-[#0a0a0b] bg-grid-pattern">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/8 px-3.5 py-1.5 text-xs font-medium text-violet-300">
            <Sparkles className="h-3 w-3" />
            4-Agent AI Pipeline
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Analyze Bugs with AI
          </h1>
          <p className="mt-3 text-base text-white/45 max-w-md mx-auto leading-relaxed">
            Upload a screenshot, video, trace, or log file. Our AI pipeline generates a complete
            structured bug report and creates your Jira ticket automatically.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl"
        >
          <div className="p-6 space-y-6">
            {/* File type selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                What are you uploading?
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MEDIA_TYPES.map((type) => (
                  <FileTypeCard
                    key={type}
                    type={type}
                    selected={selectedType === type}
                    onSelect={handleTypeSelect}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Drop zone */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Upload file
              </label>
              <UploadZone
                mediaType={selectedType}
                onFileReady={handleFileReady}
                currentFile={pendingUpload}
                onClear={() => setPendingUpload(null)}
              />
            </div>

            <Separator />

            {/* Context */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Additional context{' '}
                <span className="normal-case font-normal text-white/25">(optional)</span>
              </label>
              <Textarea
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                placeholder="e.g. 'This happens on the checkout page when the user is logged in and has items in cart…'"
                className="min-h-[72px] text-sm"
              />
            </div>

            {/* Jira project */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Jira project{' '}
                <span className="normal-case font-normal text-white/25">(optional — creates ticket automatically)</span>
              </label>
              <Select
                value={selectedProject?.key ?? ''}
                onValueChange={(key) => {
                  const p = projects.find((pr) => pr.key === key) ?? null
                  setSelectedProject(p)
                }}
                disabled={projectsLoading || projects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      projectsLoading
                        ? 'Loading Jira projects…'
                        : projects.length === 0
                        ? 'No Jira projects found (check .env)'
                        : 'Select a project…'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      <span className="font-mono text-violet-300 mr-2">{p.key}</span>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CTA */}
            <Button
              onClick={run}
              disabled={!canAnalyze}
              variant="gradient"
              size="lg"
              className="w-full gap-2 h-12 text-base font-semibold shadow-xl shadow-violet-500/25"
            >
              <Sparkles className="h-5 w-5" />
              Analyze Bug
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center text-xs text-white/20"
        >
          Powered by Groq · Llama 4 Scout · 4 specialized AI agents
        </motion.p>
      </div>
    </div>
  )
}
