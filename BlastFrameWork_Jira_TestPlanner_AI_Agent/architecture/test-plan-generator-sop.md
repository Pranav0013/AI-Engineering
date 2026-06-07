# Test Plan Generator SOP

## Goal

Fetch a Jira issue and generate a structured, QA-ready test plan with traceability to the source issue.

## Inputs

- Jira issue ID, such as `DOC-3706`.
- Jira connection settings from `.env` or UI overrides.
- Groq connection settings from `.env` or UI overrides.
- Generation options for test type coverage and strictness.

## Tool Logic

1. Validate required connection settings.
2. Fetch Jira issue details through Jira Cloud REST API v3.
3. Normalize Jira rich text, comments, labels, components, versions, and linked issue metadata.
4. Build a deterministic issue context.
5. Ask Groq to produce structured JSON using the schema defined in `LLM.md`.
6. If Groq fails or is unavailable, generate a deterministic native test plan from Jira fields.
7. Return structured JSON and Markdown for the UI.

## Edge Cases

- Missing description: mark requirements as unknown and increase assumptions.
- Missing Groq key: use deterministic fallback.
- Invalid Jira issue: return an actionable error.
- Jira custom fields: include likely requirement fields based on field names such as acceptance criteria, scope, requirement, and story.
- Secret fields: never return Jira token or Groq key in API responses.

## Invariants

- No generated test case should claim unverified Jira facts.
- Every test case should preserve traceability to the Jira issue ID.
- UI must stay local and lightweight.
- Logic changes must be reflected here before code changes.
