# SOP-03 — Automation Analysis & Test Coverage

## Goal
Given a Jira issue, perform a deep test coverage and Playwright automation analysis producing
7 structured sections (11–17) as a companion to the formal test plan (sections 1–10).

## Inputs
| Field     | Source        |
|-----------|---------------|
| issue     | SOP-01 output |
| groqKey   | .env / UI     |
| groqModel | Settings UI   |

## Output Sections
| # | Section                           |
|---|-----------------------------------|
| 11 | Test Scenario Discovery           |
| 12 | Testability Assessment            |
| 13 | Test Coverage Matrix (table)      |
| 14 | Playwright Automation Assessment  |
| 15 | Playwright Automation Strategy    |
| 16 | High-Level Playwright Test Flows  |
| 17 | Automation Recommendation Summary |

## Prompt Strategy
- System: Senior QA Engineer + SDET persona with deep Playwright expertise
- Temperature: 0.3 (consistent, analytical output)
- max_tokens: 8192 (long-form structured output)
- Scenario types required: 16 categories (happy, positive, negative, boundary,
  validation, error-handling, permissions, data integrity, UI/UX, integration,
  API, cross-browser, accessibility, performance, security, regression)

## API Call
```
POST /api/testplan/analyze
Body: { issue, groqKey, groqModel }
Response: { issueKey, markdown, generatedAt, model }
```

## Frontend
- Rendered in Tab 2 of TestPlanViewer ("Automation Analysis")
- Loaded as Step 3 of the pipeline (after test plan is shown)
- Same copy/download controls as Tab 1
- Download filename: automation_analysis_{issueKey}.md
