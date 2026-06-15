# LLM.md — Project Constitution (Job Tracker App)

> Status: BUILD COMPLETE (2026-06-13). All phases of BLAST executed. App runs via `npm run dev`.

## 1. Data Schema (Input/Output Shapes)

### JobCard record (stored in IndexedDB object store `jobs`)
```json
{
  "id": "string (uuid, primary key)",
  "company": "string, required",
  "role": "string, required",
  "jobUrl": "string (URL), optional",
  "resume": "string, optional (selected from resumeOptions list, or freeform)",
  "dateApplied": "string (ISO date, e.g. 2026-06-13), auto-set on creation, editable",
  "salaryRange": "string, optional, freeform e.g. '$150-180K' or '₹25-30 LPA'",
  "notes": "string, optional",
  "status": "enum: wishlist | applied | followup | interview | offer | rejected",
  "createdAt": "string (ISO datetime), set on creation, immutable",
  "updatedAt": "string (ISO datetime), updated on every edit",
  "jobDescription": "string, optional. Sole source text for the AI Interview Question Generator (added 2026-06-14).",
  "interviewPreparation": "object, optional. See 'Interview Preparation result shape' below (added 2026-06-14).",
  "reminders": "Reminder[], defaults to []. Follow-Up Reminder System (added 2026-06-15). See 'Reminder shape' below."
}
```
(2026-06-14 revision: `yearsOfExperience`/`resumeSkills` fields were removed from `JobModal` and are no longer written — question generation now depends only on `jobDescription` + `role` + `company`. Any pre-existing values on old records are simply ignored.)

### Interview Preparation result shape (in `job.interviewPreparation`, added 2026-06-14)
```json
{
  "generatedAt": "string (ISO datetime)",
  "technicalQuestions": ["QuestionItem", "..."],
  "behavioralQuestions": ["QuestionItem", "..."],
  "roleSpecificQuestions": ["QuestionItem", "..."],
  "codingQuestions": ["QuestionItem", "..."],
  "systemDesignQuestions": ["QuestionItem", "... (empty if role not senior)"],
  "mostAskedQuestions": ["QuestionItem", "... (empty if the model has no specific knowledge of this company's interview questions; UI hides this section entirely when empty)"]
}
```
`QuestionItem`:
```json
{
  "id": "string (uuid)",
  "question": "string",
  "difficulty": "enum: Easy | Medium | Hard",
  "practiced": "boolean",
  "favorite": "boolean",
  "answer": "string | null (populated on-demand via Suggested Answer)",
  "showAnswer": "boolean"
}
```

### Reminder shape (each element of `job.reminders[]`, added 2026-06-15)
```json
{
  "id": "string (uuid)",
  "jobId": "string (owning job id)",
  "title": "string, required",
  "type": "enum: FOLLOW_UP | INTERVIEW | RECRUITER_RESPONSE | APPLICATION_CHECK | OFFER_DEADLINE | CUSTOM",
  "dueDate": "string (ISO date YYYY-MM-DD), required",
  "completed": "boolean",
  "completedAt": "string (ISO datetime) | null",
  "notes": "string, optional",
  "priority": "enum: LOW | MEDIUM | HIGH",
  "auto": "boolean — created by status automation (used to dedupe & label)"
}
```
Status (Overdue / Due Today / Upcoming / Completed) is **derived dynamically** from `dueDate` vs. today (and `completed`), never stored — see `architecture/reminders.md`. Reminders ride on the `jobs` record (no new object store), so they are persisted by `db.updateJob` and carried by export/import automatically.

### App settings record (stored in IndexedDB object store `settings`, single row, id='app')
```json
{
  "id": "app",
  "theme": "enum: light | dark",
  "resumeOptions": ["string", "... previously used resume names"],
  "groqApiKey": "string, optional. User's own GROQ API key (BYOK), used only by the JD Summarizer. Empty string = AI mode disabled, heuristic mode used."
}
```

