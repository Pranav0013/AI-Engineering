# Progress Log — Job Tracker App

## 2026-06-13

### Phase 0 — Initialization
- Created `task_plan.md`, `findings.md`, `progress.md`, `LLM.md` (Project Constitution, draft).

### Phase 1 — Blueprint
- Ran Discovery Q&A with user (5 questions condensed to 4 due to tool limit): full feature set from `Objective.md`, fully offline, new Vite project in `JobTrackerApp/`, newest-first sort + no-silent-data-loss on import.
- Drafted and finalized Data Schema in `LLM.md` (JobCard, settings, export/import payload).
- Research (1.3): confirmed `idb` and `@dnd-kit/core` + `@dnd-kit/sortable` as the standard libraries for IndexedDB and multi-column Kanban drag-and-drop. Logged sources in `findings.md`.
- Blueprint approved by user (requested build to proceed).

### Phase 2 — Link
- N/A — no external services/APIs. Documented in `LLM.md` section 3.

### Phase 3 — Architect
- Wrote `architecture/data-layer.md` and `architecture/ui-components.md` SOPs before writing code (Golden Rule).
- Scaffolded Vite + React 19 project (`create-vite`, template `react`) — scaffolded in a temp dir and merged in, since `create-vite` can't target a non-empty directory non-interactively.
- Installed: `tailwindcss` + `@tailwindcss/vite` (v4, CSS-first config), `idb`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- Built `src/lib/db.js` (IndexedDB CRUD via `idb`: jobs store, settings store, export/import) and `src/lib/utils.js` (STATUSES, date helpers, sort, search match).
- Built components: `Header`, `Board`, `Column`, `JobCard`, `JobModal`, `ConfirmDialog`, `icons`.
- Wired up `App.jsx`: load from IndexedDB on mount, search + sort + per-column grouping via `useMemo`, add/edit/delete handlers, drag-and-drop `onDragEnd`, theme toggle (persisted), export to JSON download, import with overwrite confirmation.

### Phase 4 — Stylize
- Tailwind v4 `@theme` status colors (wishlist/applied/followup/interview/offer/rejected) used for column dots and card left-border accents.
- Dark mode via `@custom-variant dark` + `.dark` class on `<html>`, toggled and persisted via settings store.
- Fixed initial layout bug: board/columns weren't filling viewport height. Made `main` a flex container and `Board`'s row `h-full`-equivalent (`flex-1` with stretch) so columns stretch full height and card lists scroll independently.

### Phase 5 — Trigger
- Ran `npm run dev` (Vite, port 5173).
- Verified with headless Chromium (Playwright + system Chrome):
  - Initial empty board renders all 6 columns, full height.
  - Add Job modal: validation, save, card appears in Wishlist with resume tag + "Today".
  - Dark mode toggle works, persists in settings.
  - Search filters cards by company/role across columns.
  - Edit modal pre-fills existing job data.
  - Delete confirmation dialog shows correct company/role and cannot-undo warning.
  - Tablet viewport (834px) — layout remains usable, columns scroll horizontally.
  - No console errors in any pass.
- Not yet manually exercised: drag-and-drop reordering across columns, export/import round-trip (both implemented per SOP).

## Status
Build complete. All `task_plan.md` Phase 0-5 items checked off except the two manual-only items noted above.

## 2026-06-13 — Feature: Job Description Summarizer

### Phase 1 — Blueprint
- User requested a JD Summarizer: paste a JD, generate Key Responsibilities, Required Skills, Nice-to-Have Skills, Salary Information, Experience Requirements, Potential Red Flags.
- Flagged conflict with the existing "100% local-first, no network calls" invariant (this feature is inherently LLM-shaped). Ran the `claude-api` skill to research current models, pricing, and client-side API key handling (BYOK via `anthropic-dangerous-direct-browser-access` header).
- Decision (logged in `findings.md`): hybrid, opt-in approach — local heuristic extractor by default (zero config, fully offline), optional Claude API enhancement (`claude-opus-4-8`) if the user supplies their own Anthropic API key in Settings. Revised the "no network calls" invariant to "no network calls by default" in `LLM.md`.

