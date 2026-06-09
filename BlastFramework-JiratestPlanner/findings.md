# Findings

## Jira API
- Cloud ID: `3038b9f7-4a71-4f45-8462-11208e70f642`
- Site: `https://docmx.atlassian.net`
- DOC-3706 confirmed fetchable via REST API v3
- Description is returned as ADF (Atlassian Document Format) — backend must extract text nodes recursively
- Auth: HTTP Basic `base64(email:token)` in Authorization header

## GROQ API
- Key env var: `GORQ_KEY` (note: typo in .env — GORQ not GROQ; preserve as-is)
- User specified model: "openai/gpt-oss-120b" — NOT a valid GROQ model name
- **Decision**: Default to `llama-3.3-70b-versatile` (free, GROQ-hosted Llama 3.3 70B). User can override in Settings UI.
- GROQ SDK: `groq-sdk` npm package

## Architecture Decisions
- Backend-for-frontend (Express) pattern: all credentials stay server-side
- Vite proxy: `/api/*` → `http://localhost:3001` during dev
- Settings stored in browser localStorage; sent with each API request body (local tool, acceptable)
- Markdown rendering: `react-markdown` + `remark-gfm` for table support
- Icons: `lucide-react`
- Styling: Tailwind CSS + custom CSS properties for theme

## .env Variables Found
| Variable   | Value   | Notes                          |
|------------|---------|--------------------------------|
| GORQ_KEY   | ""      | Empty — user must fill in      |
| JIRA_TOKEN | ""      | Empty — user must fill in      |
| JIRA_EMAIL | ""      | Empty — user must fill in      |
| JIRA_URL   | ""      | Empty — user must fill in      |
