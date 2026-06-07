# Gemini Notes

## 2026-06-07

- BLAST Phase 0 files are initialized.
- Discovery answers are inferred from the user's explicit app-building request.
- Schema is confirmed in `LLM.md`.
- Approved approach: lightweight React UI plus local Node API with Jira and Groq integrations.
- Credentials are loaded from `.env` and may be overridden per request through the UI.
- Secrets must never be printed, returned, or committed.
- Implemented the local app, API, Jira/Groq connectors, native fallback generator, and connection verifier.
- Build passes. UI smoke test passes.
- Live Jira/Groq verification is pending because current `.env` values are empty.
- React `Unexpected token '<'` means the UI received HTML instead of API JSON, usually because the backend is not running or the proxy port does not match.
- Backend now normalizes Jira URLs such as `https://site.atlassian.net/browse/` to `https://site.atlassian.net`.
