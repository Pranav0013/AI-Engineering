# SOP — UI Components & Drag-and-Drop

## Component tree
```
App (Layer 2 — owns state: jobs[], settings, search query, sort order, modal state)
├── Header (title, search, sort, theme, import/export, add job, summarize JD, reminders bell + badge, settings)
├── SearchBar (search query input)
└── Board (DndContext wrapper)
    └── Column x6 (one per status, SortableContext)
        └── JobCard x N (useSortable)
JobModal (add/edit form, rendered conditionally over the board)
ConfirmDialog (delete confirmation, rendered conditionally)
SummarizerModal (JD Summarizer, rendered conditionally)
SettingsModal (GROQ API key entry, rendered conditionally)
InterviewPrepModal (AI Interview Question Generator, rendered conditionally — one job at a time)
ReminderModal (per-job reminder CRUD/snooze/complete, rendered conditionally — one job at a time)
ReminderCenter (global reminder dashboard, rendered conditionally)
  └── ReminderRow (shared reminder row; also used inside ReminderModal)
```

## State ownership (Layer 2 — App.jsx)
- `jobs`: array of JobCard records, loaded from `db.getAllJobs()` on mount, kept in sync with IndexedDB on every CRUD op.
- `settings`: `{ theme, resumeOptions }`, loaded on mount, persisted via `db.saveSettings()` on change.
- `searchQuery`: string, filters jobs by company/role (case-insensitive substring match).
- `sortOrder`: `'newest' | 'oldest'`, applied per-column.
- `modal`: `{ mode: 'add'|'edit', job: JobCard|null } | null`
- `confirmDelete`: `JobCard | null`
- `interviewPrepJob`: `JobCard | null` — which job's `InterviewPrepModal` is open (see "AI Interview Question Generator" section below)
- `reminderModal`: `{ job, editReminderId? } | null` — which job's `ReminderModal` is open (see "Follow-Up Reminder System" section below)
- `reminderCenterOpen`: `boolean` — whether the global `ReminderCenter` is open

## Drag-and-drop (dnd-kit)
- `Board` wraps everything in a single `DndContext`.
- Each `Column` is a `SortableContext` containing the ids of jobs with that column's status, items sorted by current `sortOrder`.
- Each `JobCard` uses `useSortable({ id: job.id })`. Its visual is split into `JobCardContent` (pure presentational JSX: header, role, resume tag, day label) and the `JobCard` wrapper (sortable ref/attributes/listeners + outer card chrome).
- `Board` tracks the in-progress drag (`activeJob` state, set in `onDragStart` from the flattened job list, cleared in `onDragEnd`/`onDragCancel`) and renders a `DragOverlay` containing a `JobCardContent` clone styled with a heavier shadow/slight rotation. This is the fix for "drag doesn't feel smooth" — without a `DragOverlay`, the only visual feedback is the original card dropping to `opacity: 0.4` in place, so a cross-column drag looks like the card vanishes and then teleports on drop. With the overlay, a floating copy follows the pointer the whole time; the original card stays in place at `opacity: 0.4` as a placeholder.
- On `onDragEnd`:
  - If the card's column (status) changed: update `job.status` to the destination column's status, set `updatedAt = now`, call `db.updateJob(job)`, update local `jobs` state.
  - Reordering within a column does NOT persist a manual order — the column always re-derives order from `sortOrder` + `dateApplied`. (Per Discovery: sort is the source of truth, not manual drag order.)

## Column headers
- Show column title + count of visible (post-search-filter) cards.

## JobCard contents
- Company name, role, resume tag (if set), "days since applied" (computed from `dateApplied` to today), clickable LinkedIn icon/link (if `jobUrl` set), left-border color accent per status.
- A reminder indicator chip (only when the job has an active reminder) shows the single most-urgent one via `cardIndicator()` — `🔴 <type> overdue` / `🟡 Action due today` / `🟢 Next action in Nd`, colored by the status token. (Added 2026-06-15.)
- A button row at the bottom with two half-width buttons: "Reminders" (`applied`-tinted, with an active-count badge) opens `ReminderModal`; "Prep" (`interview`-tinted) opens `InterviewPrepModal`. (2026-06-14: the Prep trigger became an always-visible labeled button; 2026-06-15: paired with the Reminders button.)
- Click anywhere on card (except the LinkedIn link, the Reminders/Prep buttons, and the delete button) → opens `JobModal` in edit mode.
- Delete button → opens `ConfirmDialog`.

## JobModal
- Fields: company* , role*, jobUrl, resume (combobox: free text + datalist of `settings.resumeOptions`), dateApplied (date input, defaults to today on add), salaryRange, notes, status (select, only shown/changeable in edit mode — add mode defaults to `wishlist`), jobDescription (textarea, optional — sole source text for the AI Interview Question Generator).
- (2026-06-14: removed `yearsOfExperience` and `resumeSkills` fields — question generation now depends only on `jobDescription`/title/company.)
- Validation: company and role required — block save + show inline error if empty.
- On save (add): generate `id` (crypto.randomUUID()), `createdAt`/`updatedAt` = now. If `resume` is new (not in `resumeOptions`), append it to `settings.resumeOptions` and persist settings.
- On save (edit): set `updatedAt` = now.