### JD Summarizer result shape (in-memory only, not persisted)
```json
{
  "mode": "enum: 'ai' | 'heuristic'",
  "warning": "string, optional (e.g. AI call failed, fell back to heuristic)",
  "keyResponsibilities": ["string", "..."],
  "requiredSkills": ["string", "..."],
  "niceToHaveSkills": ["string", "..."],
  "salaryInfo": ["string", "..."],
  "experienceRequirements": ["string", "..."],
  "redFlags": ["string", "..."]
}
```

### Export/Import JSON payload shape
```json
{
  "exportedAt": "string (ISO datetime)",
  "jobs": ["...array of JobCard records"],
  "settings": { "theme": "light | dark", "resumeOptions": ["..."] }
}
```

## 2. Behavioral Rules
- Cards within a column default-sort by `dateApplied`, **newest first**. User can toggle to oldest-first.
- Deleting a card always shows a confirmation dialog before removal (no exceptions).
- Importing JSON must warn the user that it will overwrite/merge existing data before proceeding — no silent data loss.
- All required-field validation (company, role) happens before save; form will not submit with empty required fields.
- "Days since applied" is computed from `dateApplied` to today, displayed on each card.

## 3. Link Phase (Phase 2) — Status: N/A for the core app; opt-in for JD Summarizer
The core app has no external services, APIs, or credentials (per Discovery: fully offline, no integrations). There is nothing to handshake/verify there, and no `.env` is used.

**Exception — JD Summarizer (added 2026-06-13, switched to GROQ same day):** if the user supplies their own GROQ API key in Settings, the app calls `https://api.groq.com/openai/v1/chat/completions` directly from the browser (model `llama-3.3-70b-versatile`, `Authorization: Bearer <key>`). This is strictly opt-in BYOK — see `architecture/jd-summarizer.md`. No key is ever hardcoded, bundled, or sent anywhere except `api.groq.com`. (Originally implemented against the Anthropic API per the `claude-api` skill's default; switched to GROQ at the user's request since they already hold a GROQ key.)

**Exception — AI Interview Question Generator (added 2026-06-14):** reuses the same `settings.groqApiKey` (BYOK) and the same GROQ endpoint/model as the JD Summarizer. No separate key or settings field. Unlike the JD Summarizer, there is no offline fallback — generation requires the key (see `architecture/interview-questions.md`). Note: the "Most Asked Questions (Company-Specific)" category is **not** a live internet search (no search/browsing tool is integrated) — it relies solely on the model's training-data knowledge and returns an empty array (hidden in the UI) if it has no specific knowledge of that company.

## 4. Architect Layer Mapping (Phase 3, adapted for a frontend app)
The original 3-layer model (architecture / navigation / tools) is adapted as follows for a local-first React app:
- **Layer 1 — Architecture (`architecture/*.md`):** SOPs describing the data layer contract, component contracts, and drag-and-drop logic. Update these first if logic changes.
- **Layer 2 — Navigation (`src/App.jsx`):** Reasoning/orchestration layer — owns top-level state, routes data between the data layer (Layer 3) and UI components, handles drag-and-drop events.
- **Layer 3 — Tools (`src/lib/db.js`, `src/lib/utils.js`):** Deterministic, atomic functions — IndexedDB CRUD operations and pure helper functions (date math, sorting, id generation). No React state here.

## 5. Architectural Invariants
- 100% local-first **by default**: all reads/writes go through IndexedDB via `idb`. No backend, no auth.
- **No network calls by default.** The sole exception is the JD Summarizer's optional AI mode (Section 3), which is off unless the user supplies their own GROQ API key in Settings — see `architecture/jd-summarizer.md`.
- React 18+ functional components + hooks only.
- Vite for build/dev tooling; app lives at the root of `JobTrackerApp/`.
- Tailwind CSS for all styling.
- `@dnd-kit/core` for drag-and-drop between Kanban columns.
- `status` field is the single source of truth for Kanban column placement — drag-and-drop updates `status` (and `updatedAt`) on drop.
- The six Kanban columns, in fixed order: Wishlist, Applied, Follow-up, Interview, Offer, Rejected.

