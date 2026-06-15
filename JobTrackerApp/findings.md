# Findings — Job Tracker App

## Source Material
- `Objective.md` — original feature prompt, very detailed already (data model, columns, features, tech stack, UI notes).
- `BLAST.md` — process framework being followed for this build.

## Discovery (Phase 1)
- **North Star:** Build the full feature set as specified in `Objective.md` (Kanban + drag-and-drop + CRUD + search + sort + export/import + dark mode) — "done" means all specified features work.
- **Integrations:** None. Fully offline, no external services, no API calls, no auth — exactly as Objective.md states.
- **Source of Truth:** IndexedDB via `idb` (per Objective.md, unchanged).
- **Delivery Payload:** Scaffold a new Vite + React project directly inside `JobTrackerApp/` (this directory). Run via `npm run dev` on localhost.
- **Behavioral Rules (additional to Objective.md):**
  - Cards within a column default-sort by date applied, **newest first**.
  - JSON import must warn before overwriting existing data — no silent data loss.
  - (Delete confirmation already required per Objective.md.)

## Research (Phase 1.3)
- **IndexedDB wrapper:** `idb` ([jakearchibald/idb](https://github.com/jakearchibald/idb)) is the standard promise-based wrapper — tiny, mirrors native IndexedDB API with `get/getAll/put/add/delete` shortcuts taking a `storeName`. Confirmed as the right choice (matches Objective.md spec).
- **Drag-and-drop:** `@dnd-kit/core` + `@dnd-kit/sortable` is the current standard for multi-column Kanban boards in React (chosen over `react-beautiful-dnd` for built-in accessibility/keyboard support). Pattern: `DndContext` wraps the board, each column is a `SortableContext`, each card uses the `useSortable` hook. Reference: [dnd-kit Multiple Sortable Lists guide](https://dndkit.com/react/guides/multiple-sortable-lists/), [LogRocket Kanban tutorial](https://blog.logrocket.com/build-kanban-board-dnd-kit-react/).
- Decision: use `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

## Constraints (from Objective.md)
- 100% local, no backend, no auth, no external API calls.
- React 18+, functional components + hooks, Vite, Tailwind CSS.
- Persistence via IndexedDB using the `idb` package.
- Drag-and-drop via `@dnd-kit/core` or `react-beautiful-dnd`.
- Responsive: usable on laptop + tablet.

## Feature: Job Description Summarizer (added 2026-06-13)

### Discovery
- **Requested output:** Paste a JD, generate Key Responsibilities, Required Skills, Nice-to-Have Skills, Salary Information, Experience Requirements, and Potential Red Flags.
- **Conflict identified:** This feature is inherently LLM-shaped (summarization/extraction, plus a judgment field "Potential Red Flags"). The existing architectural invariant (`LLM.md` Section 5, derived from Phase 1 Discovery) states: "100% local-first... No network calls, no auth, no backend."
- **Research (claude-api skill):** Current Claude model catalog checked (cached 2026-06-04). TypeScript/JS SDK applies (`.jsx` project). For a client-only app, any embedded API key would be extractable by end users — the only safe pattern is **bring-your-own-key (BYOK)**: the app's *user* supplies their own personal Anthropic API key, stored locally, sent directly from their browser to `api.anthropic.com` (requires the `anthropic-dangerous-direct-browser-access` header for CORS). This is the user's own key for their own local tool — conceptually similar to them using `curl` themselves.

### Decision
Adopt a **hybrid, opt-in approach** that preserves the offline-first default while allowing higher-quality results for users who want them:
1. **Default (no setup required): local heuristic extractor.** Pure regex/keyword-based parsing of the pasted JD text — section-heading detection for Responsibilities/Requirements/Nice-to-have, regex for salary figures and "X years experience" patterns, and a curated red-flag phrase dictionary (e.g. "wear many hats", "competitive salary", "unlimited PTO", "fast-paced environment", "other duties as assigned"). 100% offline, no network call, no API key. Lower quality than an LLM but functional and private.
2. **Optional (opt-in): Claude API enhancement.** If the user enters their own Anthropic API key in Settings, the app calls Claude directly from the browser (model: `claude-opus-4-8`, per claude-api skill default) to produce higher-quality structured results, especially for "Potential Red Flags". The key is stored only in the browser's IndexedDB and is sent only to `api.anthropic.com` when the user runs the summarizer. If the call fails for any reason, the app falls back to the local heuristic and shows why.
3. **Invariant revision:** `LLM.md` Section 5's "no network calls" invariant is revised to "no network calls **by default**" — the JD Summarizer is the sole, opt-in exception, gated entirely behind a user-supplied API key.

This was a reasonable-default decision made under Auto Mode (architecturally significant but reversible: the heuristic mode means the app is fully functional and private with zero configuration; the AI mode is strictly additive and off unless the user opts in).

### Update (2026-06-13, same day): switched AI provider from Claude to GROQ
- User tested the AI-enhanced mode with their GROQ API key (already provisioned for `BlastFramework-JiratestPlanner`) and got a 401 — the implementation called Anthropic's API, which doesn't accept a GROQ key.
- Asked the user via `AskUserQuestion`: replace Claude with GROQ entirely, or support both providers with a selector. **User chose: replace with GROQ.**
- Implemented: `summarizeWithGroq` calls `https://api.groq.com/openai/v1/chat/completions` (OpenAI-compatible), model `llama-3.3-70b-versatile` (same model as `BlastFramework-JiratestPlanner`), `response_format: { type: 'json_object' }`. Settings field renamed `anthropicApiKey` → `groqApiKey` throughout (`db.js`, `App.jsx`, `SettingsModal.jsx`, `SummarizerModal.jsx`).
- `LLM.md` Sections 1, 3, 5, 6, 7 and `architecture/jd-summarizer.md` updated accordingly.

## Polish: Header buttons + drag-and-drop smoothness (2026-06-14)

### Discovery
- User screenshotted the header toolbar and asked for: (1) better-looking buttons, (2) `cursor: pointer` on hover, (3) icons whose meaning is clear.
- User also attached a screen recording (`BugVideos/Screen Recording 2026-06-14 at 4.44.39 PM.mov`, 2560x1228, 13.8s) showing drag-and-drop across Kanban columns feeling "not smooth".

### Investigation
- Installed `ffmpeg` (`brew install ffmpeg`) and extracted frames at 3fps (`ffmpeg -v error -i ./*.mov -vf "fps=3" /tmp/jd_frames/frame_%03d.png`) — note: the literally-quoted filename failed for `ffprobe`/`ffmpeg` ("No such file or directory"); a glob (`./*.mov`) worked.
- Frame-by-frame review showed: during a cross-column drag, the source card drops to `opacity: 0.4` in place and essentially disappears (frames 17-19), then the card "teleports" into the destination column on drop (frame 21) with no visual continuity. Root cause: `JobCard` used `useSortable` with no `DragOverlay`, so there was no floating preview following the cursor.
- Separately, in the header screenshot, the `SparklesIcon` (Summarize JD) and `SettingsIcon` both rendered as near-identical sunburst/circle-with-rays shapes at 16px — visually indistinguishable from `SunIcon` (theme toggle), which is what the user meant by "two sun-like icons".

### Fixes
- **Drag-and-drop**: added a `DragOverlay` in `Board.jsx`. `Board` now tracks `activeJob` (set on `onDragStart`, cleared on `onDragEnd`/`onDragCancel`) and renders a floating, shadowed, slightly-rotated card clone that follows the cursor for the whole drag. Extracted `JobCardContent` (presentational JSX) out of `JobCard.jsx` so both the real card and the overlay clone share the same markup. Moved the `BORDER_COLOR` status-color map to `src/lib/utils.js` (was causing a `react-refresh/only-export-components` lint error when exported from `JobCard.jsx`).
- **Header buttons**: added `cursor-pointer` (+ `active:scale-95` tactile feedback) to every button. Replaced the 7 individually-bordered icon buttons with a single segmented "pill" group (`bg-slate-50`/`dark:bg-slate-900/40`, rounded, `p-1`) with dividers separating 3 logical sub-groups: view controls (Summarize JD, Sort, Theme), data controls (Export, Import), and Settings. Added descriptive `title` + `aria-label` to every button.
- **Icon clarity**: replaced `SparklesIcon` with a 4-point "AI sparkle" star (clearly distinct from a sun), and `SettingsIcon` with a proper gear-with-teeth icon — both now visually distinct from `SunIcon`/`MoonIcon`.
- Verified via Playwright: all 7 header buttons report `cursor: pointer`; drag from Wishlist → Applied shows a floating overlay card mid-drag and lands correctly with no console errors.

## Feature: AI Interview Question Generator (added 2026-06-14)

### Discovery
- User requested the feature described in `AiFeatureInterviewQuestionsGenerator.md`: analyze a job's Title/Description/Required Skills/Experience Level and generate 5 categorized, difficulty-rated question sets (Technical, Behavioral, Role-Specific, Coding, System Design-senior-only), with per-question Copy/Mark-as-Practiced/Favorite/Delete actions and a Regenerate option.
- Per the standing "ask me if doubts" instruction, asked two `AskUserQuestion`s before starting:
  - **UI placement** → user chose a dedicated modal opened via a new icon button on `JobCard` (`InterviewPrepModal`), rather than embedding the generator inline in `JobModal` or a separate page.
  - **Suggested Answers bonus** → user chose on-demand per-question generation (a small follow-up GROQ call triggered by a "Show Answer" button, cached on the question afterward), rather than generating all answers up front.
- This feature reuses the JD Summarizer's GROQ BYOK pattern (`settings.groqApiKey`, same endpoint/model). Unlike the JD Summarizer, there is **no offline/heuristic fallback** — the feature is inherently LLM-shaped, so the Generate button is simply disabled until the user has a GROQ key configured.

### Implementation
- New SOP `architecture/interview-questions.md` written before code (Golden Rule), documenting data shapes (`job.interviewPreparation`, `QuestionItem`, `QUESTION_CATEGORIES`) and the two exposed functions (`generateInterviewQuestions`, `generateAnswer`).
- `src/lib/interviewQuestions.js`: builds a single large prompt requesting fixed counts per category (12 technical / 8 behavioral / 10 role-specific / 5 coding / 4 system-design-if-senior, else empty), `max_tokens: 4096`; and a small per-question answer prompt, `max_tokens: 600`. Seniority detection (title keywords or 5+ years experience) is delegated to the LLM via prompt instructions, not client-side logic.
- `JobModal.jsx` gained optional `jobDescription`, `yearsOfExperience`, `resumeSkills` fields (used as generator input).
- `InterviewPrepModal.jsx`: accordion of the 5 categories with counts in the header, each question row showing difficulty badge + Copy/Mark-as-Practiced/Favorite/Suggested-Answer/Delete actions, Generate/Regenerate button (regenerate gated behind a `ConfirmDialog` since it discards favorites/practiced marks/answers), and a "no job description yet" prompt that deep-links to `JobModal` in edit mode.
- 7 new icons added to `icons.jsx` (`InterviewPrepIcon`, `CopyIcon`, `StarIcon`, `CheckCircleIcon`, `ChevronDownIcon`, `RefreshIcon`, `LightbulbIcon`).

### Verification
- `npx eslint` clean on all 8 new/modified files.
- Playwright (mocked GROQ responses via `page.route`, distinguishing the questions-call vs. the answer-call by checking for `'Interview Question:'` in the request body):
  - No-JD state shows the "add a job description" prompt; clicking it opens `JobModal` in edit mode.
  - With a JD but no API key: Generate button visible but disabled, Settings hint shown.
  - After generating: all 5 accordion sections show correct counts (12/8/10/5/4); Mark-as-Practiced (strikethrough), Favorite, Copy (verified with clipboard permissions granted in a dedicated context — the initial "false" result was a headless-Chromium clipboard-permission artifact, not an app bug), Suggested Answer (on-demand second GROQ call, cached), and Delete (count decrements) all work.
  - Regenerate opens the confirm dialog as expected.
  - Dark mode and light mode both render correctly; no console/page errors in any pass.
- Not exercised: a live end-to-end run against the real GROQ API (no GROQ key available in this environment) — same outstanding item as the JD Summarizer's AI mode.

## Follow-up revision: discoverability + scope changes (2026-06-14)

### Discovery
User feedback on the first cut of the feature:
1. The Interview Prep trigger (hover-only icon on `JobCard`) was too hard to find — wanted it "available easily... visible good and big... not on hover".
2. Wanted to remove the "Years of experience" / "Your key skills" `JobModal` fields — generation should be driven by the job description + company name only.
3. Wanted a new "Most Asked Questions" accordion scoping company-specific past interview questions "if available on the internet" — but explicitly: if none are found, **do not tell the user** ("do not show that previous questions didn't available... only show question if you found only").
4. Wanted the "Suggested Answer" feature for Coding questions to return a real code solution, not a theory explanation.

### Decisions (reasonable defaults under Auto Mode)
- **Button**: replaced the hover-only `InterviewPrepIcon` button with a full-width, always-visible, labeled "Interview Prep" button at the bottom of every `JobCard` (`interview`-tinted background/border).
- **Removed fields**: deleted `yearsOfExperience`/`resumeSkills` from `JobModal`'s form and from the generator input entirely (not just hidden — fully removed, per "don't add backwards-compat shims" guidance). Old records with these keys are simply ignored.
- **"Most Asked Questions" — important caveat communicated to user**: this app has **no internet search/browsing tool**. True "scout the internet for this company's real interview questions" isn't technically available here. The pragmatic equivalent: added a 6th category `mostAskedQuestions` to the same GROQ prompt, instructing the model to return company-specific questions **only if it has specific training-data knowledge** of that company's actual reported interview questions, and an empty array otherwise. `QUESTION_CATEGORIES` got an `optional: true` flag; `InterviewPrepModal` skips rendering that accordion section entirely when the array is empty — satisfying "don't tell the user if none found" exactly. This is best-effort/LLM-knowledge-based, not live search — documented as a caveat in `architecture/interview-questions.md` and `LLM.md`.
- **Coding answers**: `generateAnswer` now takes a `category` param. For `codingQuestions`, the prompt requires "a complete, working code solution... NOT a theoretical explanation" (summary + fenced code block + complexity note), `max_tokens` raised to 1200, and the response has any ` ``` ` fence markers stripped (globally, since the answer mixes prose and code) before being returned. The UI renders coding answers in a monospace `<pre>` block instead of a prose `<p>`.

### Verification
- `npx eslint` clean on all 4 modified files (`interviewQuestions.js`, `InterviewPrepModal.jsx`, `JobModal.jsx`, `JobCard.jsx`).
- Playwright (mocked GROQ):
  - Confirmed "Years of experience"/"Your key skills" fields no longer render in `JobModal`.
  - Confirmed the "Interview Prep" button on `JobCard` is visible without hovering.
  - With `mostAskedQuestions: [3 items]` in the mocked response: "Most Asked Questions (Company-Specific) (3)" section renders.
  - With `mostAskedQuestions: []`: no "Most Asked Questions" text appears anywhere (section fully absent, no "not found" message) — while `systemDesignQuestions: []` (not optional) still shows its muted "not generated for this role" note, confirming the two empty-state behaviors are correctly differentiated.
  - Coding question "Generate code solution" → mocked answer with prose + fenced code + complexity note renders in a `<pre>` block with fences stripped and both the prose and the `function twoSum(...)` code retained.
  - Non-coding "Generate suggested answer" still renders the theory-style answer as before.
  - No console/page errors in any pass.

## Feature: Follow-Up Reminder System (added 2026-06-15)

### Discovery
- Spec source: `/model` command body — a Follow-Up Reminder System (recruiter follow-ups, interview actions, pending responses, offer deadlines) with dynamic Overdue/Due Today/Upcoming categorization, dashboard widgets/metrics, a Reminder Center, per-job reminder CRUD + snooze + completion tracking, status-based auto-reminders, global notification badges, job-card indicators, filtering, and IndexedDB persistence.
- **Adaptation decision (Auto Mode):** the spec assumes a routed multi-page app ("Job Details page", "Sidebar", "Reminder Center page"). This app is a single-screen, modal-based Kanban board with no router. Mapped the spec onto the existing shape: per-job management → `ReminderModal` (opened from a card button, mirrors `InterviewPrepModal`); Reminder Center page → `ReminderCenter` modal (header bell); sidebar/global badges → a header bell badge + a per-card indicator chip. `followUpDate`/`nextActionDate` job fields from the spec are not stored separately — the `reminders[]` array is the single source of truth and "next action" is derived from it. Documented in `architecture/reminders.md`.
- **Auto-reminder date caveat:** the spec dates Interview/Offer auto-reminders relative to an interview date / offer-expiry date, but the app stores no such dates. Applied uses the real `dateApplied` + 7 days; Interview (+2), Offer (+3), and Follow-up→RecruiterResponse (+5) are dated relative to the transition date (today). Users can edit/snooze afterward. Documented as a known simplification.

### Implementation
- New SOP `architecture/reminders.md` written before code (Golden Rule).
- `src/lib/reminders.js` (Layer 3, pure, no network): `REMINDER_TYPES`/`REMINDER_PRIORITIES`/`PRIORITY_META`/`REMINDER_STATUS_META`; date helpers (`addDays` UTC-safe, `daysUntil`); `reminderStatus` (string-compares ISO dates → overdue/dueToday/upcoming, or completed); `dueLabel`; `createReminder`; `appendAutoReminder` (status→reminder, deduped by type); aggregation (`flattenReminders`, `summarizeReminders` with completionRate, `cardIndicator`, `groupUpcoming`); `toggleComplete`.
- Status colors reuse existing theme tokens: overdue→`rejected` (red), dueToday→`followup` (amber), upcoming→`offer` (green). No new CSS tokens.
- Components: `ReminderRow` (shared row: status/type/priority chips, complete/snooze/edit/delete, inline snooze options), `ReminderModal` (per-job add/edit form + grouped list), `ReminderCenter` (metrics row, tabs, filters, grouped Upcoming). 4 new icons (Bell, Clock, Calendar, Pencil).
- `JobCard` gained a most-urgent reminder indicator chip + a "Reminders" button (active-count badge) paired with the existing "Prep" button; `onOpenReminders` threaded through `Board`→`Column`→`JobCard`.
- `Header` gained a bell button opening `ReminderCenter`, with an overdue(red)/due-today(amber) count badge.
- `App.jsx`: `reminderModal`/`reminderCenterOpen` state; `appendAutoReminder` invoked on add, status-changing edit, and status-changing drag; `handleUpdateJobReminders(jobId, reminders)` persists via `db.updateJob` and keeps an open `ReminderModal` in sync. No `db.js` change — reminders ride on the `jobs` record (auto-covered by export/import).

### Verification
- `npx eslint` clean on all new/modified files (one `react-hooks/exhaustive-deps` warning fixed by memoizing `reminders` in `ReminderModal`).
- Playwright (no mocking needed — feature is 100% local), zero console/page errors:
  - Adding a job with status Applied + a 10-days-ago `dateApplied` auto-creates a `FOLLOW_UP` reminder dated `dateApplied`+7 → shows as **Overdue** on the card (`🔴 Follow Up overdue`) and in the modal's Overdue group.
  - Per-job modal: added a custom reminder (Due Today group), marked it complete (moved to Completed group), snoozed the follow-up +7 days (Overdue group disappeared).
  - Header bell shows a red "1" badge (one overdue follow-up on a second job).
  - Reminder Center: metrics correct (Total 3 / Overdue 1 / Due Today 0 / Upcoming 1 / Completed 1 / Completion 33%); all 5 tabs render with counts; Overdue tab lists the right job; company filter hides the non-matching job.
  - Upcoming tab sub-groups by timeframe — verified `This Week (1)` (a +7 reminder) and `Later (1)` (a +20 reminder) bucket headers with the right items.
- Not exercised: export/import round-trip of reminders (same standing caveat as the rest of import/export — reminders ride on the job record so they're covered by the existing code path).

## Design pass: "Aurora" visual system (2026-06-15)

### Request
User asked to make the app "high level good aesthetic beautiful looking… visually stunning." (Noted no dedicated frontend-design skill exists in this environment — applied a design system directly.)

### Approach (presentation-only — no logic/data/contract changes)
- **Foundation (`index.css`):** brand tokens (indigo `#6366f1` → violet `#8b5cf6`); a fixed "aurora" canvas (soft slate gradient + faint indigo/violet radial glows, richer over a deep navy-slate base in dark mode); utilities `.glass`, `.gradient-brand`, `.gradient-text`, `.animate-rise`/`.animate-pop`; refined scrollbars.
- **Font:** bundled Inter locally via `@fontsource-variable/inter` (imported in `main.jsx`) instead of a font CDN — deliberately, to preserve the offline-first invariant. Graceful system-font fallback.
- **Header:** glassmorphic sticky bar, gradient logo mark (`BriefcaseIcon`) + "Job​Tracker" gradient wordmark, refined search + segmented control, gradient "Add Job" CTA, refined bell badge.
- **Columns:** rounded-2xl frosted-glass panels, per-status gradient header tint (`HEADER_TINT` static map — dynamic class names don't JIT), glowing status dot (`ring-4` halo), refined count pill, dashed empty-state placeholder ("No jobs" / "Drop here").
- **Cards:** layered shadows + hover lift (`-translate-y-0.5`), refined typography/chips/buttons; `JobCardContent` kept in sync with the `Board` `DragOverlay` clone (now a more elevated, rotated/scaled card).
- **Modals (all 7):** uniform blurred dark backdrop, `rounded-2xl` + `shadow-2xl` + `ring-1` + `.animate-pop`, brand-gradient primary CTAs.

### Verification
- `npx eslint` clean across all components/lib (also resolved two Tailwind v4 canonical-class lints: `min-w-4.5`/`h-4.5`, `bg-linear-to-b`).
- Playwright in light + dark: board (header/columns/cards/empty states), Add Job modal, and Reminder Center all render correctly with zero console/page errors. Screenshots captured.
