# Task Plan — AI Bug Intelligence Reporter

_Last updated: 2026-06-10 | Current phase: Phase 3 (Testing)_

---

## North Star

> Upload a screenshot, video, Playwright trace, or error log → AI analyzes it through 4 specialized agents → structured bug report is generated → Jira ticket is created automatically. Zero manual writing.

---

## Discovery Answers (Phase 1 — Locked)

| BLAST Question | Confirmed Answer |
|---------------|-----------------|
| **North Star** | Full automation. No human-in-the-loop review step. |
| **AI Provider** | Groq — `meta-llama/llama-4-scout-17b-16e-instruct` (vision-capable) |
| **Env var name** | `GORQ_KEY` (typo in user's .env — code uses this exact name) |
| **Integrations** | Jira only. Credentials: JIRA_URL + JIRA_EMAIL + JIRA_TOKEN |
| **Jira project key** | Not hardcoded — auto-fetched from Jira API, user picks from dropdown |
| **Source of Truth** | Temp only — no file persistence after pipeline completes |
| **Delivery** | React SPA (Vite) + Vercel Serverless Functions |
| **Behavioral Rules** | Verbatim error text · Concise/technical · null severity if uncertain |

---

## Architecture Blueprint

```
┌─────────────────────────────────────────────────────────────────────┐
│                      React SPA (Vite)                               │
│                                                                     │
│  [UploadPage /]                                                     │
│    Media type selector → UploadZone → client preprocessing:        │
│      screenshot → base64 (fileToBase64)                            │
│      video      → extract 10 frames via canvas (extractVideoFrames)│
│      trace      → unzip via JSZip, extract text + 3 screenshots    │
│      log        → read as text                                      │
│    Jira project selector (fetched from /api/jira/projects)         │
│    Optional context textarea                                        │
│    "Analyze Bug" CTA → useAnalysis hook                            │
│                    │                                                │
│                    ▼ navigate to /analyze                          │
│  [AnalysisPage /analyze]                                           │
│    POST /api/analyze with AnalysisRequest JSON                     │
│    Read NDJSON stream → dispatch to Zustand analysisStore          │
│    AnalysisProgress component: 4-step timeline, elapsed timer      │
│                    │                                                │
│                    ▼ on 'complete' event → navigate /report/:id    │
│  [ReportPage /report/:id]                                          │
│    Two-column: full report (left) + export sidebar (right)         │
│    Export to Jira → POST /api/jira/create-issue                    │
│    Download JSON → client-side blob download                       │
│                                                                     │
│  [HistoryPage /history]                                            │
│    Persisted reports from localStorage (Zustand persist)           │
│    Filter by severity, click to open any past report               │
└─────────────────────────────────────────────────────────────────────┘
                    │ POST /api/analyze
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 Vercel Serverless (Node.js)                         │
│                                                                     │
│  api/analyze.ts (maxDuration: 60s)                                 │
│    Validates request → runs async generator runPipeline()          │
│    Streams NDJSON events back to client                            │
│                                                                     │
│  src/agents/pipeline.ts (async generator)                          │
│    ┌──────────────────────────────────────────────────────────┐   │
│    │  Agent 1: Observation                                     │   │
│    │  → Groq vision/text call                                 │   │
│    │  → ObservationResult JSON                                │   │
│    │       ↓                                                   │   │
│    │  Agent 2: Classification                                  │   │
│    │  → Groq text call (uses Agent 1 output)                  │   │
│    │  → ClassificationResult JSON                             │   │
│    │       ↓                                                   │   │
│    │  Agent 3: Root Cause Analysis                             │   │
│    │  → Groq text call (uses Agent 1+2 output)                │   │
│    │  → RootCauseResult JSON                                   │   │
│    │       ↓                                                   │   │
│    │  Agent 4: Bug Report Writer                               │   │
│    │  → Groq text call (uses Agent 1+2+3 output)              │   │
│    │  → BugReportFields JSON                                   │   │
│    └──────────────────────────────────────────────────────────┘   │
│    Assembles final BugReport object → yields 'complete' event      │
│                                                                     │
│  api/jira/projects.ts                                              │
│    GET /rest/api/3/project → returns project list                  │
│                                                                     │
│  api/jira/create-issue.ts                                          │
│    Builds ADF description (8 sections)                             │
│    POST /rest/api/3/issue → returns ticketId + ticketUrl          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend framework | React 18 + TypeScript | Strong types, ecosystem |
| Build tool | Vite 5 | Fast HMR, excellent code splitting |
| Styling | TailwindCSS 3 + shadcn/ui (Radix) | Utility-first + accessible headless components |
| Animations | Framer Motion 11 | Production-quality motion |
| API state | React Query 5 | Caching, loading states for Jira projects fetch |
| App state | Zustand 4 + persist middleware | Minimal boilerplate, excellent TS support |
| AI | Groq SDK + llama-4-scout | Fast inference, vision support, free tier |
| Streaming | NDJSON via fetch ReadableStream | SSE requires GET; NDJSON works with POST |
| Video frames | Browser Canvas API | No ffmpeg dependency, works in serverless too |
| Trace parsing | JSZip | Lightweight browser-compatible ZIP reader |
| Backend | Vercel Serverless Functions (TypeScript) | Zero-config, same repo as frontend |
| Jira | REST API v3 (Basic auth) | Current Jira Cloud API version |
| Notifications | Sonner | Lightweight toast library |
| Icons | Lucide React | Consistent, tree-shakable |

---

## Folder Structure

```
AIBugIntelligenceReporter/
├── api/                        ← Vercel Serverless Functions
│   ├── analyze.ts
│   └── jira/
│       ├── projects.ts
│       └── create-issue.ts
├── src/
│   ├── agents/                 ← AI pipeline (server-side, imported by api/)
│   │   ├── prompts.ts
│   │   ├── groqClient.ts
│   │   └── pipeline.ts
│   ├── components/
│   │   ├── ui/                 ← shadcn/ui: 12 components
│   │   ├── common/             ← ErrorBoundary, EmptyState, StatusBadge
│   │   ├── layout/             ← AppLayout, Sidebar
│   │   ├── upload/             ← FileTypeCard, UploadZone
│   │   ├── analysis/           ← AgentStep, AnalysisProgress
│   │   ├── report/             ← BugReport, SeverityBadge, ReportSection, ExportActions
│   │   └── dashboard/          ← ReportCard
│   ├── hooks/
│   │   ├── useAnalysis.ts
│   │   └── useJiraProjects.ts
│   ├── lib/
│   │   ├── constants.ts
│   │   ├── queryClient.ts
│   │   ├── utils.ts
│   │   └── videoUtils.ts
│   ├── pages/
│   │   ├── UploadPage.tsx
│   │   ├── AnalysisPage.tsx
│   │   ├── ReportPage.tsx
│   │   └── HistoryPage.tsx
│   ├── store/
│   │   ├── analysisStore.ts
│   │   ├── historyStore.ts
│   │   └── uiStore.ts
│   ├── types/index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/favicon.svg
├── BLAST.md
├── LLM.md                      ← Project Constitution
├── task_plan.md                ← This file
├── findings.md                 ← Research + decisions
├── progress.md                 ← Session log + build status
├── .env                        ← Credentials (never commit)
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── vercel.json
```

---

## Environment Variables

```env
GORQ_KEY=""           # Groq API key — get from console.groq.com
JIRA_URL=""           # e.g. https://yourcompany.atlassian.net
JIRA_EMAIL=""         # Your Atlassian account email
JIRA_TOKEN=""         # Jira API token — create at id.atlassian.com/manage-profile/security
```

---

## BLAST Phase Checklist

### Phase 0: Initialization ✅
- [x] task_plan.md created
- [x] findings.md created
- [x] progress.md created
- [x] LLM.md created (Project Constitution)

### Phase 1: Blueprint ✅
- [x] All 5 BLAST discovery questions answered
- [x] Data schemas defined and locked in LLM.md
- [x] Architecture approved
- [x] Tech stack confirmed

### Phase 2: Build ✅
- [x] All config files (package.json, tsconfig, vite, tailwind, postcss, vercel.json)
- [x] Types layer (src/types/index.ts)
- [x] Lib utilities (utils, constants, queryClient, videoUtils)
- [x] Zustand stores (analysis, history, ui)
- [x] AI agent prompts (prompts.ts)
- [x] Groq client (groqClient.ts)
- [x] Async generator pipeline (pipeline.ts)
- [x] Vercel API: /api/analyze (NDJSON streaming)
- [x] Vercel API: /api/jira/projects
- [x] Vercel API: /api/jira/create-issue (ADF)
- [x] shadcn/ui base components (12)
- [x] Common components (ErrorBoundary, EmptyState, StatusBadge)
- [x] Layout components (AppLayout, Sidebar)
- [x] Upload components (FileTypeCard, UploadZone)
- [x] Analysis components (AgentStep, AnalysisProgress)
- [x] Report components (BugReport, SeverityBadge, ReportSection, ExportActions)
- [x] Dashboard components (ReportCard)
- [x] Hooks (useAnalysis, useJiraProjects)
- [x] Pages (Upload, Analysis, Report, History)
- [x] App shell (App.tsx, main.tsx, index.css)
- [x] `tsc --noEmit` → 0 errors
- [x] `npm run build` → ✓ success

### Phase 3: Testing 🔶 (in progress)
- [x] Fill `.env` with real Groq key and Jira credentials
- [x] `vercel dev` — local dev server (NOT `npm run dev` — needed for `/api/*` routes; see findings.md §8 for the two config bugs that had to be fixed first)
- [x] Upload video → verify frame extraction → verify report (fixed "too many images" 400 from Groq, capped at 5 frames)
- [x] Create Jira ticket → optional evidence attachment dialog (Skip / Attach) → attachments uploaded to Jira issue
- [ ] Upload screenshot → verify full pipeline → check Jira ticket in Jira
- [ ] Upload Playwright trace (.zip) → verify trace parsing
- [ ] Upload console log → verify text analysis
- [ ] Test severity=null case (AI can't determine → user sets manually)
- [ ] Test Jira export failure (wrong token) → verify fallback JSON shown
- [ ] Test JSON download
- [ ] Test history persistence (refresh browser)
- [ ] Test history filter by severity
- [ ] Test sidebar collapse/expand

### Phase 4: Ship ⬜
- [ ] `vercel --prod` deployment
- [ ] Add env vars in Vercel dashboard (Settings → Environment Variables)
- [ ] Verify analyze.ts gets 60s function duration (check Vercel plan)
- [ ] Test on production URL
- [ ] Optional: custom domain