## AI Interview Question Generator (`InterviewPrepModal`, added 2026-06-14)
See `architecture/interview-questions.md` for the full SOP (prompt design, data shapes, GROQ call). Summary:
- Triggered per-job via the always-visible "Interview Prep" button on `JobCard`; `App.jsx` owns `interviewPrepJob` state (one modal at a time).
- If `job.jobDescription` is empty, the modal prompts the user to add one (shortcut into `JobModal` edit mode) instead of generating.
- "Generate Interview Questions" (or "Regenerate", with a `ConfirmDialog` if results already exist) calls `generateInterviewQuestions` (GROQ, BYOK via `settings.groqApiKey`) and persists the result to `job.interviewPreparation` via `onSave` → `db.updateJob`.
- Results render as an accordion (Technical/Behavioral/Role-Specific/Coding/System Design, plus an optional "Most Asked Questions (Company-Specific)" section that only appears if the model returned company-specific questions — never shown as "not found"), each question showing a difficulty badge and Copy/Mark-as-Practiced/Favorite/Suggested-Answer/Delete actions. Suggested Answers are generated on-demand per question (separate small GROQ call); for Coding questions this returns a real code solution rendered in a monospace block, not a theory answer.

## Follow-Up Reminder System (`ReminderModal` + `ReminderCenter`, added 2026-06-15)
See `architecture/reminders.md` for the full SOP (data shapes, status calc, auto-reminder rules). Summary:
- **Header bell button** opens `ReminderCenter` and overlays a badge: red with the overdue count, else amber with the due-today count (hidden when both are 0). `App.jsx` passes `reminderOverdue`/`reminderDueToday` from `summarizeReminders(jobs)`.
- **`ReminderModal`** (per-job, opened from the card's "Reminders" button): add/edit/delete reminders, mark complete/reopen, and snooze (Tomorrow / +3d / +7d / custom date). Reminders are grouped by derived status (Overdue → Due Today → Upcoming → Completed). Persists via `onUpdateReminders(newReminders)` → `App.handleUpdateJobReminders` → `db.updateJob`.
- **`ReminderCenter`** (global): a metrics row (Total / Overdue / Due Today / Upcoming / Completed / Completion %), status tabs (All / Overdue / Due Today / Upcoming / Completed with counts), filters (priority / type / company / due-date range), and a list of `{reminder, job}` rows. The Upcoming tab sub-groups by timeframe (Today / Tomorrow / This Week / Next Week / Later). Per-row Complete/Snooze/Delete act inline; **Edit** deep-links to that job's `ReminderModal` (single edit form).
- **Auto reminders**: `App.jsx` calls `appendAutoReminder(job)` on job creation, an edit that changes status, and a drag that changes status — creating one status-appropriate reminder (deduped by `type`). Status colors reuse the `rejected`/`followup`/`offer` tokens (🔴/🟡/🟢).

## Import/Export
- Export: `db.exportAllData()` → trigger browser download of `job-tracker-export-<date>.json`.
- Import: file picker (JSON only) → parse → show `ConfirmDialog` warning ("This will overwrite your current N jobs. Continue?") → on confirm, `db.importAllData(payload)` → reload `jobs`/`settings` state from DB.

## Theme
- `settings.theme` drives a `dark` class on `<html>`. `ThemeToggle` flips it and persists via `db.saveSettings()`.

## Design system ("Aurora", added 2026-06-15)
A cohesive visual layer applied on top of the existing component contracts (no logic/data changes). Defined in `src/index.css`:
- **Canvas:** a fixed "aurora" background — soft slate gradient with faint indigo/violet radial glows (richer in dark mode over a deep navy-slate `#070b16` base). `background-attachment: fixed` so it stays put while columns scroll.
- **Brand tokens:** `--color-brand` (#6366f1 indigo) → `--color-brand-accent` (#8b5cf6 violet). Utilities: `.glass` (frosted `backdrop-blur` surface), `.gradient-brand` (135° brand fill for primary CTAs + the logo mark), `.gradient-text` (brand-gradient clipped text for the wordmark), `.animate-rise`/`.animate-pop` entrance keyframes.
- **Typography:** Inter (bundled locally via `@fontsource-variable/inter`, imported in `main.jsx` — no font CDN, keeps the app offline), set as `--font-sans` with a system fallback stack; antialiased.
- **Surfaces:** Header and Columns use `.glass`; the Header has a gradient logo mark + "Job​Tracker" wordmark and a gradient "Add Job" CTA. Columns are rounded-2xl frosted panels with a per-status gradient header tint (`HEADER_TINT` static map) and a glowing status dot (`ring-4` halo). Cards have layered shadows + a hover lift (`-translate-y-0.5`). Empty columns show a dashed placeholder ("No jobs" / "Drop here" when a drag is over).
- **Modals:** shared chrome — blurred dark backdrop (`bg-slate-950/55 backdrop-blur-md`), `rounded-2xl` container with `shadow-2xl` + `ring-1` + `.animate-pop`, and brand-gradient primary buttons.
- Status colors (`wishlist`/`applied`/`followup`/`interview`/`offer`/`rejected`) are unchanged and still drive column accents, difficulty/priority/reminder chips, and the drag overlay.
