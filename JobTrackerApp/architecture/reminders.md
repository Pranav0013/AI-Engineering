# SOP — Follow-Up Reminder System (`src/lib/reminders.js` + Reminder UI)

## Goal
Help users manage recruiter follow-ups, interview actions, pending responses, and offer deadlines. Each job carries a list of reminders; the system dynamically categorizes them into **Overdue / Due Today / Upcoming / Completed**, surfaces them across the app (job-card indicators, a header badge, and a global Reminder Center), and auto-creates reminders based on a job's status.

This feature is **100% local** — no network calls. All logic in `src/lib/reminders.js` is pure/deterministic (Layer 3); persistence rides on the existing `jobs` object store (Layer 3 `db.js`); orchestration lives in `App.jsx` (Layer 2).

## Adaptation note (vs. the original spec)
The spec references "Job Details page", "Sidebar", and a routed "Reminder Center page". This app is a single-screen, modal-based Kanban board with no router. The feature is therefore adapted to the existing shape:
- **Per-job reminder management** → `ReminderModal` (opened from a button on the `JobCard`), mirroring `InterviewPrepModal`.
- **Reminder Center page** → `ReminderCenter` modal (opened from a header bell button).
- **Sidebar / global badges** → a badge on the header bell button + a status chip on each `JobCard`.
- **`followUpDate` / `nextActionDate` job fields** from the spec are not stored as separate columns; the reminders array is the single source of truth, and "next action" is derived from it.

## Data shapes

### Reminder (stored inside `job.reminders[]`, persisted as part of the `jobs` record)
```json
{
  "id": "string (uuid)",
  "jobId": "string (the owning job's id)",
  "title": "string, required",
  "type": "enum: FOLLOW_UP | INTERVIEW | RECRUITER_RESPONSE | APPLICATION_CHECK | OFFER_DEADLINE | CUSTOM",
  "dueDate": "string (ISO date, YYYY-MM-DD), required",
  "completed": "boolean",
  "completedAt": "string (ISO datetime) | null",
  "notes": "string, optional",
  "priority": "enum: LOW | MEDIUM | HIGH",
  "auto": "boolean — true if created by status automation (used to dedupe & label)"
}
```
`Job` gains one new key: `reminders: Reminder[]` (defaults to `[]`). No DB migration is needed — IndexedDB object stores are schemaless beyond the `keyPath`, exactly like `interviewPreparation`.

## Status calculation (dynamic, never stored)
`reminderStatus(reminder, today = todayISODate())`:
- `reminder.completed` → `'completed'`
- `dueDate < today` → `'overdue'`  🔴
- `dueDate === today` → `'dueToday'` 🟡
- `dueDate > today` → `'upcoming'` 🟢

ISO date strings (`YYYY-MM-DD`) compare correctly with `<`/`===`/`>`, so no Date parsing is needed for status. Day-count labels (`daysUntil`) parse at UTC midnight via `addDays`/`Date` to stay timezone-stable.

Status → color token reuse (`REMINDER_STATUS_META`): overdue → `rejected` (red), dueToday → `followup` (amber), upcoming → `offer` (green), completed → `slate`.

## Auto-reminder rules (`appendAutoReminder(job)`)
When a job enters a status, an auto reminder is created **only if no reminder of that `type` already exists on the job** (prevents spam on repeated drags and avoids clashing with a manual one). Returns a new `reminders` array (unchanged if nothing to add).

| Status      | type               | title                       | dueDate basis                | priority |
|-------------|--------------------|-----------------------------|------------------------------|----------|
| `applied`   | `FOLLOW_UP`        | Follow up with recruiter    | `dateApplied` + 7 days       | MEDIUM   |
| `followup`  | `RECRUITER_RESPONSE` | Check recruiter response  | today + 5 days               | MEDIUM   |
| `interview` | `INTERVIEW`        | Prepare for interview       | today + 2 days               | HIGH     |
| `offer`     | `OFFER_DEADLINE`   | Review & respond to offer   | today + 3 days               | HIGH     |
| `wishlist`/`rejected` | —        | (no auto reminder)          | —                            | —        |