### Phase 2 — Link
- Documented the opt-in BYOK exception in `LLM.md` Section 3. No `.env`; key lives in IndexedDB `settings` store (`anthropicApiKey`), excluded from JSON export.

### Phase 3 — Architect
- Wrote `architecture/jd-summarizer.md` SOP before writing code (Golden Rule).
- `src/lib/jdSummarizer.js`: `summarizeOffline` (section-heading detection for Responsibilities/Requirements/Nice-to-have, regex for salary and experience patterns, curated red-flag phrase dictionary), `summarizeWithClaude` (fetch to `api.anthropic.com/v1/messages`, model `claude-opus-4-8`), `summarizeJD` orchestrator with fallback-on-error.
- `src/lib/db.js`: added `anthropicApiKey` to settings schema/defaults, merged defaults in `getSettings` for forward-compat with existing IndexedDB rows.
- New icons: `SparklesIcon`, `SettingsIcon`, `EyeIcon`, `EyeOffIcon`.
- New components: `SummarizerModal.jsx` (paste JD, Analyze, 6 result cards, AI/heuristic mode indicator, warning banner on fallback), `SettingsModal.jsx` (masked API key input with show/hide, save/clear, privacy note).
- Wired up `Header.jsx` (Summarize JD + Settings icon buttons) and `App.jsx` (modal state, `handleSaveApiKey`).

### Phase 4 — Stylize
- Matched existing Tailwind v4 aesthetic — modal chrome, input styling, and color tokens (`applied`, `rejected`, `followup`) reused from existing components; red-flag card gets a `rejected`-tinted accent border.

### Phase 5 — Trigger
- `npm run dev` already running (port 5173, HMR picked up all changes).
- Verified via headless Chromium (Playwright):
  - Heuristic mode end-to-end with a realistic JD: all 6 sections render, red-flag dictionary correctly caught "wear many hats", "fast-paced environment", "other duties as assigned", "unlimited PTO", "competitive salary", "fast-growing startup", plus a "no salary found" flag.
  - Settings modal: save/persist/clear of API key via IndexedDB confirmed (value round-tripped after reopening the modal).
  - Dark mode: re-verified summarizer + results render correctly.
  - `npx eslint` clean on all new/modified files. No console errors in any pass.
- Not exercised: AI-enhanced mode (`summarizeWithClaude`) requires a real Anthropic API key — code path handles non-2xx/network/parse errors via fallback-to-heuristic with a warning, but wasn't run against the live API.

## 2026-06-13 — Follow-up: switched JD Summarizer AI provider from Claude to GROQ

- User tested AI-enhanced mode with their GROQ API key (already provisioned for `BlastFramework-JiratestPlanner`) and got a 401 — the Claude implementation rejected the GROQ key (expected: different providers, different auth schemes).
- Asked the user whether to (a) replace Claude with GROQ entirely, or (b) support both via a provider selector. User chose (a).
- Changes:
  - `src/lib/jdSummarizer.js`: replaced `summarizeWithClaude` with `summarizeWithGroq` — calls `https://api.groq.com/openai/v1/chat/completions` (OpenAI-compatible), model `llama-3.3-70b-versatile` (matches `BlastFramework-JiratestPlanner`), `Authorization: Bearer <key>`, `response_format: { type: 'json_object' }`. Prompt updated to request JSON-only output (required for `json_object` mode). Response parsing reads `choices[0].message.content` instead of Anthropic's `content[0].text`.
  - `src/lib/db.js`: settings field renamed `anthropicApiKey` → `groqApiKey` (with default merge for forward-compat).
  - `src/App.jsx`, `SettingsModal.jsx`, `SummarizerModal.jsx`: renamed prop/field references and updated UI copy ("Anthropic API key" → "GROQ API key", placeholder `gsk_...`, mode label "AI-enhanced mode (GROQ)").
  - Updated `LLM.md` (Sections 1, 3, 5, 6, 7), `architecture/jd-summarizer.md` (added "Provider history" section), `findings.md`, and `task_plan.md` to reflect GROQ as the AI provider.
