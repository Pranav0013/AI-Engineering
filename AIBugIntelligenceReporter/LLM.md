# LLM.md — Project Constitution

_AI Bug Intelligence Reporter | Last updated: 2026-06-09_
_Status: CONFIRMED and IMPLEMENTED (Phase 2 Complete)_

---

## 1. North Star

Full automation: upload bug evidence → 4 AI agents analyze it → structured bug report is generated → Jira ticket is created automatically. No manual report writing.

---

## 2. AI Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| Provider | Groq | User has `GORQ_KEY`. No Anthropic key available. |
| Model | `meta-llama/llama-4-scout-17b-16e-instruct` | Vision-capable, fast, Groq-native |
| Response format | `{ type: 'json_object' }` | Enforces valid JSON output, no markdown wrapping |
| Temperature | `0.1` | Near-deterministic — maximizes schema compliance |
| Max tokens | `2048` | Sufficient for structured JSON reports |
| Vision input | `image_url` content parts with `data:image/jpeg;base64,...` | Groq vision API format |
| Env var | `process.env.GORQ_KEY` | Exact name from user's `.env` file |

---

## 3. Behavioral Rules (enforced in all agent prompts)

1. **Verbatim error messages** — Error text from screenshots, logs, or traces must be copied EXACTLY as it appears. Never paraphrase, summarize, or clean up error strings.
2. **Concise and technical** — All fields are short and technical. No introductory sentences, no filler words ("This bug occurs when…"). State the fact directly.
3. **null on uncertainty** — If severity, component, or any field cannot be confidently determined from the evidence, use `null`. Never guess or make up plausible-sounding values.
4. **JSON only** — Every agent response is pure JSON. No markdown code fences, no prose before or after.
5. **Full automation** — No human confirmation step between pipeline stages. Report is generated and Jira ticket created in a single flow.
6. **Temp-only files** — Uploaded media is processed in memory. Never written to disk. Deleted after pipeline completes.

These rules are encoded in `SYSTEM_BASE` in `src/agents/prompts.ts` and inherited by all 4 agent system prompts.

---

## 4. Data Schemas

### Input (AnalysisRequest) — sent from client to `/api/analyze`
```typescript
interface AnalysisRequest {
  media: {
    type: 'screenshot' | 'video' | 'playwright_trace' | 'console_log'
    filename: string
    imageData?: string        // base64 JPEG/PNG, for screenshots
    frames?: string[]         // base64 JPEG frames (max 10), for videos
    textContent?: string      // raw text, for console/error logs
    traceContent?: string     // extracted text from .trace/.json files in zip
    traceScreenshots?: string[] // up to 3 base64 screenshots from trace zip
  }
  userContext?: string        // optional user-provided hint
  jiraProjectKey?: string     // optional, auto-selected from dropdown
}
```

### Agent 1 Output (ObservationResult)
```typescript
interface ObservationResult {
  rawDescription: string      // detailed description of what is visible
  visualElements: string[]    // UI elements, screens, components visible
  errorMessages: string[]     // VERBATIM error text — never paraphrased
  uiState: string             // current UI state (loading, error, empty, etc.)
  affectedArea: string        // which part of the app is affected
  userActions: string[]       // user actions visible or implied
}
```

### Agent 2 Output (ClassificationResult)
```typescript
interface ClassificationResult {
  bugType: string             // specific type (e.g. "Null pointer exception", "CORS error")
  affectedComponent: string   // specific component or module
  severity: 'critical' | 'high' | 'medium' | 'low' | null  // null if uncertain
  severityReason: string      // why this severity (or why null)
  confidence: number          // 0–100
  tags: string[]              // e.g. ['authentication', 'network', 'state-management']
  category: 'ui' | 'functional' | 'performance' | 'security' | 'data' | 'network' | 'crash' | 'authentication'
  environment?: string        // inferred OS/browser if visible
}
```

### Agent 3 Output (RootCauseResult)
```typescript
interface RootCauseResult {
  hypothesis: string          // primary root cause, technical and specific
  evidence: string[]          // specific evidence points supporting hypothesis
  technicalDetails: string    // technical explanation of WHY the bug occurs
  affectedSystemArea: string  // system layer (e.g. "API auth middleware", "React reducer")
  possibleRegression: boolean // could this be a regression?
  relatedPatterns: string[]   // known anti-patterns this matches
}
```

### Agent 4 Output (BugReportFields)
```typescript
interface BugReportFields {
  title: string               // ≤80 chars. Format: [COMPONENT]: Brief description
  description: string         // 2–4 sentences, what is broken and its impact
  stepsToReproduce: string[]  // numbered steps, clear and reproducible
  expectedResult: string      // what should happen
  actualResult: string        // what happens — include verbatim error text
  suggestedFix: string        // actionable, specific, code-level if applicable
  additionalContext: string   // browser/OS info, related components, edge cases
}
```

### Final Report (BugReport) — stored in localStorage, sent to Jira
```typescript
interface BugReport {
  id: string                  // timestamp36-random6
  createdAt: string           // ISO 8601
  mediaType: MediaType
  filename: string
  userContext?: string

  observation: ObservationResult
  classification: ClassificationResult
  rootCause: RootCauseResult
  report: BugReportFields

  jiraTicket?: {
    ticketId: string          // e.g. "PROJ-123"
    ticketUrl: string         // e.g. "https://company.atlassian.net/browse/PROJ-123"
    projectKey: string
  }
}
```

