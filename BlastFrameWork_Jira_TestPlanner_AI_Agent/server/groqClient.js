import { resolveSettings } from './env.js';

export async function testGroqConnection(overrides = {}) {
  const settings = resolveSettings(overrides);
  if (!settings.groqKey) throw new Error('Groq key is required.');

  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: {
      Authorization: `Bearer ${settings.groqKey}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq request failed with ${response.status}: ${body.slice(0, 250)}`);
  }

  const payload = await response.json();
  return {
    ok: true,
    modelCount: Array.isArray(payload.data) ? payload.data.length : 0,
    configuredModel: settings.groqModel
  };
}

export async function generatePlanWithGroq(jiraIssue, options = {}, overrides = {}) {
  const settings = resolveSettings(overrides);
  if (!settings.groqKey) throw new Error('Groq key is not configured.');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.groqKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.groqModel,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a senior QA test architect. Return only valid JSON matching the requested schema. Never invent Jira facts. Put uncertainty in assumptions.'
        },
        {
          role: 'user',
          content: buildPrompt(jiraIssue, options)
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq generation failed with ${response.status}: ${body.slice(0, 350)}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content || '';
  return parseGroqJson(content);
}

function buildPrompt(jiraIssue, options) {
  return JSON.stringify(
    {
      instruction:
        'Create a production-quality test plan from this Jira issue. Include functional, negative, edge, regression, API, UI, risk, traceability, and automation coverage when relevant.',
      output_schema: {
        assumptions: ['string'],
        test_plan: {
          objective: 'string',
          scope: ['string'],
          out_of_scope: ['string'],
          entry_criteria: ['string'],
          exit_criteria: ['string'],
          risks: ['string'],
          test_scenarios: [
            {
              id: 'TS-001',
              title: 'string',
              coverage: 'string',
              priority: 'High|Medium|Low'
            }
          ],
          test_cases: [
            {
              id: 'TC-001',
              scenario_id: 'TS-001',
              title: 'string',
              type: 'functional|negative|edge|regression|api|ui',
              priority: 'High|Medium|Low',
              preconditions: ['string'],
              steps: ['string'],
              expected_result: 'string',
              test_data: ['string'],
              traceability: [jiraIssue.key]
            }
          ],
          automation_candidates: ['string'],
          traceability_matrix: [
            {
              requirement: 'string',
              source: jiraIssue.key,
              test_case_ids: ['TC-001']
            }
          ]
        }
      },
      generation_options: options,
      jira_issue: jiraIssue
    },
    null,
    2
  );
}

function parseGroqJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Groq response did not contain JSON.');
    return JSON.parse(match[0]);
  }
}