- `npx eslint` clean on all modified files. Heuristic-mode regression check via Playwright still passes (no console errors).
- Still outstanding: a live end-to-end run of `summarizeWithGroq` with a real GROQ key (the user's actual key was seen in a screenshot but not entered into this running app's Settings during verification).

## 2026-06-14 — Polish: Header buttons + drag-and-drop smoothness

### Investigation
- User attached `BugVideos/Screen Recording 2026-06-14 at 4.44.39 PM.mov` showing janky cross-column drag-and-drop, plus a screenshot of the header toolbar asking for better-looking buttons, `cursor: pointer` on hover, and clearer icon meanings.
- Installed `ffmpeg` (`brew install ffmpeg`, v8.1.1) and extracted 41 frames at 3fps. Frame-by-frame review (frames 16-24) showed the dragged card fading to near-invisible (`opacity: 0.4`, no overlay) and then teleporting into the destination column on drop — classic symptom of `@dnd-kit` `useSortable` without a `DragOverlay`.
- Also identified that `SparklesIcon` (Summarize JD) and `SettingsIcon` both rendered as sunburst/circle-with-rays shapes at 16px, visually indistinguishable from `SunIcon` (theme toggle) — this was the "two sun-like icons" the user flagged.

### Fixes
- Updated `architecture/ui-components.md` (Golden Rule) to describe the new `DragOverlay`-based approach before touching code.
- `src/components/JobCard.jsx`: extracted presentational `JobCardContent` (header, role, resume tag, day label) from the sortable wrapper `JobCard`.
- `src/lib/utils.js`: added `BORDER_COLOR` status-color map (moved here from `JobCard.jsx` to satisfy `react-refresh/only-export-components`).
- `src/components/Board.jsx`: now tracks `activeJob` via `onDragStart`/`onDragEnd`/`onDragCancel` and renders a `<DragOverlay>` with a floating, shadowed, slightly-rotated `JobCardContent` clone that follows the cursor for the whole drag.
- `src/components/icons.jsx`: replaced `SparklesIcon` with a 4-point "AI sparkle" star and `SettingsIcon` with a proper gear-with-teeth — both now clearly distinct from `SunIcon`/`MoonIcon`.
- `src/components/Header.jsx`: redesigned the toolbar — every button now has `cursor-pointer` + `active:scale-95`; the 7 icon buttons are now a single segmented "pill" group with dividers separating view controls (Summarize/Sort/Theme), data controls (Export/Import), and Settings; every button has a descriptive `title` + `aria-label`.

### Verification
- `npx eslint` clean on all modified files (`Header.jsx`, `Board.jsx`, `JobCard.jsx`, `icons.jsx`, `utils.js`).
- Playwright: confirmed all 7 header buttons report `cursor: pointer`; added two test jobs, dragged "Globex" from Wishlist → Applied — floating overlay card visible mid-drag (with shadow + slight rotation), card lands in Applied with correct counts, no console errors in light or dark mode.

## 2026-06-14 — Feature: AI Interview Question Generator

### Phase 1 — Blueprint
- User requested the feature from `AiFeatureInterviewQuestionsGenerator.md`: generate 5 categorized, difficulty-rated interview question sets (Technical/Behavioral/Role-Specific/Coding/System Design) from a job's title/description/skills/experience level, with per-question Copy/Mark-as-Practiced/Favorite/Delete and a bonus on-demand "Suggested Answer".
- Asked two `AskUserQuestion`s before starting (per "ask me if doubts"): UI placement → **dedicated modal via a new `JobCard` icon** (`InterviewPrepModal`); Suggested Answers → **on-demand per question**, cached after first generation. Both logged in `findings.md`.
- Confirmed reuse of the JD Summarizer's GROQ BYOK pattern (`settings.groqApiKey`) — no new settings field, and no offline fallback (this feature is inherently LLM-shaped).

