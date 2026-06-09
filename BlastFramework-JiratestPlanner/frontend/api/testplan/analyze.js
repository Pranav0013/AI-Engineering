import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are a Senior QA Engineer and SDET with 10+ years of experience in software testing, test automation, and end-to-end automation using Playwright. You specialise in deep test coverage analysis, identifying automation opportunities, and designing scalable Playwright test architectures. You are thorough, analytical, and structure your outputs for maximum utility to QA engineers and automation engineers.`;

function buildAnalysisPrompt(issue) {
  return `Perform a comprehensive Test Coverage & Playwright Automation Analysis for the following Jira issue.

ISSUE DETAILS:
- Key: ${issue.key}
- Summary: ${issue.summary}
- Issue Type: ${issue.issueType}
- Priority: ${issue.priority}
- Status: ${issue.status}
- Labels: ${issue.labels.length ? issue.labels.join(', ') : 'None'}
- Components: ${issue.components.length ? issue.components.join(', ') : 'None'}
- Reporter: ${issue.reporter}
- Assignee: ${issue.assignee}
- Project: ${issue.project}

DESCRIPTION:
${issue.description}

---

Generate a complete Test Coverage & Automation Analysis document in Markdown with EXACTLY these 7 sections (numbered 11–17 to follow the formal test plan):

---

## 11. Test Scenario Discovery

Perform a deep analysis and identify ALL possible test scenarios organised under each of the following 16 categories. For each category, list specific, meaningful scenarios relevant to THIS issue — not generic placeholders. Use bullet points.

### Happy Path Scenarios
### Positive Test Scenarios
### Negative Test Scenarios
### Boundary & Edge Case Scenarios
### Validation Scenarios
### Error-Handling Scenarios
### Permission & Role-Based Scenarios
### Data Integrity Scenarios
### UI/UX Validation Scenarios
### Integration Scenarios
### API Interaction Scenarios
### Cross-Browser Scenarios
### Accessibility Considerations
### Performance Considerations
### Security Considerations
### Regression Impact Areas

---

## 12. Testability Assessment

### How the Feature Can Be Tested
### Components and Workflows Affected
### Dependencies to Consider
### Risks to Validate
### Areas Requiring Manual Verification
### Areas Suitable for Automation

---

## 13. Test Coverage Matrix

Generate a comprehensive table with minimum 20 rows covering all relevant scenario types.

| Feature Area | Test Objective | Scenario Type | Priority | Automation Feasibility | Notes & Risks |
|---|---|---|---|---|---|

- Priority: High / Medium / Low
- Automation Feasibility: High / Medium / Low / Not Feasible
- Scenario Type: Happy Path / Positive / Negative / Boundary / Validation / Error / Permission / UI-UX / Integration / Performance / Security / Regression

---

## 14. Playwright Automation Assessment

For every unique test scenario, classify automation suitability. Include minimum 15 rows.

| Scenario | Classification | Justification |
|---|---|---|

Classification: **Fully Automatable** / **Partially Automatable** / **Manual Only**

---

## 15. Playwright Automation Strategy

### Automation Scope
### Recommended Test Architecture
### Required Page Objects / Components
### Test Data Requirements
### Mocking Requirements
### API Interception Opportunities
### Reusable Fixtures
### Environment Considerations

---

## 16. High-Level Playwright Test Flows

For each key automatable scenario, define the test flow (design only — no code). Include minimum 6 flows.

Format each as:

### Flow [N]: [Scenario Name]

| Field | Detail |
|---|---|
| **Preconditions** | |
| **User Actions** | |
| **Expected Validations** | |
| **Automation Notes** | |

---

## 17. Automation Recommendation Summary

### Coverage Summary

| Metric | Value |
|---|---|
| Estimated Automation Coverage | X% |
| Estimated Manual Coverage | X% |
| Total Scenarios Identified | N |
| Fully Automatable | N |
| Partially Automatable | N |
| Manual Only | N |

### Recommended Playwright Automation Priority
### Quick Wins for Automation
### Areas That Should Remain Manual
### Risks and Limitations of Automation

---

End with: *Automation Analysis Version 1.0 — Generated from Jira ${issue.key} — ${issue.project}*

IMPORTANT: Output ONLY the Markdown. No preamble. Be specific to THIS issue. Every table must meet the minimum row counts.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    issue,
    groqKey = process.env.GORQ_KEY,
    groqModel = 'llama-3.3-70b-versatile',
  } = req.body;

  if (!issue) return res.status(400).json({ error: 'issue object is required' });
  if (!groqKey) return res.status(400).json({ error: 'GROQ API key is not configured. Fill in Settings.' });

  try {
    const groq = new Groq({ apiKey: groqKey });
    const completion = await groq.chat.completions.create({
      model: groqModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildAnalysisPrompt(issue) },
      ],
      max_tokens: 8192,
      temperature: 0.3,
    });

    res.json({
      issueKey: issue.key,
      markdown: completion.choices[0]?.message?.content || '',
      generatedAt: new Date().toISOString(),
      model: groqModel,
    });
  } catch (err) {
    const status = err.status || err.response?.status;
    if (status === 401) return res.status(401).json({ error: 'Invalid GROQ API key.' });
    if (status === 429) return res.status(429).json({ error: 'GROQ rate limit hit — please wait and try again.' });
    return res.status(500).json({ error: `GROQ analysis failed: ${err.message}` });
  }
}