## 6. File Map
```
JobTrackerApp/
├── src/
│   ├── main.jsx          # entry point (imports Inter via @fontsource-variable/inter — bundled, no CDN)
│   ├── App.jsx           # Layer 2 — state, orchestration, drag-and-drop handler
│   ├── index.css         # Tailwind v4 import, @theme status + brand tokens, dark variant, aurora bg, glass/gradient/animation utilities
│   ├── lib/
│   │   ├── db.js          # Layer 3 — IndexedDB CRUD (idb)
│   │   ├── utils.js        # Layer 3 — STATUSES, date helpers, sort/search
│   │   ├── jdSummarizer.js  # Layer 3 — JD Summarizer: heuristic extractor + optional GROQ API call
│   │   ├── interviewQuestions.js # Layer 3 — AI Interview Question Generator: GROQ prompt + on-demand answer call
│   │   └── reminders.js     # Layer 3 — Follow-Up Reminder System: status calc, auto-reminders, metrics, grouping (pure, no network)
│   └── components/
│       ├── Header.jsx      # title, search, sort, theme, import/export, add job, summarize JD, reminders bell (badge), settings
│       ├── Board.jsx        # DndContext + column layout
│       ├── Column.jsx        # one Kanban column (droppable + sortable list)
│       ├── JobCard.jsx        # individual job card (draggable): reminder indicator chip + Reminders/Prep buttons
│       ├── JobModal.jsx       # add/edit form
│       ├── ConfirmDialog.jsx  # delete + import confirmations
│       ├── SummarizerModal.jsx # JD Summarizer: paste JD, view 6-section results
│       ├── SettingsModal.jsx  # GROQ API key (BYOK) entry for JD Summarizer AI mode
│       ├── InterviewPrepModal.jsx # AI Interview Question Generator: generate/regenerate, accordion results, per-question actions
│       ├── ReminderModal.jsx  # per-job reminder CRUD / snooze / complete
│       ├── ReminderCenter.jsx # global reminder dashboard: metrics, tabs, filters, grouped upcoming
│       ├── ReminderRow.jsx    # shared reminder row (used by ReminderModal + ReminderCenter)
│       └── icons.jsx          # inline SVG icon set
├── architecture/
│   ├── data-layer.md     # SOP for src/lib/db.js
│   ├── ui-components.md  # SOP for component tree + drag-and-drop logic
│   ├── jd-summarizer.md  # SOP for JD Summarizer (heuristic + optional GROQ API)
│   ├── interview-questions.md # SOP for AI Interview Question Generator
│   └── reminders.md       # SOP for the Follow-Up Reminder System
```

