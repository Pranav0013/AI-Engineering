# Progress — AI Bug Intelligence Reporter

_Last updated: 2026-06-10_

---

## Current Status

**BLAST Phase 3: Testing — IN PROGRESS**
`vercel dev` runs locally, end-to-end pipeline works for screenshot/video uploads, Jira ticket creation works including optional evidence attachments.
Next: finish Phase 3 checklist (remaining media types, history/JSON export checks) → Phase 4 (Vercel deploy)

---

## What Was Accomplished

### Session 2 — 2026-06-10 (Local dev fixes + new feature)

#### Bug fixes (local `vercel dev` environment)
1. **404 on `POST /api/analyze`** — `vercel.json` had `"devCommand": "vite --port 3000"`, which raced with `vercel dev`'s own default port 3000. The Vite subprocess won the race, so the browser talked directly to plain Vite (no `/api` routes → 404). **Fix:** removed `devCommand` and the no-op `/api/(.*)` rewrite; `"framework": "vite"` lets Vercel run Vite in middleware mode on the same port as `vercel dev`.
2. **Blank white page after fix #1** — the remaining SPA rewrite `"/((?!api/).*)" → "/index.html"` was too broad and rewrote Vite's internal dev paths (`/src/main.tsx`, `/@vite/client`, `/@react-refresh`) to `index.html`, so the browser got HTML where it expected JS modules. **Fix:** narrowed the regex to `"/((?!api/|@|src/|node_modules/)(?!.*\\.).*)" → "/index.html"` — only clean SPA routes (`/`, `/analyze`, `/report/:id`, `/history`) get rewritten; everything else (API, Vite internals, static assets, anything with a file extension) passes through.
3. **Groq vision error: "Too many images provided. This model supports up to 5 images"** — video uploads extracted 10 frames and sent all of them to the Observation Agent, but `meta-llama/llama-4-scout-17b-16e-instruct` caps at 5 images per request. **Fix:** `getImages()` in `src/agents/pipeline.ts` now slices `frames` and `traceScreenshots` to 5; `MAX_VIDEO_FRAMES` in `src/lib/constants.ts` lowered from 10 → 5 so the client doesn't waste time extracting frames that get discarded.

End-to-end verification after these fixes: app loads correctly, video upload → 4-agent pipeline runs → bug report renders. Confirmed working by user.

#### New feature: optional evidence attachment on Jira ticket creation
User requested: when clicking "Create Jira Ticket", ask whether to attach the original screenshot/video frames/trace screenshots as evidence (optional).

- `src/types/index.ts` — added `JiraAttachment { filename, base64, mimeType }`
- `src/lib/utils.ts` — added `getReportAttachments(media)`, builds an attachment list from the in-memory `pendingUpload` (1 image for screenshots, up to 5 JPEG frames for video, up to 5 PNGs for Playwright trace screenshots, none for console logs)
- `src/components/ui/dialog.tsx` — new shadcn-style Radix Dialog wrapper (project had the `@radix-ui/react-dialog` dependency but no wrapper yet)
- `src/components/report/ExportActions.tsx` — "Create Jira Ticket" now opens a dialog ("Attach evidence to ticket?" / Skip / Attach (N)) when evidence is available; skips the dialog entirely if there's nothing to attach (e.g. console-log-only reports, or reports reopened from history after a reload)
- `api/jira/create-issue.ts` — accepts `attachments?: JiraAttachment[]`, and after creating the issue, uploads each via `POST /rest/api/3/issue/{key}/attachments` (multipart `FormData`, `X-Atlassian-Token: no-check`); attachment failures don't fail ticket creation, surfaced as a warning toast instead

`tsc --noEmit` → 0 errors after all changes.

#### Repo hygiene
- `.gitignore` only had `.vercel`. Added `node_modules`, `dist`, `.env`, `.env.local`, `.env.*.local` — `.env` (real Groq/Jira credentials) must never be committed. `.env.example` already existed with placeholder keys for setup reference.

---

### Session 1 — 2026-06-09

#### BLAST Phase 0: Initialization
- Created all 4 project memory files: `task_plan.md`, `findings.md`, `progress.md`, `LLM.md`
- Defined project constitution in `LLM.md` including data schemas and behavioral rules

#### BLAST Phase 1: Blueprint (Discovery)
Ran all 5 BLAST discovery questions and got confirmed answers:

| Question | Answer |
|----------|--------|
| North Star | Full automation — upload → AI report → Jira ticket, no manual step |
| Integrations | Jira only. User has: Jira URL, Email, API Token. No Jira project key (auto-fetch instead). |
| Source of Truth | Temp-only. Files deleted after processing. No cloud storage. |
| Delivery | Web UI (React SPA) deployed on Vercel |
| AI Provider | Groq (user has GORQ_KEY). No Anthropic key. Model: `meta-llama/llama-4-scout-17b-16e-instruct` |
| Behavioral Rules | Verbatim error text · Concise/technical · Never guess severity (null if uncertain) |

