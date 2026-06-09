# Project Constitution — Jira Test Plan Generator

## Status
✅ APPROVED — Schema locked. Ready to build.

---

## Data Schemas

### Input Shape (from Jira)
```json
{
  "issue_id": "string",          // e.g. "DOC-3706"
  "summary": "string",
  "description": "string | null",
  "acceptance_criteria": "string | null",
  "issue_type": "string",        // Story, Bug, Task, etc.
  "status": "string",
  "priority": "string",
  "labels": ["string"],
  "components": ["string"],
  "fix_versions": ["string"],
  "assignee": "string | null",
  "reporter": "string | null"
}
```

### Output Shape (Markdown Test Plan)
```json
{
  "output_file": "test_plan_DOC-3706.md",
  "sections": [
    "Test Plan Identifier",
    "Introduction & Objective",
    "Scope (In-Scope / Out-of-Scope)",
    "Test Strategy",
    "Entry Criteria",
    "Exit Criteria",
    "Test Environment & Prerequisites",
    "Risks & Mitigations",
    "Assumptions & Dependencies",
    "Sign-off"
  ]
}
```

---

## Behavioral Rules
- NEVER create Jira issues without explicit user confirmation
- NEVER expose API keys, tokens, or credentials in any output file
- Fetch ONLY the single specified Jira issue — no linked issues, no children
- Output is a formal QA test plan document — NO individual test cases listed
- Cover all paths: happy path, edge cases, negative tests, boundary conditions
- Format follows IEEE 829 / standard QA test plan structure (best-fit for formal docs)

## Architectural Invariants
- One Jira issue in → one `.md` test plan out
- All output files written to: `BlastFramework-JiratestPlanner/output/`
- No external LLM calls — plan is generated directly from issue content
