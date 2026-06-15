# Task Plan — Job Tracker App

## Status: Build complete. JD Summarizer feature added; header/drag-and-drop polish pass complete; AI Interview Question Generator added and revised per user feedback (always-visible button, removed exp/skills fields, Most Asked Questions accordion, real code answers for coding questions); Follow-Up Reminder System added (per-job + global reminders, auto-reminders, dynamic Overdue/Due Today/Upcoming, dashboard metrics, header badge, card indicators); "Aurora" visual design system applied across the app (brand gradient palette, aurora canvas, glassmorphic header, frosted columns, elevated cards, unified modal chrome, bundled Inter font).

## BLAST Phase Map (adapted for a local-first frontend app)

- [x] **Phase 0 — Initialization**
  - [x] Create `task_plan.md`, `findings.md`, `progress.md`
  - [x] Initialize `LLM.md` (Project Constitution)
  - [x] Discovery questions answered
  - [x] Data Schema defined in `LLM.md`
  - [x] Blueprint approved (user requested build to proceed, 2026-06-13)

- [x] **Phase 1 — Blueprint: Research (1.3)**
  - [x] Researched `idb` + `@dnd-kit` current usage patterns, logged in `findings.md`

- [x] **Phase 2 — Link (Connectivity)**
  - [x] N/A for this project — no external services/APIs/.env per Discovery (fully offline). Documented in `LLM.md`.

- [x] **Phase 3 — Architect (3-Layer Build, adapted)**
  - Layer 1 (Architecture/SOPs) → `architecture/*.md`
  - Layer 2 (Navigation) → `src/App.jsx` orchestration + React state
  - Layer 3 (Tools, deterministic) → `src/lib/db.js`, `src/lib/utils.js`
  - [x] Scaffold Vite + React project in `JobTrackerApp/`
  - [x] Install deps: tailwindcss (v4), idb, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
  - [x] Configure Tailwind + dark/light theme (CSS-first `@theme`, `.dark` class variant)
  - [x] `src/lib/db.js` — IndexedDB CRUD (jobs store + settings store)
  - [x] `src/lib/utils.js` — helpers (uuid via crypto, days-since-applied, sort, search match)
  - [x] Components: Board, Column, JobCard, JobModal, ConfirmDialog
  - [x] Header (SearchBar, sort toggle, ThemeToggle, ImportExport, Add Job)
  - [x] App.jsx — state, drag-and-drop wiring (dnd-kit)

- [x] **Phase 4 — Stylize**
  - [x] Polished Tailwind styling, Linear/Trello-minimal aesthetic
  - [x] Status color accents per column (left-border + dot), responsive layout (laptop + tablet verified)
  - [x] Fixed board layout to fill viewport height (columns stretch, card lists scroll independently)

- [x] **Phase 5 — Trigger (Deployment)**
  - [x] Run via `npm run dev` on localhost (no cloud deploy — local-first by design)
  - [x] Verified in headless Chromium: add/edit/delete jobs, search filter, dark mode, tablet viewport — no console errors

