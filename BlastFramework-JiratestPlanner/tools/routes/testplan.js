const express = require('express');
const Groq = require('groq-sdk');
const router = express.Router();

const SYSTEM_PROMPT = `You are a Senior QA Engineer with 10+ years of experience writing formal test plan documents following IEEE 829 standards. You write comprehensive, professional, and thorough test plans that cover all testing dimensions. You are meticulous and cover every edge case, boundary condition, and negative scenario.`;

function buildUserPrompt(issue) {
  return `Write a complete, formal QA Test Plan document in Markdown format for the following Jira issue.

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

Generate a professional, IEEE 829-inspired Test Plan with EXACTLY these 10 sections:

1. **Test Plan Identifier** — A metadata table with: Test Plan ID (TP-${issue.key}), Jira Issue (${issue.key}), Issue Type, Priority, Status, Project, Assignee, Reporter, Date Created (${new Date().toISOString().split('T')[0]}), Version (1.0)

2. **Introduction & Objective** — Background on the feature/defect. If it is a bug, clearly state the observed vs expected behaviour. Include a clear statement of testing objectives (2-3 bullet points).

3. **Scope** — Separate "In-Scope" and "Out-of-Scope" sections. Use bullet points. Be specific about what is being tested and what is excluded.

4. **Test Strategy** — Must include a minimum of 8 numbered Test Areas. Each area must have:
   - A bold title
   - A description paragraph of what is being tested and why
   - A bulleted list of specific scenarios/conditions to validate

   Test Areas MUST cover: (1) the core defect/feature path, (2) happy path scenarios, (3) negative testing, (4) edge cases, (5) boundary value analysis, (6) regression testing of surrounding functionality, (7) UI/UX and visual state verification, (8) cross-browser / cross-environment (if relevant).

5. **Entry Criteria** — A checkbox list (- [ ]) of all conditions that MUST be true before testing begins. Minimum 5 criteria.

6. **Exit Criteria** — A checkbox list of pass/fail thresholds AND a separate "Suspension Criteria" subsection describing when testing should be paused.

7. **Test Environment & Prerequisites** — Include: an environment details table, a browser compatibility matrix with Priority (P1/P2), test data requirements, and a tools list.

8. **Risks & Mitigations** — A Markdown table with columns: Risk | Likelihood | Impact | Mitigation Strategy. Include minimum 5 risks. Use Low/Medium/High for Likelihood and Impact.

9. **Assumptions & Dependencies** — Numbered list of assumptions (what you assume to be true) and a separate numbered list of dependencies (what must be in place).

10. **Sign-off** — A table with columns: Role | Name | Sign-off Date | Signature. Include rows for: QA Engineer, Developer, Reporter, Product Owner. Leave Date and Signature blank.

End the document with this exact footer line:
*Test Plan Version 1.0 — Generated from Jira ${issue.key} — ${issue.project}*

IMPORTANT:
- Output ONLY the Markdown document. No preamble, no explanation, no meta-commentary.
- Be thorough, detailed, and professional.
- Cover ALL testing paths: happy path, edge cases, negative tests, boundary conditions.
- The document must be detailed enough for any QA engineer to understand the full testing scope without additional context.`;
}

router.post('/generate', async (req, res) => {
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
        { role: 'user', content: buildUserPrompt(issue) },
      ],
      max_tokens: 4096,
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
    return res.status(500).json({ error: `GROQ generation failed: ${err.message}` });
  }
});

module.exports = router;