### Phase 2 — Link
- No new connectivity: reuses the existing opt-in GROQ exception documented in `LLM.md` Section 3. Added a short note there clarifying this feature has no offline fallback (Generate is disabled without a key).

### Phase 3 — Architect
- Wrote `architecture/interview-questions.md` SOP before code (Golden Rule): data shapes (`job.interviewPreparation`, `QuestionItem`, `QUESTION_CATEGORIES`), and the two exposed functions `generateInterviewQuestions` (max_tokens 4096, fixed counts 12/8/10/5/4 with system-design conditional on seniority) and `generateAnswer` (max_tokens 600, on-demand).
- Updated `architecture/ui-components.md` (component tree, state ownership, JobCard/JobModal sections, new "AI Interview Question Generator" section) and `architecture/data-layer.md` (`updateJob` now also persists `jobDescription`/`yearsOfExperience`/`resumeSkills`/`interviewPreparation` as plain extra keys).
- `src/lib/interviewQuestions.js`: `generateInterviewQuestions` + `generateAnswer`, both calling GROQ (`llama-3.3-70b-versatile`, `response_format: json_object`), plus `QUESTION_CATEGORIES` constant (kept out of `.jsx` files to satisfy `react-refresh/only-export-components`).
- `src/components/icons.jsx`: added `InterviewPrepIcon`, `CopyIcon`, `StarIcon`, `CheckCircleIcon`, `ChevronDownIcon`, `RefreshIcon`, `LightbulbIcon`.
- `src/components/JobCard.jsx`: new hover-reveal icon button (visible only when `onOpenInterviewPrep` is passed) opens `InterviewPrepModal` for that job.
- `src/components/JobModal.jsx`: added optional `jobDescription` (textarea), `yearsOfExperience`, `resumeSkills` fields under a new "AI Interview Prep (optional)" section.
- `src/components/InterviewPrepModal.jsx` (new): accordion of the 5 categories with live counts, per-question difficulty badge + Copy/Mark-as-Practiced/Favorite/Suggested-Answer/Delete actions, Generate/Regenerate (regenerate behind a `ConfirmDialog`), no-JD prompt that deep-links into `JobModal` edit mode, no-API-key hint that deep-links into `SettingsModal`.
- Threaded `onOpenInterviewPrep` through `Board.jsx` → `Column.jsx` → `JobCard.jsx`; wired `App.jsx` state (`interviewPrepJob`), `handleSaveInterviewPrep`, and modal rendering.
- Updated `LLM.md` (data schema, interviewPreparation/QuestionItem shapes, Section 3 exception note, file map, maintenance log).

### Phase 4 — Stylize
- Reused existing Tailwind v4 tokens: difficulty badges map Easy→`offer` (green), Medium→`followup` (amber), Hard→`rejected` (red); the Interview Prep icon and "Suggested Answer" active state use the `interview` (purple) token. Accordion chevrons rotate via `rotate-180`; modal chrome matches `SummarizerModal`/`SettingsModal`.

### Phase 5 — Trigger
- `npx eslint` clean on all 8 new/modified files.
- Playwright (GROQ mocked via `page.route`, with the questions-call vs. answer-call distinguished by `'Interview Question:'` in the request body):
  - No-JD job: "add a job description" prompt shown; clicking it opens `JobModal` in edit mode (verified light + dark mode).
  - JD present, no API key: Generate button visible but disabled, Settings hint shown.
  - After Generate: all 5 accordion sections show correct counts (Technical 12, Behavioral 8, Role-Specific 10, Coding 5, System Design 4).
  - Mark-as-Practiced (strikethrough), Favorite, Copy-to-clipboard (verified in a context with `clipboard-read`/`clipboard-write` permissions), Suggested Answer (on-demand second GROQ call, then cached/toggle), and Delete (count decrements 8→7) all verified working.
  - Regenerate opens the "Regenerate interview questions?" confirm dialog as expected.
  - No console/page errors in any pass.
