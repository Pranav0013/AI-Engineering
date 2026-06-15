# SOP — JD Summarizer (`src/lib/jdSummarizer.js`)

## Goal
Given a pasted job description (plain text), produce six structured fields: Key Responsibilities, Required Skills, Nice-to-Have Skills, Salary Information, Experience Requirements, Potential Red Flags. Works with **zero configuration** (local heuristic). Optionally upgrades to GROQ API output if the user has supplied their own GROQ API key in Settings (BYOK). No code-execution layer in this app, so this is Layer 3 (deterministic-ish tools) called directly from `SummarizerModal.jsx` (Layer 2-ish, since it's a leaf component with local state).

## Result shape (returned by all entry points)
```ts
{
  mode: 'ai' | 'heuristic',
  warning?: string,            // present if AI was requested but fell back to heuristic
  keyResponsibilities: string[],
  requiredSkills: string[],
  niceToHaveSkills: string[],
  salaryInfo: string[],
  experienceRequirements: string[],
  redFlags: string[],
}
```
Empty arrays are valid ("nothing detected") — the UI renders a muted "Not specified in this JD" placeholder for empty sections.

## Exposed functions

### `summarizeOffline(jdText: string): Result`
Pure, synchronous, no I/O. Always `mode: 'heuristic'`.
- **Section extraction** (Responsibilities / Required / Nice-to-have): scans lines for heading-like lines (short, end with `:`, markdown `#` headers, or Title-Case-no-punctuation) matching a regex per category, then collects subsequent non-heading lines (bullet markers stripped) until the next recognized heading.
- **Salary**: regex scan of the whole text for `$`, `₹`, `€`, `£`, "LPA", "CTC", "k"-suffixed ranges, "per year/annum/hour/month". Deduplicated matches.
- **Experience**: regex scan for `N+ years`, `N-M years`, "minimum of N years", etc.
- **Red flags**: curated phrase dictionary (e.g. "wear many hats", "competitive salary", "unlimited PTO", "fast-paced environment", "other duties as assigned", "rockstar/ninja/guru", "equity in lieu of salary"). Each match contributes a human-readable note. If no salary info was found at all, append a red flag noting that.

### `summarizeWithGroq(jdText: string, apiKey: string): Promise<Result>`
- `fetch('https://api.groq.com/openai/v1/chat/completions', ...)` with headers `authorization: Bearer <key>`, `content-type: application/json`.
- Model: `llama-3.3-70b-versatile` (matches the model used elsewhere, e.g. `BlastFramework-JiratestPlanner`). Single non-streaming call, `max_tokens` capped, `response_format: { type: 'json_object' }` for guaranteed JSON (OpenAI-compatible API).
- Prompt instructs the model to return **only** a JSON object with the six result keys (arrays of strings) and explicitly says "Respond with JSON only" (required for `json_object` mode). Response text is defensively stripped of any ```` ```json ```` fences before `JSON.parse`.
- Throws on non-2xx response, network error, or unparsable output — caller catches and falls back.
- Always `mode: 'ai'` on success.

### `summarizeJD(jdText: string, apiKey: string | undefined): Promise<Result>`
Orchestrator used by `SummarizerModal.jsx`:
- No `apiKey` (empty/undefined) → return `summarizeOffline(jdText)` directly (`mode: 'heuristic'`, no `warning`).
- `apiKey` present → try `summarizeWithGroq`. On any error, return `summarizeOffline(jdText)` with `mode: 'heuristic'` and `warning` set to a short user-facing reason (e.g. "AI request failed (network or key error) — showing local analysis instead.").

## Edge cases
- Empty/whitespace-only input: `summarizeOffline` returns all-empty arrays; `SummarizerModal` disables the Analyze button until there's non-empty text.
- Very long JD pasted with AI mode: still a single non-streaming call — acceptable because `max_tokens` is bounded and typical JDs are well under context limits.
- API key invalid/revoked: `summarizeWithGroq` throws on 401 → falls back to heuristic with warning. Key itself is never logged or displayed (masked input in Settings).

## Architectural boundary
This is the **only** module in the app that performs `fetch` to a remote host, and only when `settings.groqApiKey` is non-empty. `db.js` and all other `lib/` modules remain network-free. See `LLM.md` Section 3 and Section 5 for the invariant this SOP implements.

## Provider history
Initially implemented against the Anthropic Claude API (per the `claude-api` skill's default for LLM-shaped features in an unstated-provider context). Switched to GROQ same day at the user's request: they already hold a GROQ key (used in `BlastFramework-JiratestPlanner`) and a test with that key against the Claude implementation returned a 401 (wrong provider for that key). GROQ's OpenAI-compatible API and `response_format: json_object` make the swap straightforward.