## Test & Validate
- [x] CRUD flows (add, edit, delete w/ confirmation) — verified via browser
- [x] Search/filter — verified
- [x] Dark/light theme toggle + persistence via settings store — verified
- [x] Responsive layout (laptop 1440px + tablet 834px) — verified
- [x] Drag-and-drop across columns — fixed smoothness (added `DragOverlay`, 2026-06-14) and verified via Playwright: floating card preview follows cursor, drops into correct column, no console errors
- [ ] Export/Import round-trip — implemented per SOP, not exercised in automated pass; recommend a quick manual check
- [ ] Persistence across real browser reloads — implemented (IndexedDB via `idb`); each Playwright run uses a fresh profile so this wasn't observable in automated pass, but is standard IndexedDB behavior
- [x] JD Summarizer — heuristic mode (no API key) verified end-to-end (light + dark mode, no console errors)
- [ ] JD Summarizer — AI-enhanced mode (`summarizeWithGroq`, requires a real GROQ API key) — switched from Claude to GROQ on 2026-06-13 (user already holds a GROQ key; Claude returned 401 with it). Not yet re-exercised live with the GROQ implementation; code path covers non-2xx, network error, and JSON-parse failure by falling back to heuristic with a warning. Do a quick manual check with a real GROQ key.
- [x] Header toolbar — redesigned as segmented control with cursor-pointer, dividers, and distinct icons; verified via Playwright (all 7 buttons report `cursor: pointer`)
- [x] AI Interview Question Generator — verified end-to-end with mocked GROQ responses (all 5 accordion sections + counts, all 5 per-question actions, regenerate confirm dialog, no-JD and no-API-key states, light + dark mode, no console errors)
- [x] AI Interview Question Generator follow-up revision — verified via Playwright: "Interview Prep" button visible on `JobCard` without hovering; "Years of experience"/"Your key skills" fields absent from `JobModal`; "Most Asked Questions (Company-Specific)" accordion renders when present and is fully absent (no "not found" message) when empty, while non-optional `systemDesignQuestions: []` still shows its muted note; Coding "Generate code solution" renders a fenced-stripped `<pre>` code block retaining both prose and code
- [ ] AI Interview Question Generator — live end-to-end run against the real GROQ API (`generateInterviewQuestions` + `generateAnswer`), requires a real GROQ API key — same outstanding item as the JD Summarizer's AI mode
- [x] Follow-Up Reminder System — verified via Playwright (no mocking, 100% local): auto follow-up on Applied surfaces as Overdue on card + modal; per-job add/complete/snooze; header overdue badge; Reminder Center metrics (Total/Overdue/Upcoming/Completed/Completion %), 5 status tabs, priority/type/company/date filters, Upcoming timeframe buckets (This Week / Later); no console errors
- [ ] Follow-Up Reminder System — export/import round-trip of reminders not exercised in the automated pass (reminders ride on the `jobs` record, so covered by the existing import/export code path); quick manual check recommended
- [x] "Aurora" visual design system — verified via Playwright in light + dark (board, Add Job modal, Reminder Center), eslint clean, zero console errors; see `architecture/ui-components.md` → "Design system"

## Open Questions
- None outstanding.

## Polish: Header buttons + drag-and-drop smoothness (added 2026-06-14)
- [x] Diagnose drag-and-drop issue from user's screen recording (extracted frames via ffmpeg)
- [x] Add `DragOverlay` to `Board.jsx` + extract `JobCardContent` from `JobCard.jsx`
- [x] Update `architecture/ui-components.md` (Golden Rule) before code change
- [x] Redesign `Header.jsx` — segmented pill group, `cursor-pointer`, `aria-label`s
- [x] Replace `SparklesIcon`/`SettingsIcon` so they're visually distinct from `SunIcon`
- [x] Verify via Playwright (drag-and-drop + header button styles), `npx eslint` clean

## Feature: Job Description Summarizer (added 2026-06-13)

- [x] **Phase 1 — Blueprint**
  - [x] Identified conflict with "no network calls" invariant; researched BYOK options via `claude-api` skill
  - [x] Decision logged in `findings.md`: hybrid — local heuristic by default, opt-in AI enhancement via user-supplied key
  - [x] Switched AI provider from Claude (`claude-opus-4-8`) to GROQ (`llama-3.3-70b-versatile`) after user's GROQ key returned 401 against the Claude implementation — user chose "replace with GROQ" over a dual-provider selector

- [x] **Phase 2 — Link**
  - [x] Documented opt-in BYOK exception in `LLM.md` Section 3; no `.env`, key lives in IndexedDB settings

- [x] **Phase 3 — Architect**
  - [x] Write `architecture/jd-summarizer.md` SOP before code
  - [x] `src/lib/jdSummarizer.js` — heuristic extractor (sections, salary/experience regex, red-flag dictionary) + `summarizeWithGroq`
  - [x] Add `groqApiKey` to settings schema (`src/lib/db.js`)
  - [x] New icons: Sparkles, Settings, Eye/EyeOff
  - [x] `SummarizerModal.jsx` — paste JD, run analysis, render 6 result sections
  - [x] `SettingsModal.jsx` — API key entry (BYOK), privacy note
  - [x] Wire up `Header.jsx` (Summarize JD + Settings buttons) and `App.jsx` (state, handlers)