Adaptation: the spec phrases Interview/Offer reminders relative to an interview date / offer-expiry date. This app stores no such dates, so those auto reminders are dated relative to the **transition date (today)** — `applied` uses the real `dateApplied`. This is documented as a known simplification; users can edit/snooze the date afterward.

`appendAutoReminder` is invoked by Layer 2 (`App.jsx`) on: job creation, an edit that changes status, and a drag that changes status.

## Other pure helpers (Layer 3)
- `REMINDER_TYPES` — `[{ key, label }]` for the 6 types (drives selects).
- `REMINDER_PRIORITIES` — `['LOW','MEDIUM','HIGH']`; `PRIORITY_META` for label/color.
- `addDays(isoDate, n)` → ISO date string (UTC-safe).
- `daysUntil(dueDate, today)` → integer (negative = overdue by N).
- `createReminder(fields)` → full Reminder with `id`, `completed:false`, `completedAt:null`.
- `flattenReminders(jobs)` → `[{ reminder, job }]` across all jobs (for the Center).
- `summarizeReminders(jobs, today)` → `{ total, overdue, dueToday, upcoming, completed, completionRate }`.
- `cardIndicator(job, today)` → the single most-urgent **active** reminder summary for a card: `{ status, label }` or `null` (overdue > dueToday > soonest upcoming; completed ignored).
- `groupUpcoming(items, today)` → `{ today, tomorrow, thisWeek, nextWeek, later }` buckets (used by the Upcoming tab).

## UI surfaces

### JobCard
- A status chip (only if `cardIndicator` is non-null) shows the most urgent active reminder, e.g. `🔴 Follow-up overdue`, `🟡 Action due today`, `🟢 Next action in 4d`. Colored via the status token.
- A "Reminders" button (always visible, alongside the existing "Interview Prep" button) opens `ReminderModal` for that job. Shows a small count badge of active (non-completed) reminders.

### ReminderModal (per-job)
- Lists the job's reminders grouped by status (Overdue → Due Today → Upcoming → Completed).
- "Add reminder" form: title* , type* , dueDate* , priority, notes. Required: title + dueDate (+ type, defaulted to `CUSTOM`).
- Per-reminder actions (via shared `ReminderRow`): Complete/Reopen, Snooze (Tomorrow / +3d / +7d / custom date), Edit (inline), Delete.
- Calls `onUpdateReminders(newReminders)` → `App` persists via `db.updateJob`.

### ReminderCenter (global, header bell)
- **Metrics row**: Total, Overdue, Due Today, Upcoming, Completed, Completion Rate.
- **Tabs**: All / Overdue / Due Today / Upcoming / Completed (counts in labels).
- **Filters**: priority, type, company, date range (from/to). Applied to the active tab's list.
- **List**: each item shows the job (company · role) + the shared `ReminderRow`. The Upcoming tab is sub-grouped via `groupUpcoming` (Today / Tomorrow / This Week / Next Week / Later).
- Actions: Complete/Reopen, Snooze, Delete inline; **Edit** deep-links to that job's `ReminderModal` (so there's a single edit form). Calls `onUpdateJobReminders(jobId, newReminders)`.

### Header
- A bell button opens `ReminderCenter`. A badge overlays it when there are active overdue (red) and/or due-today (amber) reminders, e.g. a red dot with the overdue count.

## Persistence
- Reminders live on the `job.reminders` array, so they are saved by `db.updateJob` and included automatically in `db.exportAllData` / restored by `db.importAllData` — no `db.js` change required. Survives reloads/restarts like all other job data.

## Edge cases
- A job with no `reminders` key (older records) is treated as `reminders: []`.
- Completing a reminder sets `completed:true` + `completedAt = now`; reopening clears both.
- Snoozing only changes `dueDate` (status re-derives automatically).
- Auto reminders never duplicate an existing same-`type` reminder (manual or auto), so re-dragging through a column doesn't spam.
