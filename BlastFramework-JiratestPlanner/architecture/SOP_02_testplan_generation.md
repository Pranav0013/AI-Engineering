# SOP-02 — Test Plan Generation

## Goal
Given a clean Jira issue object, call the GROQ LLM API and produce a formal IEEE 829-inspired Test Plan in Markdown.

## Inputs
| Field     | Source         | Description                               |
|-----------|----------------|-------------------------------------------|
| issue     | SOP-01 output  | Cleaned Jira issue object                 |
| groqKey   | .env / UI      | GROQ API key (env: GORQ_KEY)              |
| groqModel | Settings UI    | Default: llama-3.3-70b-versatile          |

## Prompt Strategy

### System Prompt
```
You are a Senior QA Engineer with 10+ years of experience writing formal 
test plan documents following IEEE 829 standards. You write comprehensive, 
professional, and thorough test plans that cover all testing dimensions.
```

### User Prompt Template
Build from the clean issue object. Include:
- Issue metadata (key, type, priority, status, labels)
- Summary
- Full description
- Explicit instruction to produce 10 sections (see LLM.md Output Shape)
- Instruction to cover ALL paths: happy, edge, negative, boundary
- Instruction to output ONLY the markdown — no preamble

## GROQ API Call
```javascript
const groq = new Groq({ apiKey: groqKey });
const completion = await groq.chat.completions.create({
  model: groqModel,
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(issue) }
  ],
  max_tokens: 4096,
  temperature: 0.3
});
return completion.choices[0].message.content;
```

## Output
Raw markdown string returned to the frontend for rendering and download.

## Error Handling
| Error              | Response                                              |
|--------------------|-------------------------------------------------------|
| 401 / invalid key  | Return 401 with "Invalid GROQ API key"                |
| Model not found    | Return 400 with "Model {name} not found on GROQ"      |
| Rate limit         | Return 429 with "GROQ rate limit hit — try again"     |
| Timeout            | Return 504 with "GROQ timed out generating plan"      |
