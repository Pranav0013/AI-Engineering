# Findings

## Objective

Fetch the Jira ID and create a Test Plan Generator.

Initial target issue:

- `DOC-3706` -> Fetch Test Plan

## Current Constraints

- Discovery answers were inferred from the user's implementation request on 2026-06-07.
- `.env` contains `GROQ_KEY`, `JIRA_EMAIL`, `JIRA_TOKEN`, and `JIRA_BASE_URL`, but current values are effectively empty.
- Secrets must stay server-side and must not be displayed in the UI or logs.
- Delivery should be a lightweight React UI with downloadable Markdown/JSON results.
- The first issue target is `DOC-3706`.

## Research Notes

- Atlassian Jira Cloud REST API v3 is the current Jira Cloud REST surface. Basic-auth style ad-hoc calls use `https://<site-url>/rest/api/3/<resource-name>`, including issue fetches such as `/rest/api/3/issue/DEMO-1`.
- Jira API v3 returns rich Atlassian Document Format content for issue description and other multiline fields, so the tool needs an ADF-to-text normalizer.
- Groq provides OpenAI-compatible Chat Completions at `https://api.groq.com/openai/v1/chat/completions`.
- Groq text generation supports structured data generation with system/user messages, which fits the test-plan JSON output requirement.

## Discovery Answers

- North Star: Given a Jira issue ID, fetch Jira details and generate a QA-ready test plan automatically.
- Integrations: Jira Cloud REST API and Groq Chat Completions. Credentials are supplied through `.env` and can be overridden in UI settings.
- Source of Truth: Jira issue fields, description, comments, labels, components, versions, linked issue metadata, and user-provided generation options.
- Delivery Payload: React UI, structured JSON response, and downloadable Markdown test plan.
- Behavioral Rules: Do not invent Jira facts; separate assumptions; include positive, negative, edge, regression, API/UI, risk, and traceability coverage where relevant.

## Verification Findings

- `npm install` completed successfully after network approval.
- `npm run build` completed successfully.
- `node tools/verify_connections.mjs` loads the expected env keys but cannot verify Jira or Groq because the values are empty.
- Local UI loads successfully at `http://127.0.0.1:5174` during final verification.
- Missing Jira settings produce an in-app validation error without exposing secret values.
- If React receives `<!doctype html>` for `/api/test-plan`, the backend API is not running or the React proxy is pointing at the wrong port.
- Jira base URL should be the site root, for example `https://docmx.atlassian.net`; `/browse/` is now normalized away by the backend.
