import { create } from 'zustand'
import { AgentName, AgentStep, AnalysisState, BugReport, JiraProject, UploadedMedia } from '@/types'
import { AGENT_STEPS } from '@/lib/constants'

function buildInitialSteps(): AgentStep[] {
  return AGENT_STEPS.map((s) => ({ ...s, status: 'pending' as const }))
}

interface AnalysisStore {
  // Upload state
  pendingUpload: UploadedMedia | null
  selectedProject: JiraProject | null
  userContext: string

  // Analysis state
  analysisState: AnalysisState
  currentReport: BugReport | null

  // Actions
  setPendingUpload: (media: UploadedMedia | null) => void
  setSelectedProject: (project: JiraProject | null) => void
  setUserContext: (context: string) => void

  startAnalysis: () => void
  setAgentRunning: (agent: AgentName) => void
  setAgentComplete: (agent: AgentName, duration: number) => void
  setAgentError: (agent: AgentName, error: string) => void
  setAnalysisComplete: (report: BugReport) => void
  setAnalysisError: (message: string) => void
  tickElapsed: () => void

  setCurrentReport: (report: BugReport | null) => void
  updateCurrentReportJira: (jira: BugReport['jiraTicket']) => void
  reset: () => void
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  pendingUpload: null,
  selectedProject: null,
  userContext: '',
  currentReport: null,
  analysisState: {
    steps: buildInitialSteps(),
    currentAgent: null,
    isComplete: false,
    elapsedMs: 0,
  },

  setPendingUpload: (media) => set({ pendingUpload: media }),
  setSelectedProject: (project) => set({ selectedProject: project }),
  setUserContext: (context) => set({ userContext: context }),

  startAnalysis: () =>
    set({
      analysisState: {
        steps: buildInitialSteps(),
        currentAgent: null,
        isComplete: false,
        error: undefined,
        elapsedMs: 0,
      },
      currentReport: null,
    }),

  setAgentRunning: (agent) =>
    set((s) => ({
      analysisState: {
        ...s.analysisState,
        currentAgent: agent,
        steps: s.analysisState.steps.map((step) =>
          step.name === agent ? { ...step, status: 'running' } : step
        ),
      },
    })),

  setAgentComplete: (agent, duration) =>
    set((s) => ({
      analysisState: {
        ...s.analysisState,
        steps: s.analysisState.steps.map((step) =>
          step.name === agent ? { ...step, status: 'complete', duration } : step
        ),
      },
    })),

  setAgentError: (agent, error) =>
    set((s) => ({
      analysisState: {
        ...s.analysisState,
        steps: s.analysisState.steps.map((step) =>
          step.name === agent ? { ...step, status: 'error', error } : step
        ),
      },
    })),

  setAnalysisComplete: (report) =>
    set((s) => ({
      analysisState: {
        ...s.analysisState,
        isComplete: true,
        currentAgent: null,
        steps: s.analysisState.steps.map((step) =>
          step.status === 'running' ? { ...step, status: 'complete' } : step
        ),
      },
      currentReport: report,
    })),

  setAnalysisError: (message) =>
    set((s) => ({
      analysisState: {
        ...s.analysisState,
        error: message,
        steps: s.analysisState.steps.map((step) =>
          step.status === 'running' ? { ...step, status: 'error', error: message } : step
        ),
      },
    })),

  tickElapsed: () =>
    set((s) => ({
      analysisState: {
        ...s.analysisState,
        elapsedMs: s.analysisState.elapsedMs + 100,
      },
    })),

  setCurrentReport: (report) => set({ currentReport: report }),

  updateCurrentReportJira: (jira) =>
    set((s) => ({
      currentReport: s.currentReport ? { ...s.currentReport, jiraTicket: jira } : s.currentReport,
    })),

  reset: () =>
    set({
      pendingUpload: null,
      userContext: '',
      currentReport: null,
      analysisState: {
        steps: buildInitialSteps(),
        currentAgent: null,
        isComplete: false,
        elapsedMs: 0,
      },
    }),
}))