## 7. Maintenance Log
- 2026-06-13: Initial build completed end-to-end (Phases 0-5). Vite + React 19 + Tailwind v4 + idb + dnd-kit. Verified via headless Chromium: CRUD, search, dark mode, tablet responsiveness — no console errors.
- 2026-06-13: Added Job Description Summarizer feature (paste JD → Key Responsibilities, Required Skills, Nice-to-Have Skills, Salary Information, Experience Requirements, Potential Red Flags). Local heuristic extractor by default; optional opt-in AI enhancement (BYOK, see Section 3 and `architecture/jd-summarizer.md`). Revised the "no network calls" invariant to "no network calls by default" (Section 5).
- 2026-06-13: Switched JD Summarizer's AI mode from Anthropic Claude to GROQ (`llama-3.3-70b-versatile`, OpenAI-compatible `/chat/completions` endpoint) — user already holds a GROQ key (same one used in `BlastFramework-JiratestPlanner`) and got a 401 testing with the Claude implementation. Settings field renamed `anthropicApiKey` → `groqApiKey`.
- 2026-06-14: Fixed drag-and-drop smoothness — added a `DragOverlay` (see `architecture/ui-components.md`) so a floating card preview follows the cursor during cross-column drags instead of the source card just fading out and teleporting on drop. Extracted `JobCardContent` from `JobCard.jsx` for reuse in the overlay; moved `BORDER_COLOR` to `src/lib/utils.js`.
- 2026-06-14: Redesigned the header toolbar — all buttons now have `cursor-pointer` + tactile `active:scale-95`, grouped into a segmented "pill" control with dividers (view controls / data controls / settings), and every button has a descriptive `title` + `aria-label`. Replaced `SparklesIcon` (now a 4-point AI star) and `SettingsIcon` (now a proper gear) since both previously rendered as near-identical sunbursts to `SunIcon` at 16px.
- 2026-06-14: Added the AI Interview Question Generator (`architecture/interview-questions.md`). Per-job feature: `JobCard` gets a new icon button opening `InterviewPrepModal`, which calls GROQ (reusing `settings.groqApiKey`, no new key) to generate 5 categories of difficulty-rated interview questions from the job's title/company/`jobDescription` (+ optional `yearsOfExperience`/`resumeSkills`), persisted as `job.interviewPreparation`. Accordion UI with Copy/Mark-as-Practiced/Favorite/Suggested-Answer (on-demand)/Delete per question, and Regenerate (with a confirm dialog). Added `jobDescription`, `yearsOfExperience`, `resumeSkills` fields to `JobModal`.
- 2026-06-14 (follow-up, same day): Reworked the AI Interview Question Generator per user feedback:
  - `JobCard`'s Interview Prep trigger changed from a small hover-only icon to an always-visible, full-width labeled button ("Interview Prep") for discoverability.
  - Removed `yearsOfExperience`/`resumeSkills` from `JobModal` and the generator input — generation now depends only on `jobDescription`/`role`/`company`.
  - Added a 6th, optional category `mostAskedQuestions` ("Most Asked Questions (Company-Specific)") — the prompt asks the model to return company-specific interview questions only if it has specific training-data knowledge of that company, else `[]`; the UI hides this accordion section entirely when empty (never shows a "not found" message).
  - `generateAnswer` now takes a `category` param: for `codingQuestions`, it returns a real, runnable code solution (fenced code block + complexity note, `max_tokens: 1200`, fences stripped before returning) instead of a theory answer, rendered in a monospace `<pre>` block in the UI.
- 2026-06-15: Added the Follow-Up Reminder System (`architecture/reminders.md`). Each job gets a `reminders: Reminder[]` array (rides on the existing `jobs` store — no migration). Pure logic in `src/lib/reminders.js` derives Overdue/Due Today/Upcoming/Completed status dynamically, auto-creates a status-appropriate reminder on job creation / status change / drag (deduped by type), and computes dashboard metrics + timeframe grouping + per-card indicators. UI: `JobCard` shows a most-urgent reminder chip + a "Reminders" button (active-count badge); `Header` gets a bell button opening `ReminderCenter` (global metrics, tabs, filters, grouped Upcoming) with an overdue(red)/due-today(amber) badge; `ReminderModal` handles per-job CRUD/snooze/complete. Adaptation note: Interview/Offer auto-reminders are dated relative to the transition date (today) since the app stores no interview/offer-expiry dates; Applied uses real `dateApplied`+7. 100% local — no network calls.
- 2026-06-15: Applied a cohesive "Aurora" visual design system (presentation-only — no logic/data/component-contract changes). See `architecture/ui-components.md` → "Design system". Adds brand tokens + aurora gradient canvas + glass/gradient/animation utilities in `index.css`; bundles the Inter font locally via `@fontsource-variable/inter` (imported in `main.jsx`, no font CDN — preserves offline-first); glassmorphic header with gradient logo/CTA; frosted rounded-2xl columns with per-status gradient headers + glowing dots; cards with hover lift; and a uniform modal treatment (blurred backdrop, rounded-2xl, ring + pop animation, brand-gradient CTAs). New `BriefcaseIcon`. Verified via Playwright in light + dark, eslint clean, zero console errors.
- Known follow-ups (not blockers): import/export were implemented per the SOPs in `architecture/` but not exercised by the automated browser pass — do a quick manual check if modifying that code.
- **Golden Rule reminder:** if drag-and-drop, data schema, or component contracts change, update `architecture/*.md` and this file *before* changing the code.