### Jira Ticket Format (ADF — Atlassian Document Format)
Jira Cloud REST API v3 requires ADF for description fields. Plain text is rejected.

Sections rendered in the Jira ticket (in order):
1. **Description** — paragraph
2. **Steps to Reproduce** — orderedList
3. **Expected Result** — paragraph
4. **Actual Result** — paragraph
5. **Root Cause Analysis** — paragraph + bulletList (evidence)
6. **Suggested Fix** — paragraph
7. **Error Messages (Verbatim)** — codeBlock (only if errorMessages.length > 0)
8. **Additional Context** — paragraph (only if present)

### Severity → Jira Priority Mapping
| Severity | Jira Priority |
|----------|--------------|
| critical | Highest |
| high | High |
| medium | Medium |
| low | Low |
| null | Medium (default fallback) |

---

## 5. Streaming Protocol (NDJSON)

Server sends newline-delimited JSON to client via `response.body` ReadableStream.

### Event shapes
```typescript
// Agent starts running
{ "event": "agent_start", "agent": "observation", "step": 1, "total": 4 }

// Agent finishes
{ "event": "agent_complete", "agent": "observation", "step": 1, "duration": 1234, "result": {...} }

// All 4 agents done, full report assembled
{ "event": "complete", "bugReport": { ...BugReport } }

// Pipeline error
{ "event": "error", "message": "Classification agent failed: ..." }
```

### Client handling (`src/hooks/useAnalysis.ts`)
```
POST /api/analyze
→ response.body.getReader()
→ TextDecoder with stream:true
→ buffer partial lines, split on '\n'
→ JSON.parse each complete line
→ dispatch to Zustand analysisStore
→ on 'complete': save to historyStore, navigate to /report/:id
```

---

## 6. Media Processing Pipeline

### Screenshot
```
File → FileReader.readAsDataURL() → strip "data:image/...;base64," prefix → imageData string
```

### Video
```
File → createObjectURL → <video> element → loadedmetadata
→ calculate N timestamps (duration / MAX_VIDEO_FRAMES)
→ for each timestamp: video.currentTime = t → onseeked → canvas.drawImage
→ canvas.toDataURL('image/jpeg', 0.72) → strip prefix → frames array
MAX_VIDEO_FRAMES = 10, FRAME_SIZE = 768px, FRAME_QUALITY = 0.72
```

### Playwright Trace
```
File → arrayBuffer → JSZip.loadAsync
→ iterate entries:
    .trace/.json/.txt files → read as text, truncate to 8000 chars each, take first 4
    .png/.jpg files → read as base64, take first 3 (screenshots)
→ { traceContent: string (max 32000 chars), traceScreenshots: string[] }
```

### Console/Error Log
```
File → FileReader.readAsText() → textContent string
API receives this as textContent, passed to text-only Groq call
```

---

## 7. Architectural Invariants

1. **Agents are server-side only.** `src/agents/` is imported by `api/` functions which run in Node.js. Frontend never imports from `src/agents/`.
2. **No server-side storage.** Media is processed in the Node.js request buffer. The assembled `BugReport` object is the only output — returned as a stream event.
3. **History is client-side only.** Zustand `historyStore` persists to `localStorage` key `buglens-history`. No database. No server-side user data.
4. **Sequential agents.** Classification depends on Observation output. Root Cause depends on Classification. Bug Report Writer depends on all three. Parallelism is architecturally impossible here.
5. **Groq singleton.** `groqClient.ts` lazily initializes one `Groq` instance per serverless function invocation. Checked via `process.env.GORQ_KEY` — throws immediately if not set.
6. **Jira ADF.** All Jira issue descriptions are built as Atlassian Document Format. Plain string descriptions are rejected by Jira Cloud API v3.
7. **Null severity is allowed.** `classification.severity` can be `null`. UI shows "Unknown" badge. Jira export defaults to "Medium" priority. A manual selector is shown in the export panel.
8. **CORS headers** are set on all `/api/*` routes via `vercel.json` headers config.
9. **Function timeout** is set to 60 seconds on `api/analyze.ts`. Requires Vercel Pro plan for runs exceeding 10 seconds.
10. **Env var name is `GORQ_KEY`** (not `GROQ_API_KEY`, not `GROQ_KEY`). This typo is intentional — it matches the user's `.env` file exactly.

---

## 8. Environment Variables

```env
GORQ_KEY=""       # Groq AI API key (from console.groq.com)
JIRA_URL=""       # Base URL of Jira Cloud instance (https://company.atlassian.net)
JIRA_EMAIL=""     # Atlassian account email address
JIRA_TOKEN=""     # Jira API token (from id.atlassian.com/manage-profile/security)
```

All 4 must be set in Vercel Dashboard → Settings → Environment Variables before the app will function end-to-end.

---

## 9. What the System Does NOT Do

- Store files anywhere permanently
- Support multiple users or authentication
- Support OAuth with Jira (uses basic auth only)
- Send Slack notifications
- Send email summaries
- Store reports on the server
- Support bulk analysis (one file at a time)
- Re-analyze a previously submitted report
- Edit generated reports before exporting
