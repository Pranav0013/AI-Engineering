# Findings — AI Bug Intelligence Reporter

_Last updated: 2026-06-10 | BLAST Phase 3 In Progress_

---

## 1. Project Purpose

An AI-powered bug reporting platform that accepts four types of bug evidence (screenshot, video, Playwright trace, console/error log), runs it through a 4-agent AI pipeline, generates a fully structured bug report, and automatically creates a Jira ticket — with zero manual writing.

The platform is a **serverless React SPA** deployed on Vercel. All AI inference happens server-side via Groq. No data is stored server-side; the browser's localStorage holds the report history.

---

## 2. Technology Choices & Rationale

### AI Provider: Groq
- **Why Groq over Anthropic/OpenAI:** User has a Groq key. No Anthropic key available.
- **Model used:** `meta-llama/llama-4-scout-17b-16e-instruct`
- **Why this model:** Supports both vision (image_url content parts) and text. Extremely fast inference — critical for a multi-agent pipeline that runs 4 sequential calls. Free tier available.
- **Key env var:** `GORQ_KEY` (note: user's .env has a typo — GORQ not GROQ. All code uses this exact name.)
- **response_format:** `{ type: 'json_object' }` enforced on every call so JSON is always valid and never wrapped in markdown.
- **temperature:** 0.1 — near-deterministic, maximizes consistency of JSON schema compliance.

### Jira Integration
- **REST API v3** — current Jira Cloud API version.
- **Auth:** Basic auth via Base64 encoding of `email:token`. Not OAuth — simpler for a single-user tool.
- **Description format:** Atlassian Document Format (ADF) — required by Jira Cloud API v3. Plain text descriptions are rejected. All headings, paragraphs, bullet lists, ordered lists, and code blocks built as ADF nodes.
- **Priority mapping:** critical→Highest, high→High, medium→Medium, low→Low.
- **Project key discovery:** Not hardcoded. Fetched live from `GET /rest/api/3/project` on app load using user credentials. User picks from a dropdown.
- **Env vars used:** `JIRA_URL`, `JIRA_EMAIL`, `JIRA_TOKEN`

### Streaming: NDJSON over fetch
- **Why not SSE (EventSource):** `EventSource` only supports GET requests. We need POST (to send the media payload).
- **Why not WebSockets:** Overkill for a single request/response cycle.
- **Solution:** POST to `/api/analyze`, read the response body as a `ReadableStream`. Server writes newline-delimited JSON (NDJSON). Client buffers partial lines, splits on `\n`, parses each complete line.
- **Event types:** `agent_start`, `agent_complete`, `complete`, `error`.

### Video Frame Extraction: Client-side Canvas API
- **Why client-side:** No ffmpeg in Vercel serverless. Browser canvas is free and zero-dependency.
- **Process:** Create `<video>` element → load file via `createObjectURL` → seek to N timestamps → draw each frame to `<canvas>` → export as JPEG base64 (`quality: 0.72, size: 768px`).
- **Max frames:** 10 (configurable via `MAX_VIDEO_FRAMES` constant).
- **Why this size/quality:** Balance between visual detail for the AI and request payload size (~80-100KB per frame × 10 = ~1MB total, safely under Vercel's 4.5MB limit).

### Playwright Trace Parsing: JSZip (Client-side)
- **Format:** Playwright traces are `.zip` archives containing `.trace` files (NDJSON event logs) and screenshot files.
- **Process:** `JSZip.loadAsync(arrayBuffer)` → iterate entries → extract text from `.trace`/`.json`/`.txt` files (max 8000 chars each, 4 files) → extract first 3 screenshots as base64.
- **Constraint:** Text truncated to 32,000 chars total before sending to API. Avoids exceeding Groq's context window.

### State Management
- **Zustand** for application state — chosen over Context/Redux for minimal boilerplate and excellent TypeScript support.
  - `analysisStore`: pending upload, selected Jira project, user context, per-agent progress, current report.
  - `historyStore`: all generated reports, persisted to `localStorage` via Zustand `persist` middleware. Key: `buglens-history`.
  - `uiStore`: sidebar collapsed state.
- **React Query** for server state — Jira projects fetch. 5-minute stale time, retry: 1.

---

## 3. Architecture Decisions

### 4-Agent Sequential Pipeline (not parallel)
Each agent builds on the output of the previous one. Classification needs Observation output. Root Cause needs Classification. Bug Report Writer needs all three. Sequential is mandatory here — not a performance choice.

### Agents share one system-level rule set
All 4 agents inherit `SYSTEM_BASE` rules (verbatim error text, JSON-only, null on uncertainty). Each agent gets its own role addition on top. This prevents inconsistency without duplicating rules.

### Serverless functions can import from `src/`
Vercel compiles TypeScript serverless functions independently. The `api/` functions import from `../src/agents/` and `../src/types/`. This works because Vercel's bundler resolves relative imports. The `tsconfig.json` includes both `src` and `api` in its `include` array.

### No server-side file storage
Files never touch disk beyond the Node.js request memory buffer. The pipeline receives base64 strings in the request body. After Groq returns, everything is discarded. The generated report (JSON) is returned to the client which stores it in localStorage.

### Severity `null` flow
If the Classification Agent cannot determine severity with confidence, it returns `null`. The UI displays "Unknown" with a gray badge. The export panel shows a manual selector. The Jira `create-issue` function defaults `null` severity to `Medium` priority.

---

## 4. Constraints Discovered

| Constraint | Impact | Mitigation |
|-----------|--------|-----------|
| Vercel Hobby: 10s function limit | Analysis pipeline ~8-12s on Groq | `maxDuration: 60` in vercel.json (requires Pro plan for long runs) |
| Vercel default payload: 4.5MB | Video frames could exceed this | Client-side compression to JPEG 72%, 768px max, 10 frames max |
| Groq `json_object` response_format | Only works when prompt explicitly mentions JSON | All prompts include "Return a JSON object matching this exact schema" |
| Jira REST API v3 requires ADF | Cannot use plain text in description field | Custom ADF builder in `api/jira/create-issue.ts` |
| `EventSource` is GET-only | Can't stream POST response with it | NDJSON via `fetch` + `ReadableStream` instead |
| TypeScript union type inference | `unknown[]` needed for ADF `nodes` array | Explicitly typed as `unknown[]` |
| `@apply dark` not a Tailwind utility | Build failure | Removed; `color-scheme: dark` on `html` element used instead |
| GORQ_KEY typo in user's .env | All server code must use `GORQ_KEY` not `GROQ_API_KEY` | Hardcoded as `process.env.GORQ_KEY` throughout |

---

## 5. File & Code Inventory

### Config Layer (project root)
| File | Purpose |
|------|---------|
| `package.json` | 18 prod deps, 8 dev deps. Type: "module" for ESM. |
| `tsconfig.json` | Strict mode, bundler resolution, path alias `@/` → `src/`, includes both `src` and `api` |
| `vite.config.ts` | React plugin, `@/` alias, dev proxy `/api` → port 3001, manual chunks for vendor/motion/query |
| `tailwind.config.ts` | Custom `surface-1/2/3/4` dark colors, severity color tokens, grid-pattern background, shimmer/gradient-x/pulse-ring keyframes |
| `vercel.json` | `maxDuration: 60` on analyze.ts, SPA rewrite rules, CORS headers |
| `index.html` | Inter + JetBrains Mono from Google Fonts, dark class on `<html>` |

### Type Layer (`src/types/index.ts`)
Defines 15 exported types/interfaces:
`MediaType`, `Severity`, `AgentName`, `BugCategory`, `UploadedMedia`, `ObservationResult`, `ClassificationResult`, `RootCauseResult`, `BugReportFields`, `JiraTicketRef`, `BugReport`, `JiraProject`, `AgentStep`, `AnalysisState`, `AnalysisRequest`, `StreamEvent` (discriminated union of 4 event shapes).

### AI Agent Layer (`src/agents/`)
| File | What it does |
|------|-------------|
| `prompts.ts` | `SYSTEM_BASE` + 4 system prompts + 4 dynamic prompt builders. Each builder injects prior agent outputs as context. Schemas are embedded inline in the prompt text. |
| `groqClient.ts` | Singleton Groq client (lazy init). `runAgent()` for vision+text calls, `runTextAgent()` for text-only. Both enforce `response_format: json_object`, `temperature: 0.1`, `max_tokens: 2048`. |
| `pipeline.ts` | Async generator `runPipeline()`. Yields `PipelineEvent` objects as each agent starts/completes. Handles `imageData`, `frames`, `traceScreenshots`, and `textContent` routing. |

### Serverless API Layer (`api/`)
| File | Endpoint | Notes |
|------|---------|-------|
| `analyze.ts` | `POST /api/analyze` | Validates media content, sets NDJSON headers, iterates the async generator, writes each event as a newline-terminated JSON string |
| `jira/projects.ts` | `GET /api/jira/projects` | Basic auth, fetches up to 50 projects ordered by name |
| `jira/create-issue.ts` | `POST /api/jira/create-issue` | Builds ADF description with 8 sections, maps severity to Jira priority, returns `ticketId + ticketUrl` |

### State Layer (`src/store/`)
| Store | Key state | Persistence |
|-------|-----------|------------|
| `analysisStore` | pendingUpload, selectedProject, userContext, 4-step progress with per-agent status/duration/error, currentReport | None (session only) |
| `historyStore` | `reports: BugReport[]` | localStorage (`buglens-history`, v1) |
| `uiStore` | `sidebarCollapsed` | None |

### Component Layer (`src/components/`)
**shadcn/ui base** (11 components): button (6 variants), badge (8 variants), card, skeleton (shimmer animation), progress (gradient fill), input, textarea, separator, tabs, tooltip, scroll-area, select (full Radix dropdown with checkmarks).

**Common** (3): `ErrorBoundary` (class component, retry button), `EmptyState` (icon + title + action slot), `StatusBadge` (severity-aware colored pill).

**Layout** (2): `AppLayout` (sidebar + outlet + Sonner toaster), `Sidebar` (collapsible via Framer Motion, animated NavLink active states, report count badge).

**Upload** (2): `FileTypeCard` (4-up grid, Framer Motion selected indicator), `UploadZone` (react-dropzone, file-type-aware accept rules, client preprocessing with progress states, file preview with clear button).

**Analysis** (2): `AgentStep` (timeline item with status icon, duration, pulse ring on running state), `AnalysisProgress` (full-screen view, elapsed timer, progress bar, 4 stacked AgentSteps).

**Report** (4): `SeverityBadge` (full card with icon + confidence %), `ReportSection` (section wrapper with icon + accent), `ExportActions` (Jira project selector + create button + JSON download), `BugReport` (two-column: scrollable report left, fixed export sidebar right).

**Dashboard** (1): `ReportCard` (hover-reveal actions, media type icon, severity badge, relative timestamp, delete + open buttons).

### Page Layer (`src/pages/`)
| Page | Route | Key behaviour |
|------|-------|--------------|
| `UploadPage` | `/` | 4 media type cards, UploadZone, context textarea, Jira project selector, "Analyze" CTA |
| `AnalysisPage` | `/analyze` | Mounts AnalysisProgress, redirects home if no active analysis |
| `ReportPage` | `/report/:id` | Reads from historyStore by ID or falls back to currentReport in analysisStore, top bar with back/severity/date |
| `HistoryPage` | `/history` | Severity filter chips, stats row, responsive grid, clear-all with confirmation |

### Hook Layer (`src/hooks/`)
| Hook | What it does |
|------|-------------|
| `useJiraProjects` | React Query wrapper, fetches `/api/jira/projects`, 10-min stale, returns `[]` on error (graceful degradation) |
| `useAnalysis` | Orchestrates the full upload→stream→navigate flow. Builds `AnalysisRequest`, POSTs, reads NDJSON stream, dispatches to Zustand store, saves to history, navigates to report on complete |

---

## 6. Build Verification

- **TypeScript:** `tsc --noEmit` → 0 errors
- **Vite build:** `npm run build` → ✓ success, 1.73s
- **Bundle size (gzip):** ~228 KB total JS across 5 chunks. Largest chunk: `index` at 94.8 KB gzip.
- **Chunks:** vendor (React+Router), motion (Framer), query (React Query), jszip, index (app code)
- **Issues fixed during build:**
  1. `TS2353` — ADF nodes array needed `unknown[]` type annotation
  2. CSS build error — `@apply dark` is not a valid Tailwind utility

---

## 7. What is NOT yet done (Phase 3+)

- Vercel production deployment
- Severity override UI when Classification Agent returns `null` (currently handled via the Jira export panel's selector, but there is no explicit "set severity" step before reaching the report)
- Video upload size UX warning (file > 50MB gives a dropzone error but no pre-check)
- Loading skeleton for the Report page while analysis is in progress (currently just shows blank until navigate)
- Rate limit handling on Groq API (429 errors not explicitly caught and surfaced in UI)
- Console-log reports have no evidence to attach to Jira (text-only — could optionally attach the log as a `.txt` file in future)
- Evidence attachments only work in the same browser session as the analysis (`pendingUpload` is in-memory, not persisted) — reopening a report from History after a page reload has no attachable media

---

## 8. Local Dev Environment Findings (`vercel dev`) — 2026-06-10

### `vercel.json` `devCommand` vs. `vercel dev` port collision
- Setting `"devCommand": "vite --port 3000"` alongside `"framework": "vite"` causes **two processes** to compete for port 3000: the Vite subprocess (devCommand) and `vercel dev` itself.
- Whichever wins leaves the other stranded — if Vite wins, the browser talks to plain Vite with **no knowledge of `/api/*` routes**, so every API call 404s even though the code is correct.
- **Fix:** don't set `devCommand` when `"framework": "vite"` is set — Vercel's native Vite integration runs Vite in middleware mode inside its own process on the same port.

### SPA rewrite regex must exclude Vite's internal dev paths
- A naive SPA fallback `"/((?!api/).*)" → "/index.html"` only excludes `/api/*`. In `vercel dev`, Vite serves virtual/internal paths like `/src/main.tsx`, `/@vite/client`, `/@react-refresh`, `/@id/...`, `/@fs/...` that are NOT real files but must NOT be rewritten either.
- If they get rewritten to `index.html`, the browser receives HTML when it `import`s a module → silent module failure → **blank white page** (no console error beyond MIME-type warnings).
- **Working regex:** `"/((?!api/|@|src/|node_modules/)(?!.*\\.).*)"` — excludes API routes, anything starting with `@`, `src/`, `node_modules/`, and anything containing a `.` (file extensions/static assets). Only matches clean SPA routes (`/`, `/analyze`, `/report/:id`, `/history`).
- **Diagnostic technique:** `curl -o /dev/null -w "%{http_code}"` can return 200 even when the body is wrong — always check the actual body (`curl -s <url>`) when a module import silently fails.

### Groq vision model image limit
- `meta-llama/llama-4-scout-17b-16e-instruct` rejects requests with **more than 5 images** (`400 invalid_request_error: "Too many images provided. This model supports up to 5 images"`).
- Any code path that sends multiple images (video frames, Playwright trace screenshots) must cap at 5 — enforced both at extraction time (`MAX_VIDEO_FRAMES = 5`) and at the pipeline boundary (`getImages()` slices to 5) as defense in depth.

---

## 9. Jira Attachments — Evidence Upload

- Jira Cloud REST API v3 attachment upload: `POST /rest/api/3/issue/{issueIdOrKey}/attachments`, `multipart/form-data`, requires header `X-Atlassian-Token: no-check` (CSRF check bypass for API clients) in addition to the usual Basic auth.
- Node 18+/Vercel serverless runtime has global `FormData` and `Blob`, so no extra dependency needed to build the multipart body from a `Buffer.from(base64, 'base64')`.
- Attachment upload happens **after** issue creation succeeds, and is treated as best-effort: a failed attachment upload returns `attachmentError` in the response but does not fail the overall ticket-creation request (the ticket itself was already created successfully).
