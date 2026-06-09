# Project Constitution — Jira Test Plan Generator (React App)
**LLM.md** | Version 3.0 | Updated: 2026-06-09

---

## Status
✅ APPROVED — Full React App build authorised.

---

## Data Schemas

### Input Shape (Jira Issue)
```json
{
  "issueId": "string",
  "jiraEmail": "string",
  "jiraToken": "string",
  "jiraBaseUrl": "string (e.g. https://company.atlassian.net)",
  "groqKey": "string",
  "groqModel": "string (default: llama-3.3-70b-versatile)"
}
```

### Jira Issue Response Shape
```json
{
  "key": "DOC-3706",
  "summary": "string",
  "description": "string (extracted plain text from ADF)",
  "issueType": "string",
  "status": "string",
  "priority": "string",
  "labels": ["string"],
  "components": ["string"],
  "reporter": "string",
  "assignee": "string",
  "project": "string"
}
```

### Output Shape (Test Plan — sections 1–10)
```json
{
  "issueKey": "DOC-3706",
  "markdown": "string (full IEEE 829-style test plan in markdown)",
  "generatedAt": "ISO timestamp",
  "model": "string"
}
```

### Output Shape (Automation Analysis — sections 11–17)
```json
{
  "issueKey": "DOC-3706",
  "markdown": "string (full automation + coverage analysis in markdown)",
  "generatedAt": "ISO timestamp",
  "model": "string"
}
```

---

## Architecture (3-Layer)

### Layer 1 — architecture/
- `SOP_01_jira_connection.md` — Jira REST API v3 connection + ADF parsing
- `SOP_02_testplan_generation.md` — GROQ prompt for sections 1–10
- `SOP_03_automation_analysis.md` — GROQ prompt for sections 11–17

### Layer 2 — Navigation (React App)
- State machine: idle → fetching → generating → analyzing → done
- Two-tab viewer: Tab 1 = Test Plan, Tab 2 = Automation Analysis
- Tab 2 auto-loads after Tab 1 completes

### Layer 3 — tools/ (Express Backend)
- `tools/server.js` — Express entry point, port 3001
- `tools/routes/config.js` — GET /api/config
- `tools/routes/jira.js` — POST /api/jira/issue
- `tools/routes/testplan.js` — POST /api/testplan/generate (sections 1–10)
- `tools/routes/analyze.js` — POST /api/testplan/analyze (sections 11–17, max_tokens 8192)

---

## Behavioral Rules
1. NEVER expose API keys/tokens in any frontend bundle or output file
2. NEVER create Jira issues without explicit user confirmation
3. Credentials flow: .env → Express backend only. Never sent to browser.
4. Frontend sends settings in request body only (since this is a local tool)
5. Test plan output is formal IEEE 829 format — no individual test cases
6. Cover ALL paths: happy, edge, negative, boundary
7. GROQ model name is configurable; default is `llama-3.3-70b-versatile`
8. .env var name is `GORQ_KEY` (existing typo — do not rename)

## Architectural Invariants
- Backend port: 3001
- Frontend port: 5173 (Vite default)
- All Jira API calls are proxied through the backend (CORS protection)
- All GROQ calls are made from the backend only
- `.env` path: project root (`BlastFramework-JiratestPlanner/.env`)
- Output files: `output/` directory (pre-existing)
- Intermediate files: `.tmp/` directory
