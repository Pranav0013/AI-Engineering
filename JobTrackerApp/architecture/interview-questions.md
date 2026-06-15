# SOP — AI Interview Question Generator (`src/lib/interviewQuestions.js`)

## Goal
For a saved job application, generate a categorized set of interview-prep questions tailored to the job title, company, and job description. Results are persisted on the job record (`job.interviewPreparation`) so they can be revisited, marked as practiced, favorited, or deleted without regenerating.

Unlike the JD Summarizer, **there is no offline/heuristic mode** — generating meaningful, role-specific interview questions is inherently LLM-shaped. This feature requires the user's own GROQ API key (BYOK, same key/store as the JD Summarizer — `settings.groqApiKey`).

## Data shapes

### Generator input
```ts
{
  jobTitle: string,        // job.role
  companyName: string,     // job.company
  jobDescription: string,  // job.jobDescription
}
```
(2026-06-14 revision: `yearsOfExperience`/`resumeSkills` inputs and the corresponding `JobModal` fields were removed — generation now depends only on the job title, company, and job description.)

### `job.interviewPreparation` (persisted result)
```ts
{
  generatedAt: string,  // ISO datetime
  technicalQuestions: QuestionItem[],
  behavioralQuestions: QuestionItem[],
  roleSpecificQuestions: QuestionItem[],
  codingQuestions: QuestionItem[],
  systemDesignQuestions: QuestionItem[],
  mostAskedQuestions: QuestionItem[],  // added 2026-06-14, see below
}
```

### `QuestionItem`
```ts
{
  id: string,              // crypto.randomUUID(), generated client-side
  question: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  practiced: boolean,      // "Mark as Practiced" toggle
  favorite: boolean,       // "Favorite" toggle
  answer: string | null,   // populated on-demand via "Suggested Answer" (bonus feature)
  showAnswer: boolean,      // whether the answer panel is expanded in the UI
}
```

`QUESTION_CATEGORIES` (exported constant, ordered for accordion display):
```ts
[
  { key: 'technicalQuestions', label: 'Technical Questions' },
  { key: 'behavioralQuestions', label: 'Behavioral Questions' },
  { key: 'roleSpecificQuestions', label: 'Role-Specific Questions' },
  { key: 'codingQuestions', label: 'Coding Questions' },
  { key: 'systemDesignQuestions', label: 'System Design Questions' },
  { key: 'mostAskedQuestions', label: 'Most Asked Questions (Company-Specific)', optional: true },
]
```
`optional: true` means: if the category's array is empty, the `InterviewPrepModal` accordion **does not render that section at all** (no header, no "no questions" placeholder) — used for `mostAskedQuestions` so that "couldn't find company-specific questions" is never surfaced to the user (per product decision, 2026-06-14). `systemDesignQuestions` is NOT optional — when empty it still renders its section with a muted "not generated for this role" note, since that's informative (explains *why* it's empty).

## Exposed functions

