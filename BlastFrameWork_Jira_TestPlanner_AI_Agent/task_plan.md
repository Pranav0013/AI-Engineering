# Task Plan

## Phase 0: Initialization

- [x] Create project memory files.
- [x] Create initial project constitution.
- [x] Capture discovery answers.
- [x] Define and confirm data schema in `LLM.md`.
- [x] Approve implementation blueprint.

## Phase 1: Blueprint

### Goal

Build a Jira-based Test Plan Generator that can fetch a Jira issue such as `DOC-3706` and produce a useful test plan.

### Discovery Checklist

- [x] North Star confirmed.
- [x] Integrations confirmed.
- [x] Source of truth confirmed.
- [x] Delivery payload confirmed.
- [x] Behavioral rules confirmed.

### Blueprint Status

Status: Approved by user request on 2026-06-07.

### Approved Blueprint

Build a lightweight local React application backed by a small Node API.

- Frontend accepts Jira/Groq settings and a Jira issue ID.
- Backend reads `.env` values and accepts per-request setting overrides from the UI.
- Jira connection fetches issue data from Jira Cloud REST API v3.
- Test plan creator uses Groq Chat Completions when a key is available.
- Deterministic fallback test plan generation is available if Groq is not configured or unavailable.
- Results are delivered in the UI as structured sections, JSON, and downloadable Markdown.
- Credentials are never returned to the browser once submitted.

## Phase 2: Link

- [x] Create minimal connection verification tool in `tools/`.
- [x] Verify `.env` loading.
- [ ] Verify Jira connection.
- [ ] Verify Groq connection.

## Phase 3: Architect

- [x] Create `architecture/` SOP.
- [x] Create Jira client module.
- [x] Create Groq client module.
- [x] Create test plan creator module.
- [x] Create local API server.

## Phase 4: Stylize

- [x] Create lightweight React UI.
- [x] Add settings, generation workflow, loading/error states.
- [x] Add polished test-plan result display.
- [x] Add Markdown/JSON export.

## Phase 5: Trigger

- [x] Add run instructions.
- [x] Add maintenance log updates.
- [x] Run local verification where possible.

## Final Verification

- [x] `npm install`
- [x] `npm run build`
- [x] `node tools/verify_connections.mjs`
- [x] Local UI smoke test through Playwright
- [x] Missing-config error state verified

## Remaining External Gate

Jira and Groq live connection verification are pending non-empty credential values in `.env` or UI settings.

## Implementation Gate

No scripts or tooling should be written until:

- Discovery questions are answered.
- Input and output JSON schemas are defined in `LLM.md`.
- The blueprint in this file is approved.

Gate status: Satisfied on 2026-06-07.