- [x] **Phase 4 — Stylize**
  - [x] Match existing Tailwind v4 aesthetic (cards, modals, dark mode)

- [x] **Phase 5 — Trigger**
  - [x] Verify in dev server: heuristic mode end-to-end with a pasted JD (no API key set) — verified via Playwright, light + dark mode, no console errors
  - [x] Verify Settings modal saves/clears key, persists via IndexedDB — verified via Playwright

## Feature: AI Interview Question Generator (added 2026-06-14)

- [x] **Phase 1 — Blueprint**
  - [x] Asked `AskUserQuestion`s for UI placement and Suggested Answers bonus before starting; user chose dedicated `InterviewPrepModal` via a `JobCard` icon, and on-demand per-question suggested answers
  - [x] Confirmed reuse of JD Summarizer's GROQ BYOK pattern (`settings.groqApiKey`), no offline fallback

- [x] **Phase 2 — Link**
  - [x] Added note to `LLM.md` Section 3: this feature reuses the existing GROQ exception, no new key/setting, no offline fallback

- [x] **Phase 3 — Architect**
  - [x] Write `architecture/interview-questions.md` SOP before code
  - [x] Update `architecture/ui-components.md` + `architecture/data-layer.md`
  - [x] `src/lib/interviewQuestions.js` — `generateInterviewQuestions` + `generateAnswer` (GROQ), `QUESTION_CATEGORIES`
  - [x] New icons: InterviewPrep, Copy, Star, CheckCircle, ChevronDown, Refresh, Lightbulb
  - [x] `JobCard.jsx` — Interview Prep icon button (hover-reveal)
  - [x] `JobModal.jsx` — `jobDescription`/`yearsOfExperience`/`resumeSkills` fields
  - [x] `InterviewPrepModal.jsx` — accordion UI, per-question actions, generate/regenerate
  - [x] Thread `onOpenInterviewPrep` through `Board.jsx` → `Column.jsx` → `JobCard.jsx`
  - [x] Wire `App.jsx` state, `handleSaveInterviewPrep`, modal rendering
  - [x] Update `LLM.md` (data schema, file map, maintenance log)

- [x] **Phase 4 — Stylize**
  - [x] Difficulty badges via existing status color tokens (Easy/Medium/Hard → offer/followup/rejected); `interview` token for Interview Prep accents

- [x] **Phase 5 — Trigger**
  - [x] `npx eslint` clean on all new/modified files
  - [x] Verify via Playwright with mocked GROQ responses: no-JD state, no-key state, all 5 accordion sections + counts, all 5 per-question actions, regenerate confirm dialog, dark mode, no console errors
  - [ ] Live end-to-end run with a real GROQ API key (outstanding, same as JD Summarizer AI mode)

## Follow-up revision: AI Interview Question Generator discoverability + scope (added 2026-06-14)

- [x] **Phase 1 — Blueprint**
  - [x] Logged user feedback (4 points) in `findings.md`: button discoverability, JD-only generation, Most Asked Questions accordion (hide-if-not-found), real code answers for Coding questions
  - [x] Resolved "scout the internet" requirement pragmatically: no search/browsing tool available, so implemented as a 6th LLM-prompted category (`mostAskedQuestions`) that returns `[]` unless the model has specific company knowledge — documented as a caveat