### `generateInterviewQuestions(input, apiKey): Promise<InterviewPreparation>`
- Throws if `apiKey` is empty — caller (UI) must check `settings.groqApiKey` first and disable the Generate button otherwise.
- Single non-streaming call to `https://api.groq.com/openai/v1/chat/completions`, model `llama-3.3-70b-versatile`, `response_format: { type: 'json_object' }`, `max_tokens: 4096`.
- Prompt ("senior technical interviewer" persona) asks for exactly: 12 technical, 8 behavioral, 10 role-specific, 5 coding questions; — **only for senior roles** (title contains Senior/Staff/Lead/Principal/Architect/Manager/Head, or the JD implies 5+ years) — 4 system design questions, otherwise `systemDesignQuestions: []`; and (2026-06-14) up to 8 `mostAskedQuestions` **only if the model has specific, recognizable training-data knowledge of that company's actual past interview questions** — the prompt explicitly instructs it to return `[]` rather than invent generic questions if it has no such knowledge. Every question gets a `difficulty` of `Easy | Medium | Hard`. Prompt explicitly asks to avoid duplicate questions and focus on technologies mentioned in the JD.
- **Important caveat**: `mostAskedQuestions` is **not** a live internet search — this app has no search/browsing tool. It relies entirely on whatever company-specific interview-question knowledge the LLM absorbed during training, which may be stale, incomplete, or (for lesser-known companies) entirely absent. The empty-array instruction is the mitigation for the "absent" case.
- Response is parsed, defensively stripped of ```` ```json ```` fences, and each raw `{question, difficulty}` is converted to a `QuestionItem` via `toQuestionItems` (adds `id`, `practiced: false`, `favorite: false`, `answer: null`, `showAnswer: false`; coerces unknown/missing difficulty to `'Medium'`; drops empty questions).
- Returns `{ generatedAt: <now ISO>, ...six category arrays }`. Throws on non-2xx, network error, or unparsable JSON — caller shows the error message and leaves any existing `interviewPreparation` untouched.

### `generateAnswer({ question, jobTitle, companyName, jobDescription, category }, apiKey): Promise<string>`
- The "Suggested Answers" bonus feature, implemented **on-demand per question** (not generated upfront with the question set) to keep the main generation call fast and bounded.
- `category` is the `QUESTION_CATEGORIES` key the question belongs to (e.g. `'codingQuestions'`). When `category === 'codingQuestions'`, the prompt requires a **complete, working code solution** (fenced code block + brief complexity note) rather than a theory answer — `max_tokens` is raised to `1200` for this case (vs `600` for non-coding categories) to fit a code block.
- Single GROQ call, `response_format: { type: 'json_object' }`, returns `{ "answer": string }`. The returned string has any wrapping ` ```lang ... ``` ` fence stripped via `stripCodeFences` before being returned, so the UI can render it directly.
- Throws on error; caller shows the error inline and leaves `q.answer` as `null` so the user can retry.

## UI flow (`InterviewPrepModal.jsx`)
- Opened via a prominent, **always-visible** "Interview Prep" button rendered at the bottom of every `JobCard` (icon + label, `interview`-tinted, full width — not a hover-only icon, per 2026-06-14 product feedback). One modal instance per job, state owned by `App.jsx` (`interviewPrepJob`).
- If `job.jobDescription` is empty: show a prompt to add a job description, with a button that closes this modal and opens `JobModal` in edit mode for this job (via `onEditJob`).
- Otherwise:
  - Header shows "Generated <date>" (or "No questions generated yet") and a Generate/Regenerate button (`RefreshIcon`, spins while loading, label "Generating questions...").
  - Button is disabled if `settings.groqApiKey` is empty, with an inline hint + link to open Settings.
  - First generation runs directly; if `job.interviewPreparation` already exists, regenerating shows a `ConfirmDialog` warning that it will replace the current set (losing favorite/practiced/answer state on old questions) before proceeding.
  - Results render as an accordion (one section per `QUESTION_CATEGORIES` entry, skipping `optional` entries whose array is empty — see above), each header showing `Label (count)`. `systemDesignQuestions` with `count === 0` renders a muted note instead of an empty list (role likely not senior-level).
  - Each question row shows the question text, a difficulty badge (Easy → `offer` green, Medium → `followup` amber, Hard → `rejected` red), and action buttons: **Copy** (question + answer if present, to clipboard), **Mark as Practiced** (toggles `practiced`, strikes through the question text when true), **Favorite** (toggles `favorite`, filled star when true), **Suggested Answer / Code Solution** (lazy-loads via `generateAnswer` on first click — for `codingQuestions` this renders the result in a monospace `<pre>` block as runnable code rather than prose — then toggles an inline answer panel), **Delete** (removes that question from its category array).
  - Every mutation (toggle/delete/answer) calls `onSave(updatedJob)` immediately — `App.jsx` persists via `db.updateJob` and updates `jobs` state. There is no separate "save" step.

## Architectural boundary
This is the **second** (and only other) module that performs `fetch` to a remote host, gated by the same `settings.groqApiKey` as the JD Summarizer (`architecture/jd-summarizer.md`). No new settings field is needed. `db.js` requires no functional changes — `interviewPreparation` (and `job.jobDescription`) are stored as plain extra keys on the existing `jobs` object store via the existing `updateJob`/`addJob`. (2026-06-14: `yearsOfExperience`/`resumeSkills` job fields were removed — they're no longer written by `JobModal`; any pre-existing values on old records are simply ignored.)
