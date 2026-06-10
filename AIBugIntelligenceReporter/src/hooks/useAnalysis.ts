import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalysisStore } from '@/store/analysisStore'
import { useHistoryStore } from '@/store/historyStore'
import { AnalysisRequest, StreamEvent } from '@/types'

export function useAnalysis() {
  const navigate = useNavigate()
  const {
    pendingUpload,
    selectedProject,
    userContext,
    startAnalysis,
    setAgentRunning,
    setAgentComplete,
    setAgentError,
    setAnalysisComplete,
    setAnalysisError,
  } = useAnalysisStore()
  const addReport = useHistoryStore((s) => s.addReport)

  const run = useCallback(async () => {
    if (!pendingUpload) return

    startAnalysis()
    navigate('/analyze')

    const request: AnalysisRequest = {
      media: {
        type: pendingUpload.type,
        filename: pendingUpload.filename,
        imageData: pendingUpload.imageData,
        frames: pendingUpload.frames,
        textContent: pendingUpload.textContent,
        traceContent: pendingUpload.traceContent,
        traceScreenshots: pendingUpload.traceScreenshots,
      },
      userContext: userContext || undefined,
      jiraProjectKey: selectedProject?.key,
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok || !response.body) {
        const err = await response.text()
        setAnalysisError(err || 'Analysis request failed')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const event = JSON.parse(line) as StreamEvent
            handleEvent(event)
          } catch {
            // ignore malformed line
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      setAnalysisError(message)
    }

    function handleEvent(event: StreamEvent) {
      switch (event.event) {
        case 'agent_start':
          setAgentRunning(event.agent)
          break
        case 'agent_complete':
          setAgentComplete(event.agent, event.duration)
          break
        case 'complete':
          setAnalysisComplete(event.bugReport)
          addReport(event.bugReport)
          setTimeout(() => navigate(`/report/${event.bugReport.id}`), 600)
          break
        case 'error':
          setAnalysisError(event.message)
          break
      }
    }
  }, [
    pendingUpload, selectedProject, userContext,
    startAnalysis, setAgentRunning, setAgentComplete,
    setAgentError, setAnalysisComplete, setAnalysisError,
    addReport, navigate,
  ])

  return { run }
}
