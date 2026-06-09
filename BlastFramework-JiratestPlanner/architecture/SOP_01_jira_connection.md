# SOP-01 — Jira Connection

## Goal
Fetch a single Jira issue by ID using the Atlassian REST API v3 and return a clean, LLM-ready plain-text object.

## Inputs
| Field       | Source              | Description                            |
|-------------|---------------------|----------------------------------------|
| issueId     | UI Input            | e.g. "DOC-3706"                        |
| jiraEmail   | .env / Settings UI  | Atlassian account email                |
| jiraToken   | .env / Settings UI  | Jira API token (from id.atlassian.com) |
| jiraBaseUrl | .env / Settings UI  | e.g. "https://company.atlassian.net"   |

## Steps

### 1. Build Auth Header
```
Authorization: Basic base64(jiraEmail + ':' + jiraToken)
```

### 2. Call Jira REST API v3
```
GET {jiraBaseUrl}/rest/api/3/issue/{issueId}
Headers:
  Authorization: Basic {base64}
  Accept: application/json
```

### 3. Extract Fields
From response.fields, extract:
- `summary`
- `description` (ADF object — must be parsed, see below)
- `issuetype.name`
- `status.name`
- `priority.name`
- `labels`
- `components[].name`
- `reporter.displayName`
- `assignee.displayName`
- `project.name`

### 4. Parse ADF Description
Jira v3 returns description as Atlassian Document Format (ADF) JSON.
Recursively walk the node tree and extract text:
```javascript
function extractTextFromADF(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.content) return node.content.map(extractTextFromADF).join(' ');
  return '';
}
```

## Output
```json
{
  "key": "DOC-3706",
  "summary": "...",
  "description": "plain text string",
  "issueType": "Task",
  "status": "Testing",
  "priority": "Medium",
  "labels": ["NextRelease"],
  "components": [],
  "reporter": "Sai Krishna",
  "assignee": "Pranav",
  "project": "DocMX Development"
}
```

## Error Handling
| Error              | Response                                              |
|--------------------|-------------------------------------------------------|
| 401 Unauthorized   | Return 401 with "Invalid Jira credentials"            |
| 404 Not Found      | Return 404 with "Issue {id} not found"                |
| Network error      | Return 503 with "Cannot reach Jira: {message}"        |
| Missing fields     | Gracefully default to empty string / empty array      |
