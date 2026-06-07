# Project Constitution

## Purpose

Create a Jira Test Plan Generator that fetches Jira issue data and produces a structured test plan.

## Data Schemas

Status: Confirmed by user request on 2026-06-07.

### Input Shape

```json
{
  "jira_issue_id": "DOC-3706",
  "settings": {
    "jira_base_url": "",
    "jira_email": "",
    "jira_token": "",
    "groq_key": "",
    "groq_model": "llama-3.3-70b-versatile"
  },
  "generation_options": {
    "test_types": ["functional", "negative", "edge", "regression", "api", "ui"],
    "audience": "QA engineers",
    "include_edge_cases": true,
    "include_automation_candidates": true,
    "strict_traceability": true
  }
}
```

### Output Shape

```json
{
  "jira_issue_id": "DOC-3706",
  "generated_at": "2026-06-07T00:00:00.000Z",
  "source": {
    "title": "",
    "status": "",
    "issue_type": "",
    "priority": "",
    "project": "",
    "labels": [],
    "components": [],
    "versions": [],
    "comments_used": 0
  },
  "assumptions": [],
  "test_plan": {
    "objective": "",
    "scope": [],
    "out_of_scope": [],
    "entry_criteria": [],
    "exit_criteria": [],
    "risks": [],
    "test_scenarios": [
      {
        "id": "TS-001",
        "title": "",
        "coverage": "",
        "priority": "High"
      }
    ],
    "test_cases": [
      {
        "id": "TC-001",
        "scenario_id": "TS-001",
        "title": "",
        "type": "functional",
        "priority": "High",
        "preconditions": [],
        "steps": [],
        "expected_result": "",
        "test_data": [],
        "traceability": ["DOC-3706"]
      }
    ],
    "automation_candidates": [],
    "traceability_matrix": []
  },
  "delivery": {
    "format": "ui-json-markdown",
    "destination": "local-react-app"
  }
}
```

## Behavioral Rules

Status: Confirmed.

- Do not invent Jira details that were not fetched or provided.
- Mark missing Jira fields as unknown.
- Separate assumptions from verified Jira facts.
- Preserve traceability back to the Jira issue ID.
- Keep secrets server-side and avoid logging credentials.
- Prefer Groq-generated structured output when available; otherwise use deterministic native test-plan generation.
- Generated test plans should include positive, negative, edge, regression, and automation perspectives when relevant.

## Architectural Invariants

Status: Confirmed.

- Jira issue data is the primary source for generated test plans unless the user provides additional documents.
- Input/output schemas must be confirmed before implementation.
- Implementation must not begin until the blueprint is approved.
- UI settings may override `.env` for a request, but the app does not persist secrets.
- Business logic lives in deterministic server modules; the UI only displays and submits payloads.

## Maintenance Log

- 2026-06-07: Initialized constitution, confirmed schema, and approved local React + Node implementation blueprint.
- 2026-06-07: Implemented Jira client, Groq client, native fallback test-plan generator, local API, React UI, connection verifier, and run documentation.
- 2026-06-07: Build and UI smoke tests passed. Live Jira/Groq verification remains pending because `.env` values are currently empty.