- [x] **Phase 3 — Architect**
  - [x] Update `architecture/interview-questions.md` (goal, generator input, `job.interviewPreparation` shape, `QUESTION_CATEGORIES` + `optional` semantics, `generateAnswer` category param, UI flow, architectural boundary)
  - [x] Update `architecture/ui-components.md` (JobCard always-visible button, JobModal field removal, accordion description)
  - [x] `src/lib/interviewQuestions.js` — add `mostAskedQuestions` category (`optional: true`), drop `yearsOfExperience`/`resumeSkills` from prompt + signature, category-aware `buildAnswerPrompt` (real code solution for `codingQuestions`, `max_tokens: 1200`), new `stripCodeFences`
  - [x] `src/components/JobModal.jsx` — remove `yearsOfExperience`/`resumeSkills` from `emptyForm` and form UI
  - [x] `src/components/JobCard.jsx` — remove hover-only `InterviewPrepIcon`; add always-visible full-width "Interview Prep" button (`interview`-tinted)
  - [x] `src/components/InterviewPrepModal.jsx` — skip rendering optional empty categories, pass `category` to `generateAnswer`, render coding answers as `<pre>` code blocks
  - [x] Update `LLM.md` (record schema, `interviewPreparation` shape, Section 3 caveat, maintenance log)

- [x] **Phase 5 — Trigger**
  - [x] `npx eslint` clean on `interviewQuestions.js`, `InterviewPrepModal.jsx`, `JobModal.jsx`, `JobCard.jsx`
  - [x] Fixed `stripCodeFences` bug (initial regex only matched if the whole answer was one fenced block; rewrote to globally strip fence markers so prose + code answers render correctly) — verified via Playwright with a prose+code+notes mocked answer
  - [x] Verified via Playwright: button visible without hover, fields removed, `mostAskedQuestions` present/absent cases, coding vs. non-coding answer rendering, no console errors
  - [ ] Live end-to-end run with a real GROQ API key (outstanding, same as above)

## Feature: Follow-Up Reminder System (added 2026-06-15)

- [x] **Phase 1 — Blueprint**
  - [x] Logged spec + adaptation (routed-multi-page spec → modal-based app: `ReminderModal`, `ReminderCenter`, header badge, card indicator) in `findings.md`
  - [x] Documented the auto-reminder date simplification (Interview/Offer dated from today; Applied uses `dateApplied`+7) since the app stores no interview/offer-expiry dates

- [x] **Phase 2 — Link**
  - [x] N/A — 100% local, no network calls, no new settings/keys

- [x] **Phase 3 — Architect**
  - [x] Write `architecture/reminders.md` SOP before code (Golden Rule)
  - [x] `src/lib/reminders.js` — types/priorities/status metadata, `addDays`/`daysUntil`, `reminderStatus`, `dueLabel`, `createReminder`, `appendAutoReminder` (deduped by type), `flattenReminders`, `summarizeReminders`, `cardIndicator`, `groupUpcoming`, `toggleComplete`
  - [x] New icons: Bell, Clock, Calendar, Pencil
  - [x] `ReminderRow.jsx` (shared), `ReminderModal.jsx` (per-job CRUD/snooze/complete), `ReminderCenter.jsx` (metrics/tabs/filters/grouped Upcoming)
  - [x] `JobCard.jsx` — most-urgent indicator chip + "Reminders" button (count badge); thread `onOpenReminders` via `Board`/`Column`
  - [x] `Header.jsx` — bell button + overdue(red)/due-today(amber) badge
  - [x] `App.jsx` — `reminderModal`/`reminderCenterOpen` state, `appendAutoReminder` on add/status-edit/drag, `handleUpdateJobReminders`
  - [x] Update `LLM.md`, `architecture/data-layer.md`, `architecture/ui-components.md`

- [x] **Phase 4 — Stylize**
  - [x] Reuse status tokens (overdue→`rejected`, dueToday→`followup`, upcoming→`offer`); modal chrome matches existing modals; no new CSS tokens

- [x] **Phase 5 — Trigger**
  - [x] `npx eslint` clean on all new/modified files
  - [x] Verify via Playwright (local, no mocking): auto-reminders, per-job CRUD/snooze/complete, header badge, Reminder Center metrics/tabs/filters/grouping — no console errors
  - [ ] Reminder export/import round-trip — covered by the existing job export/import path; quick manual check recommended

## How to run
```bash
cd JobTrackerApp
npm install   # already done
npm run dev   # opens on http://localhost:5173
```
