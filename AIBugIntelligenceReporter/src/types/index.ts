export type MediaType = 'screenshot' | 'video' | 'playwright_trace' | 'console_log'

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type AgentName = 'observation' | 'classification' | 'root_cause' | 'bug_report'

export type BugCategory =
  | 'ui'
  | 'functional'
  | 'performance'
  | 'security'
  | 'data'
  | 'network'
  | 'crash'
  | 'authentication'

export interface UploadedMedia {
  type: MediaType
  filename: string
  size: number
  imageData?: string      // base64, for screenshots
  frames?: string[]       // base64 frames, for videos
  textContent?: string    // raw text, for console/error logs
  traceContent?: string   // extracted JSON text, for playwright traces
  traceScreenshots?: string[] // up to 3 screenshots from trace
}

export interface ObservationResult {
  rawDescription: string
  visualElements: string[]
  errorMessages: string[]  // verbatim - never paraphrased
  uiState: string
  affectedArea: string
  userActions: string[]
}

export interface ClassificationResult {
  bugType: string
  affectedComponent: string
  severity: Severity | null
  severityReason: string
  confidence: number
  tags: string[]
  category: BugCategory
  environment?: string
}

export interface RootCauseResult {
  hypothesis: string
  evidence: string[]
  technicalDetails: string
  affectedSystemArea: string
  possibleRegression: boolean
  relatedPatterns: string[]
}

export interface BugReportFields {
  title: string
  description: string
  stepsToReproduce: string[]
  expectedResult: string
  actualResult: string
  suggestedFix: string
  additionalContext: string
}

export interface JiraTicketRef {
  ticketId: string
  ticketUrl: string
  projectKey: string
}

export interface JiraAttachment {
  filename: string
  base64: string
  mimeType: string
}

export interface BugReport {
  id: string
  createdAt: string
  mediaType: MediaType
  filename: string
  userContext?: string

  observation: ObservationResult
  classification: ClassificationResult
  rootCause: RootCauseResult
  report: BugReportFields

  jiraTicket?: JiraTicketRef
}

export interface JiraProject {
  id: string
  key: string
  name: string
  projectTypeKey: string
  avatarUrls?: { '48x48': string }
}

export interface AgentStep {
  name: AgentName
  label: string
  description: string
  status: 'pending' | 'running' | 'complete' | 'error'
  duration?: number
  error?: string
}

export interface AnalysisState {
  steps: AgentStep[]
  currentAgent: AgentName | null
  isComplete: boolean
  error?: string
  elapsedMs: number
}

export interface AnalysisRequest {
  media: {
    type: MediaType
    filename: string
    imageData?: string
    frames?: string[]
    textContent?: string
    traceContent?: string
    traceScreenshots?: string[]
  }
  userContext?: string
  jiraProjectKey?: string
}

export type StreamEvent =
  | { event: 'agent_start'; agent: AgentName; step: number; total: number }
  | { event: 'agent_complete'; agent: AgentName; step: number; duration: number; result: unknown }
  | { event: 'complete'; bugReport: BugReport }
  | { event: 'error'; message: string }
