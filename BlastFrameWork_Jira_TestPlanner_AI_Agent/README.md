# BLAST Jira Test Plan Generator

Lightweight local React application for fetching a Jira issue and generating a QA-ready test plan.

## Run

For the React localhost dev app, use two terminals.

Terminal 1:

```bash
npm run api
```

Terminal 2:

```bash
npm run react
```

Open:

```text
http://localhost:5173
```

The React app proxies API calls to the backend on `http://127.0.0.1:5174`.

## Built App

```bash
npm install
npm run build
npm run api
```

Open:

```text
http://127.0.0.1:5174
```

## Environment

Create or update `.env` with:

```text
GROQ_KEY="..."
JIRA_EMAIL="..."
JIRA_TOKEN="..."
JIRA_BASE_URL="https://your-domain.atlassian.net"
```

The UI can also accept per-request overrides. Overrides are sent to the local backend only and are not persisted.

## Verification

```bash
npm run verify
```

This checks `.env`, Jira `/rest/api/3/myself`, and Groq `/openai/v1/models`.
