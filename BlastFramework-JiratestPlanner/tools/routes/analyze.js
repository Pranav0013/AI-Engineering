const express = require('express');
const Groq = require('groq-sdk');
const router = express.Router();

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
(The primary success flow — everything works as intended)

### Positive Test Scenarios
(Valid inputs and conditions that should succeed, beyond just the main flow)

### Negative Test Scenarios
(Invalid inputs, incorrect sequences, or conditions that should fail or be blocked)

### Boundary & Edge Case Scenarios
(Values at the exact limit of valid/invalid ranges, extreme conditions)

### Validation Scenarios
(Input field validation, format enforcement, required fields, character limits)

### Error-Handling Scenarios
(How the system behaves when errors occur — network failures, API errors, timeouts)

### Permission & Role-Based Scenarios
(Different user roles or permission levels and what they can/cannot do)

### Data Integrity Scenarios
(Ensuring data is saved, retrieved, and displayed correctly)

### UI/UX Validation Scenarios
(Visual state, layout, accessibility of UI elements after interactions)

### Integration Scenarios
(Interactions between this feature and other parts of the system)

### API Interaction Scenarios
(If the feature triggers API calls — request payloads, responses, error states)

### Cross-Browser Scenarios
(Behaviour differences across Chrome, Firefox, Safari, Edge)

### Accessibility Considerations
(Keyboard navigation, screen reader compatibility, ARIA attributes, focus management)

### Performance Considerations
(Load time, response time, behaviour under slow network or large data sets)

### Security Considerations
(Input sanitisation, XSS, data leakage, unauthorised access attempts)

### Regression Impact Areas
(Existing features or flows that this change could inadvertently break)

---

## 12. Testability Assessment

### How the Feature Can Be Tested
(Paragraph explaining the overall testing approach for this specific issue)

### Components and Workflows Affected
(Bulleted list of UI components, API endpoints, and data flows involved)

### Dependencies to Consider
(External dependencies, third-party integrations, state that must exist before testing)

### Risks to Validate
(Key risks that testing must de-risk — be specific to this issue)

### Areas Requiring Manual Verification
(Bulleted list of scenarios that cannot be reliably automated and why)

### Areas Suitable for Automation
(Bulleted list of scenarios that are strong automation candidates and why)

---

## 13. Test Coverage Matrix

Generate a comprehensive table. Each row = one meaningful test scenario.

| Feature Area | Test Objective | Scenario Type | Priority | Automation Feasibility | Notes & Risks |
|---|---|---|---|---|---|

- Feature Area: component or part of the feature being tested
- Test Objective: what the test is trying to prove
- Scenario Type: Happy Path / Positive / Negative / Boundary / Validation / Error / Permission / UI-UX / Integration / Performance / Security / Regression
- Priority: High / Medium / Low
- Automation Feasibility: High / Medium / Low / Not Feasible
- Notes & Risks: any caveats, dependencies, or risks

Include at minimum 20 rows covering all relevant scenario types.

---

## 14. Playwright Automation Assessment

For every unique test scenario identified, classify its automation suitability.

| Scenario | Classification | Justification |
|---|---|---|

Classification must be one of:
- **Fully Automatable** — can be completely covered by Playwright
- **Partially Automatable** — some aspects can be automated; some require manual steps
- **Manual Only** — not suitable for automation (explain why)

Include at minimum 15 scenario rows.

---

## 15. Playwright Automation Strategy

If automation is recommended, provide the following:

### Automation Scope
(What is and is not included in the automated suite for this issue)

### Recommended Test Architecture
(e.g. Page Object Model, fixtures pattern, describe/test structure)

### Required Page Objects / Components
(List each page object/component needed with a brief description of what it encapsulates)

### Test Data Requirements
(What test data must exist, how it should be seeded, edge case data needed)

### Mocking Requirements
(What API calls or modules should be mocked using Playwright's route interception)

### API Interception Opportunities
(Specific endpoints to intercept — e.g. to simulate errors, delay responses, or validate request payloads)

### Reusable Fixtures
(List recommended Playwright fixtures: auth, data setup, page wrappers)

### Environment Considerations
(Env variables needed, base URL config, browser configuration, parallel execution notes)

---

## 16. High-Level Playwright Test Flows

For each key automatable scenario, define the test flow design. Do NOT write code — describe the design.

Format each flow as:

### Flow [N]: [Scenario Name]

| Field | Detail |
|---|---|
| **Preconditions** | What must be true before the test runs |
| **User Actions** | Numbered list of steps the test performs |
| **Expected Validations** | What assertions are made and why |
| **Automation Notes** | Selectors, wait strategies, known risks |

Include at minimum 6 flows covering the highest-priority automatable scenarios.

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
(Ordered list: P1 scenarios first — most value, least risk)

### Quick Wins for Automation
(Scenarios that are easy to automate and provide immediate regression value)

### Areas That Should Remain Manual
(Specific scenarios that should not be automated, with clear reasoning)

### Risks and Limitations of Automation
(Technical, environmental, or process risks that could impact the automation suite)

---

End the document with:
*Automation Analysis Version 1.0 — Generated from Jira ${issue.key} — ${issue.project}*

IMPORTANT:
- Output ONLY the Markdown document. No preamble, no explanation, no meta-commentary.
- Be specific to THIS Jira issue — avoid generic filler content.
- Every table must have at minimum the row counts specified.
- Playwright flows must be design-focused, not code — describe intent and approach.`;
}

router.post('/analyze', async (req, res) => {
  const {
    issue,
    groqKey = process.env.GORQ_KEY,
    groqModel = 'llama-3.3-70b-versatile',
  } = req.body;

  if (!issue) return res.status(400).json({ error: 'issue object is required' });
  if (!groqKey) {
    return res.status(400).json({ error: 'GROQ API key is not configured. Fill in Settings.' });
  }

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

    const markdown = completion.choices[0]?.message?.content || '';
    res.json({
      issueKey: issue.key,
      markdown,
      generatedAt: new Date().toISOString(),
      model: groqModel,
    });
  } catch (err) {
    const status = err.status || err.response?.status;
    if (status === 401) return res.status(401).json({ error: 'Invalid GROQ API key.' });
    if (status === 400) return res.status(400).json({ error: `GROQ error: ${err.message}` });
    if (status === 429) return res.status(429).json({ error: 'GROQ rate limit hit — please wait and try again.' });
    return res.status(500).json({ error: `GROQ analysis failed: ${err.message}` });
  }
});

module.exports = router;