Data schemas confirmed and locked in `LLM.md`.

#### BLAST Phase 2: Build
Built the entire production application from scratch — **64 files**, **3,326 lines of source TypeScript/TSX**.

---

## Files Created (Complete List)

### Project Root (Configuration)
```
package.json          — 18 prod + 8 dev deps, ESM, build/dev scripts
tsconfig.json         — Strict TS, bundler resolution, @/ alias, includes src + api
tsconfig.node.json    — Vite config compilation
vite.config.ts        — React plugin, @/ alias, dev proxy, 5-chunk code splitting
tailwind.config.ts    — Custom dark theme tokens, severity colors, animations
postcss.config.js     — Tailwind + autoprefixer
vercel.json           — maxDuration:60 on analyze, SPA rewrites, CORS headers
index.html            — Google Fonts (Inter + JetBrains Mono), dark html class
.env.example          — Documents the 4 required env vars
public/favicon.svg    — SVG logo (crosshair + violet)
```

### Types (`src/types/`)
```
index.ts              — 16 TypeScript interfaces/types covering the full data model
```

### Lib Utilities (`src/lib/`)
```
utils.ts              — cn(), formatFileSize, formatRelative, formatDate, formatDuration,
                        generateId, truncate, downloadJSON, fileToBase64, fileToText
constants.ts          — AGENT_STEPS config, MEDIA_TYPE_CONFIG (accept rules, sizes, icons, gradients),
                        SEVERITY_CONFIG (colors, badges, Jira priorities), MAX_VIDEO_FRAMES
queryClient.ts        — React Query client with 5-min stale, 10-min GC, retry:1
videoUtils.ts         — extractVideoFrames() (canvas seeked loop), extractPlaywrightTrace() (JSZip)
```

### State Stores (`src/store/`)
```
analysisStore.ts      — Upload state, 4-agent progress tracking, current report, all setters
historyStore.ts       — Report array, localStorage persistence (key: buglens-history)
uiStore.ts            — Sidebar collapsed toggle
```

### AI Agents (`src/agents/`)
```
prompts.ts            — SYSTEM_BASE shared rules + 4 system prompts + 4 dynamic prompt builders
                        (each builder injects prior agent outputs as context)
groqClient.ts         — Lazy Groq singleton, runAgent() for vision calls, runTextAgent() for text
                        Both: json_object format, temp:0.1, max_tokens:2048
pipeline.ts           — Async generator runPipeline() yielding PipelineEvent objects
                        Routes media correctly: imageData → vision, frames → vision, text → text-only
```

### Vercel Serverless Functions (`api/`)
```
analyze.ts            — POST /api/analyze: validates, sets NDJSON headers, iterates pipeline generator
jira/projects.ts      — GET /api/jira/projects: basic auth, 50 projects ordered by name
jira/create-issue.ts  — POST /api/jira/create-issue: ADF builder (8 sections), severity→priority map
```

### shadcn/ui Components (`src/components/ui/`)
```
button.tsx     — 6 variants: default, destructive, outline, secondary, ghost, gradient
badge.tsx      — 8 variants including all 4 severity levels
card.tsx       — CardHeader, CardTitle, CardDescription, CardContent, CardFooter
skeleton.tsx   — shimmer animation via CSS before pseudo-element
progress.tsx   — Radix-based, gradient fill (violet→purple), 500ms ease-out transition
input.tsx      — Consistent focus ring, violet accent
textarea.tsx   — Same style as input, resize:none
separator.tsx  — Radix-based, supports horizontal/vertical
tabs.tsx       — Radix Tabs with active state (bg-white/8)
tooltip.tsx    — Radix, dark bg, slide-in animations
scroll-area.tsx — Radix, custom thin scrollbar
select.tsx     — Full Radix Select: trigger, content, item (check icon), label, separator
```

### Common Components (`src/components/common/`)
```
ErrorBoundary.tsx     — Class component, catches render errors, shows retry button
EmptyState.tsx        — Icon + title + description + optional action slot
StatusBadge.tsx       — Severity-aware colored pill with dot indicator, 3 sizes
```

### Layout Components (`src/components/layout/`)
```
AppLayout.tsx         — Shell: Sidebar + <Outlet> + Sonner toast provider
Sidebar.tsx           — Collapsible (Framer Motion width animation), NavLink active states,
                        report count badge on History, collapse toggle button
```

### Upload Components (`src/components/upload/`)
```
FileTypeCard.tsx      — 4-up media type selector, animated selection indicator, gradients per type
UploadZone.tsx        — react-dropzone integration, client-side preprocessing (video frames,
                        trace unzip, text read), processing state with progress text, file preview
```