- Not exercised: live end-to-end run against the real GROQ API (no key available in this environment) — same outstanding item as the JD Summarizer's AI mode.

## 2026-06-14 — Follow-up revision: AI Interview Question Generator discoverability + scope

### Feedback addressed
- The hover-only Interview Prep icon on `JobCard` wasn't discoverable enough.
- `yearsOfExperience`/`resumeSkills` fields on `JobModal` should be removed — generation driven by JD + company only.
- New "Most Asked Questions" accordion for company-specific past interview questions — show only if found, never show a "not found" message.
- Coding question "Suggested Answer" should return a real code solution, not theory.

### Changes
- `src/components/JobCard.jsx`: removed the hover-only `InterviewPrepIcon` button; added a full-width, always-visible, labeled "Interview Prep" button (icon + text, `interview`-tinted) below the card's resume/date row.
- `src/components/JobModal.jsx`: removed `yearsOfExperience`/`resumeSkills` fields and their `emptyForm` entries.
- `src/lib/interviewQuestions.js`:
  - `buildQuestionsPrompt` no longer takes/uses `yearsOfExperience`/`resumeSkills`.
  - Added 6th category `mostAskedQuestions` to `QUESTION_CATEGORIES` with `optional: true` — prompt instructs the model to return company-specific past interview questions only if it has specific training-data knowledge of that company, else `[]`.
  - `buildAnswerPrompt`/`generateAnswer` now take a `category` param; for `codingQuestions`, requests a real working code solution (`max_tokens: 1200`) instead of a theory answer, and strips ` ``` ` fence markers globally from the result via a rewritten `stripCodeFences`.
- `src/components/InterviewPrepModal.jsx`: accordion loop skips rendering any `optional` category whose array is empty (so "Most Asked Questions" is invisible when the model has no company-specific knowledge — no "not found" message); `QuestionRow` now renders coding answers in a monospace `<pre>` block and non-coding answers as before; `handleShowAnswer` passes `category` to `generateAnswer`.
- Updated `architecture/interview-questions.md` (data shapes, `optional` flag semantics, "not live internet search" caveat), `architecture/ui-components.md` (JobCard/JobModal sections), and `LLM.md` (schema, Section 3 caveat, maintenance log).

### Verification
- `npx eslint` clean on all 4 modified files.
- Playwright (mocked GROQ): confirmed removed fields are gone from `JobModal`; "Interview Prep" button visible without hover; "Most Asked Questions (Company-Specific) (3)" renders when present; section fully absent (vs. `systemDesignQuestions`'s muted note) when `mostAskedQuestions: []`; coding "Generate code solution" renders fence-stripped prose+code in a `<pre>` block; non-coding suggested answers unaffected. No console errors.

## 2026-06-15 — Feature: Follow-Up Reminder System

### Phase 1 — Blueprint
- Spec (via `/model` command body): reminders for follow-ups/interviews/recruiter responses/offer deadlines, dynamic Overdue/Due Today/Upcoming categorization, dashboard widgets + metrics, a Reminder Center, per-job CRUD + snooze + completion tracking, status-based auto-reminders, global badges, job-card indicators, filtering, IndexedDB persistence.
- Adapted the routed-multi-page spec onto this modal-based single-screen app (no router): per-job `ReminderModal`, global `ReminderCenter` modal, header bell badge, per-card indicator chip. `reminders[]` on the job is the single source of truth (no separate `followUpDate`/`nextActionDate`). Logged the adaptation + the auto-reminder date simplification (Interview/Offer dated from today since no interview/offer-expiry dates are stored) in `findings.md` and `architecture/reminders.md`.

### Phase 2 — Link
- N/A — feature is 100% local (no network calls). No new settings/keys.

### Phase 3 — Architect
- Wrote `architecture/reminders.md` SOP before code (Golden Rule).
- `src/lib/reminders.js` (Layer 3, pure): types/priorities/status metadata, UTC-safe `addDays`, `daysUntil`, `reminderStatus`, `dueLabel`, `createReminder`, `appendAutoReminder` (deduped by type), `flattenReminders`, `summarizeReminders` (with completionRate), `cardIndicator`, `groupUpcoming`, `toggleComplete`.
- `src/components/ReminderRow.jsx` (new, shared): status/type/priority chips + complete/snooze/edit/delete actions + inline snooze options (Tomorrow / +3d / +7d / custom date).
- `src/components/ReminderModal.jsx` (new): per-job add/edit form + reminders grouped by status (Overdue → Due Today → Upcoming → Completed).
- `src/components/ReminderCenter.jsx` (new): metrics row, status tabs (counts), filters (priority/type/company/date range), Upcoming sub-grouped by timeframe; Edit deep-links to the per-job modal.
- `src/components/icons.jsx`: added Bell, Clock, Calendar, Pencil icons.
- `src/components/JobCard.jsx`: most-urgent reminder indicator chip + "Reminders" button (active-count badge) alongside the "Prep" button; threaded `onOpenReminders` via `Board`/`Column`.
- `src/components/Header.jsx`: bell button opening `ReminderCenter` with an overdue(red)/due-today(amber) badge.
- `src/App.jsx`: `reminderModal`/`reminderCenterOpen` state, `appendAutoReminder` on add/status-edit/drag, `handleUpdateJobReminders` persistence + open-modal sync. No `db.js` change (reminders ride on the `jobs` record).
- Updated `LLM.md` (schema + Reminder shape + file map + maintenance log), `architecture/data-layer.md`, `architecture/ui-components.md`.

### Phase 4 — Stylize
- Reused existing status tokens for reminder colors (overdue→`rejected`, dueToday→`followup`, upcoming→`offer`); modal chrome matches the other modals; no new CSS tokens.

### Phase 5 — Trigger
- `npx eslint` clean (one exhaustive-deps warning fixed by memoizing `reminders` in `ReminderModal`).
- Playwright (no mocking — local feature), zero console errors: auto follow-up reminder on Applied (overdue when `dateApplied` is 10 days ago) surfaces on the card + modal; per-job add/complete/snooze flows; header red badge "1"; Reminder Center metrics (Total 3 / Overdue 1 / Upcoming 1 / Completed 1 / Completion 33%), 5 tabs, company filter, and Upcoming timeframe buckets (This Week / Later) all verified.

## 2026-06-15 — Design pass: "Aurora" visual system

- Presentation-only overhaul (no logic/data/component-contract changes), per user request to make the app visually stunning. Full detail in `findings.md` → "Design pass" and `architecture/ui-components.md` → "Design system".
- `index.css`: brand tokens (indigo→violet), fixed aurora gradient canvas (light + richer dark), `.glass`/`.gradient-brand`/`.gradient-text`/`.animate-*` utilities, refined scrollbars.
- Inter font bundled locally via `@fontsource-variable/inter` (no CDN — keeps offline-first).
- Header (glassmorphic + gradient logo/CTA), Columns (frosted rounded-2xl, per-status gradient headers, glowing dots, dashed empty states), JobCard (depth + hover lift, kept in sync with the Board drag overlay), and all 7 modals (blurred backdrop, rounded-2xl, ring + pop, gradient CTAs). New `BriefcaseIcon`.
- Verified via Playwright in light + dark (board + Add Job modal + Reminder Center), eslint clean, zero console errors. Fixed two Tailwind v4 canonical-class lints (`min-w-4.5`/`h-4.5`, `bg-linear-to-b`).
