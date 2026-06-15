# SOP — Data Layer (`src/lib/db.js`)

## Goal
Provide deterministic, atomic, promise-based functions for all persistence. No React state lives here. UI never touches `indexedDB` directly — always through this module.

## Database
- Name: `job-tracker-db`, version: `1`
- Object stores:
  - `jobs` — keyPath `id`. Indexes: none required (dataset is small; filtering done in memory).
  - `settings` — keyPath `id`. Single row with `id: 'app'`.

## Exposed functions
- `getDB()` — opens (and upgrades/creates stores on first run) the database. Internal use only.
- `getAllJobs()` → `Promise<JobCard[]>`
- `addJob(job)` → `Promise<void>` — `job` already has `id`, `createdAt`, `updatedAt` set by caller (Layer 2).
- `updateJob(job)` → `Promise<void>` — caller sets fresh `updatedAt` before calling. Also used to persist `jobDescription` (JobModal field), `interviewPreparation` (AI Interview Question Generator results, see `architecture/interview-questions.md`), and `reminders` (Follow-Up Reminder System, see `architecture/reminders.md`) — these are plain extra keys on the `jobs` record; no schema migration needed since `idb`/IndexedDB object stores are schemaless beyond the `keyPath`. Because reminders live on the job record, they are also carried automatically by `exportAllData`/`importAllData` and survive reloads/restarts.
- `deleteJob(id)` → `Promise<void>`
- `getSettings()` → `Promise<{id:'app', theme, resumeOptions}>` — returns defaults (`theme: 'light'`, `resumeOptions: []`) if no row exists yet.
- `saveSettings(settings)` → `Promise<void>`
- `exportAllData()` → `Promise<ExportPayload>` — `{ exportedAt, jobs, settings }`
- `importAllData(payload)` → `Promise<void>` — replaces `jobs` store contents and `settings` with payload contents (atomic transaction). Caller (Layer 2) is responsible for confirming overwrite with the user first.

## Edge cases
- First load: `jobs` store is empty, `settings` returns defaults — app must render an empty board, not an error.
- Import payload missing `settings` key: fall back to current settings (don't wipe theme/resumeOptions).
- All dates stored as ISO strings (not `Date` objects) for safe JSON export/import.
