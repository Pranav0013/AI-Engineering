import type { AnalysisRequest, BugReport, ObservationResult, ClassificationResult, RootCauseResult, BugReportFields } from '../types/index.js'
import { runAgent, runTextAgent } from './groqClient.js'
import {
  OBSERVATION_SYSTEM,
  CLASSIFICATION_SYSTEM,
  ROOT_CAUSE_SYSTEM,
  BUG_REPORT_SYSTEM,
  buildObservationPrompt,
  buildClassificationPrompt,
  buildRootCausePrompt,
  buildBugReportPrompt,
} from './prompts.js'

export type PipelineEvent =
  | { event: 'agent_start'; agent: string; step: number; total: number }
  | { event: 'agent_complete'; agent: string; step: number; duration: number; result: unknown }
  | { event: 'complete'; bugReport: BugReport }
  | { event: 'error'; message: string }

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function getImages(req: AnalysisRequest): string[] {
  const { media } = req
  if (media.imageData) return [media.imageData]
  if (media.frames && media.frames.length > 0) return media.frames.slice(0, 5)
  if (media.traceScreenshots && media.traceScreenshots.length > 0) return media.traceScreenshots.slice(0, 5)
  return []
}

function getTextContent(req: AnalysisRequest): string {
  const { media } = req
  if (media.textContent) return media.textContent.slice(0, 16000)
  if (media.traceContent) return media.traceContent.slice(0, 16000)
  return ''
}

function mediaLabel(req: AnalysisRequest): string {
  const map: Record<string, string> = {
    screenshot: 'screenshot',
    video: 'screen recording (extracted frames)',
    playwright_trace: 'Playwright trace',
    console_log: 'console/error log',
  }
  return map[req.media.type] ?? req.media.type
}

export async function* runPipeline(req: AnalysisRequest): AsyncGenerator<PipelineEvent> {
  const images = getImages(req)
  const textContent = getTextContent(req)
  const hasVisual = images.length > 0
  const total = 4

  // ── Agent 1: Observation ──────────────────────────────────────────────
  yield { event: 'agent_start', agent: 'observation', step: 1, total }
  const t1 = Date.now()

  let observation: ObservationResult
  try {
    const observationPrompt = buildObservationPrompt(mediaLabel(req), req.userContext)

    if (hasVisual) {
      observation = (await runAgent({
        systemPrompt: OBSERVATION_SYSTEM,
        userPrompt: textContent
          ? `${observationPrompt}\n\nAdditional log content:\n${textContent}`
          : observationPrompt,
        images,
      })) as ObservationResult
    } else {
      observation = (await runTextAgent({
        systemPrompt: OBSERVATION_SYSTEM,
        userPrompt: `${observationPrompt}\n\nContent to analyze:\n${textContent}`,
      })) as ObservationResult
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Observation agent failed'
    yield { event: 'error', message: msg }
    return
  }

  yield { event: 'agent_complete', agent: 'observation', step: 1, duration: Date.now() - t1, result: observation }

  // ── Agent 2: Classification ───────────────────────────────────────────
  yield { event: 'agent_start', agent: 'classification', step: 2, total }
  const t2 = Date.now()

  let classification: ClassificationResult
  try {
    classification = (await runTextAgent({
      systemPrompt: CLASSIFICATION_SYSTEM,
      userPrompt: buildClassificationPrompt(observation),
    })) as ClassificationResult
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Classification agent failed'
    yield { event: 'error', message: msg }
    return
  }

  yield { event: 'agent_complete', agent: 'classification', step: 2, duration: Date.now() - t2, result: classification }

  // ── Agent 3: Root Cause ───────────────────────────────────────────────
  yield { event: 'agent_start', agent: 'root_cause', step: 3, total }
  const t3 = Date.now()

  let rootCause: RootCauseResult
  try {
    rootCause = (await runTextAgent({
      systemPrompt: ROOT_CAUSE_SYSTEM,
      userPrompt: buildRootCausePrompt(observation, classification),
    })) as RootCauseResult
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Root cause agent failed'
    yield { event: 'error', message: msg }
    return
  }

  yield { event: 'agent_complete', agent: 'root_cause', step: 3, duration: Date.now() - t3, result: rootCause }

  // ── Agent 4: Bug Report Writer ────────────────────────────────────────
  yield { event: 'agent_start', agent: 'bug_report', step: 4, total }
  const t4 = Date.now()

  let report: BugReportFields
  try {
    report = (await runTextAgent({
      systemPrompt: BUG_REPORT_SYSTEM,
      userPrompt: buildBugReportPrompt(observation, classification, rootCause),
    })) as BugReportFields
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bug report writer failed'
    yield { event: 'error', message: msg }
    return
  }

  yield { event: 'agent_complete', agent: 'bug_report', step: 4, duration: Date.now() - t4, result: report }

  // ── Final Report ──────────────────────────────────────────────────────
  const bugReport: BugReport = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    mediaType: req.media.type,
    filename: req.media.filename,
    userContext: req.userContext,
    observation,
    classification,
    rootCause,
    report,
  }

  yield { event: 'complete', bugReport }
}