### Analysis Components (`src/components/analysis/`)
```
AgentStep.tsx         — Timeline item: status icon (Check/Loader/Circle/Alert), pulse ring on
                        running, duration badge on complete, error message on failure
AnalysisProgress.tsx  — Full-screen view, elapsed timer (100ms tick), progress bar,
                        filename display, 4 stacked AgentStep components
```

### Report Components (`src/components/report/`)
```
SeverityBadge.tsx     — Large severity card with icon (Shield variants), confidence %, bg glow
ReportSection.tsx     — Section wrapper with icon + accent color, also exports:
                        StepsList (numbered), ErrorBlock (code terminal UI), BulletList
ExportActions.tsx     — Jira project selector + create ticket button (loading/success states) +
                        JSON download, success state shows ticket ID + external link
BugReport.tsx         — Two-column layout: scrollable report (left) + 72px fixed sidebar (right)
                        Displays all 8 sections: title, description, steps, expected, actual,
                        error messages, root cause, suggested fix, tags, additional context, observation
```

### Dashboard Components (`src/components/dashboard/`)
```
ReportCard.tsx        — Report card for history grid: media type icon, severity badge, Jira ticket
                        badge, relative timestamp, hover-reveal delete/open buttons, click-through overlay
```

### Custom Hooks (`src/hooks/`)
```
useJiraProjects.ts    — React Query, GET /api/jira/projects, graceful [] on error
useAnalysis.ts        — Full pipeline orchestrator: builds AnalysisRequest, POSTs, streams NDJSON,
                        dispatches all store updates, saves to history, navigates on complete
```

### Pages (`src/pages/`)
```
UploadPage.tsx        — Hero section, 4-type selector, UploadZone, context textarea, Jira
                        project select, gradient CTA button
AnalysisPage.tsx      — Mounts AnalysisProgress, redirects home if accessed with no pending analysis
ReportPage.tsx        — Reads from historyStore by :id param (fallback to currentReport),
                        top bar with back/severity/date, full BugReport component
HistoryPage.tsx       — Severity filter chips, stats row (count by severity), responsive 3-col grid,
                        empty state, clear-all with window.confirm
```

### App Shell
```
App.tsx               — QueryClientProvider + TooltipProvider + BrowserRouter + 4 routes
main.tsx              — StrictMode createRoot
index.css             — CSS variables (shadcn dark theme), scrollbar, selection color, glass util,
                        gradient-text, bg-grid utilities
```

---

## Build Results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ Success, 1.73s |
| CSS build | ✅ (fixed `@apply dark` error) |
| TypeScript ADF type | ✅ (fixed `TS2353` with `unknown[]`) |

**Bundle output (gzip):**
- CSS: 8.15 KB
- vendor (React+Router): 53.50 KB
- motion (Framer): 37.78 KB
- query (React Query): 12.15 KB
- jszip: 30.28 KB
- index (app): 94.79 KB
- **Total: ~237 KB gzip**

---

## Bugs Fixed During Build

### Bug 1: `TS2353` — ADF nodes array
- **File:** `api/jira/create-issue.ts:82`
- **Error:** `Object literal may only specify known properties, and 'attrs' does not exist in type...`
- **Cause:** TypeScript inferred a narrow union type for the `nodes` array. The `codeBlock` node with `attrs` didn't match.
- **Fix:** Typed array as `unknown[]` explicitly.

### Bug 2: CSS PostCSS build failure
- **File:** `src/index.css`
- **Error:** `The 'dark' class does not exist. If 'dark' is a custom class, make sure it is defined within a @layer directive.`
- **Cause:** `@apply dark` in a base layer — `dark` is a Tailwind dark mode *selector*, not a utility class. Cannot be `@apply`'d.
- **Fix:** Removed `@apply dark`. Used `color-scheme: dark` on `html` element. The `dark` class on `<html>` in `index.html` handles Tailwind's dark mode variant activation.

---

## What Remains (Phase 3 & 4)

### Phase 3 — Manual Testing
- [ ] Fill in `.env` with real Groq key and Jira credentials
- [ ] Run `npm run dev` locally
- [ ] Test each of the 4 upload types end-to-end
- [ ] Verify NDJSON stream updates the 4-agent UI correctly
- [ ] Test Jira ticket creation → confirm ADF renders correctly in Jira
- [ ] Test severity=null flow (report shows, export panel has manual selector)
- [ ] Test history persistence (refresh page, reports still there)
- [ ] Test history filter by severity
- [ ] Test JSON download

### Phase 4 — Vercel Deployment
- [ ] `vercel --prod` from project directory
- [ ] Set 4 env vars in Vercel dashboard: `GORQ_KEY`, `JIRA_URL`, `JIRA_EMAIL`, `JIRA_TOKEN`
- [ ] Verify Vercel function duration allows 60s (Pro plan needed for long analyses)
- [ ] Test on production URL
