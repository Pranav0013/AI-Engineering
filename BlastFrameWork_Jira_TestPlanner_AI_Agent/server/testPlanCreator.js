import { fetchJiraIssue } from './jiraClient.js';
import { generatePlanWithGroq } from './groqClient.js';

const DEFAULT_OPTIONS = {
  testTypes: ['functional', 'negative', 'edge', 'regression', 'api', 'ui'],
  audience: 'QA engineers',
  includeEdgeCases: true,
  includeAutomationCandidates: true,
  strictTraceability: true
};

export async function createTestPlan({ issueId, settings = {}, generationOptions = {} }) {
  const options = { ...DEFAULT_OPTIONS, ...generationOptions };
  const jiraIssue = await fetchJiraIssue(issueId, settings);

  let generated;
  let generationMode = 'groq';
  let generationWarning = '';

  try {
    generated = await generatePlanWithGroq(jiraIssue, options, settings);
  } catch (error) {
    generationMode = 'native-fallback';
    generationWarning = error.message;
    generated = createNativePlan(jiraIssue, options);
  }

  const payload = normalizePlan(jiraIssue, generated, generationMode, generationWarning);
  payload.markdown = toMarkdown(payload);

  return payload;
}

function normalizePlan(jiraIssue, generated, generationMode, generationWarning) {
  const plan = generated.test_plan || generated.testPlan || generated;

  return {
    jira_issue_id: jiraIssue.key,
    generated_at: new Date().toISOString(),
    generation_mode: generationMode,
    generation_warning: generationWarning,
    source: {
      title: jiraIssue.title,
      status: jiraIssue.status,
      issue_type: jiraIssue.issueType,
      priority: jiraIssue.priority,
      project: jiraIssue.project,
      labels: jiraIssue.labels,
      components: jiraIssue.components,
      versions: jiraIssue.versions,
      comments_used: jiraIssue.comments.length
    },
    assumptions: asArray(generated.assumptions),
    test_plan: {
      objective: plan.objective || `Validate ${jiraIssue.key}: ${jiraIssue.title}`,
      scope: asArray(plan.scope),
      out_of_scope: asArray(plan.out_of_scope),
      entry_criteria: asArray(plan.entry_criteria),
      exit_criteria: asArray(plan.exit_criteria),
      risks: asArray(plan.risks),
      test_scenarios: asArray(plan.test_scenarios),
      test_cases: asArray(plan.test_cases),
      automation_candidates: asArray(plan.automation_candidates),
      traceability_matrix: asArray(plan.traceability_matrix)
    },
    delivery: {
      format: 'ui-json-markdown',
      destination: 'local-react-app'
    }
  };
}

function createNativePlan(jiraIssue, options) {
  const requirementSources = [
    jiraIssue.description,
    ...jiraIssue.requirementFields.map((field) => `${field.name}: ${field.value}`),
    ...jiraIssue.comments.slice(-3).map((comment) => `Comment by ${comment.author}: ${comment.body}`)
  ].filter(Boolean);

  const assumptions = [];
  if (!jiraIssue.description || jiraIssue.description === 'Unknown') {
    assumptions.push('The Jira issue does not include a usable description.');
  }
  if (jiraIssue.requirementFields.length === 0) {
    assumptions.push('No explicit acceptance criteria field was detected.');
  }
  assumptions.push('Test data, environments, and exact system integrations should be confirmed with the delivery team.');

  const scenarios = [
    {
      id: 'TS-001',
      title: 'Happy path requirement validation',
      coverage: 'Validates the main behavior described by the Jira issue.',
      priority: 'High'
    },
    {
      id: 'TS-002',
      title: 'Validation and negative behavior',
      coverage: 'Covers invalid input, missing data, permissions, and failure handling.',
      priority: 'High'
    },
    {
      id: 'TS-003',
      title: 'Edge and boundary coverage',
      coverage: 'Covers limits, empty states, repeated actions, and unusual but plausible states.',
      priority: options.includeEdgeCases ? 'Medium' : 'Low'
    },
    {
      id: 'TS-004',
      title: 'Regression and integration coverage',
      coverage: 'Protects related flows, linked issues, and existing behavior from regression.',
      priority: 'Medium'
    }
  ];

  return {
    assumptions,
    test_plan: {
      objective: `Validate Jira issue ${jiraIssue.key}: ${jiraIssue.title}`,
      scope: [
        `Issue ${jiraIssue.key} requirements and acceptance behavior`,
        'Functional behavior visible from Jira description, comments, labels, components, and versions',
        'Negative, edge, regression, and automation-oriented coverage'
      ],
      out_of_scope: [
        'Requirements not present in Jira or linked source material',
        'Performance, security, and accessibility certification unless explicitly required'
      ],
      entry_criteria: [
        'Jira issue details are available and reviewed',
        'Target test environment is available',
        'Required test data and user permissions are identified'
      ],
      exit_criteria: [
        'High-priority test cases pass',
        'Blocking defects are resolved or accepted',
        'Traceability from Jira requirement to executed test cases is complete'
      ],
      risks: [
        'Acceptance criteria may be incomplete or implicit',
        'Linked dependencies may alter expected behavior',
        'Custom Jira fields may contain additional requirements not recognized by field name'
      ],
      test_scenarios: scenarios,
      test_cases: createNativeTestCases(jiraIssue, requirementSources),
      automation_candidates: [
        'Happy path validation for the primary flow',
        'Negative validation for required fields and permission errors',
        'Regression checks for linked components and impacted versions'
      ],
      traceability_matrix: scenarios.map((scenario) => ({
        requirement: scenario.coverage,
        source: jiraIssue.key,
        test_case_ids: [`TC-${scenario.id.slice(-3)}`]
      }))
    }
  };
}

function createNativeTestCases(jiraIssue, requirementSources) {
  const traceability = [jiraIssue.key];
  const context = requirementSources[0]?.slice(0, 280) || jiraIssue.title;

  return [
    {
      id: 'TC-001',
      scenario_id: 'TS-001',
      title: 'Validate primary user outcome',
      type: 'functional',
      priority: 'High',
      preconditions: ['User has the required role and access', 'Target environment is available'],
      steps: [
        `Open or execute the flow related to ${jiraIssue.key}`,
        'Provide valid inputs based on the Jira requirement',
        'Complete the primary action',
        'Review the resulting UI, API response, data state, or Jira-described output'
      ],
      expected_result: `The system satisfies the expected behavior for: ${context}`,
      test_data: ['Valid user account', 'Valid request or form data'],
      traceability
    },
    {
      id: 'TC-002',
      scenario_id: 'TS-002',
      title: 'Reject invalid or incomplete input',
      type: 'negative',
      priority: 'High',
      preconditions: ['User has access to the target flow'],
      steps: [
        'Start the target flow',
        'Submit missing, malformed, or unauthorized data',
        'Observe validation, errors, and persisted state'
      ],
      expected_result: 'The system blocks invalid behavior and shows clear, non-destructive feedback.',
      test_data: ['Blank required fields', 'Malformed values', 'Unauthorized user or token'],
      traceability
    },
    {
      id: 'TC-003',
      scenario_id: 'TS-003',
      title: 'Handle boundary and repeated-use conditions',
      type: 'edge',
      priority: 'Medium',
      preconditions: ['Boundary data is available'],
      steps: [
        'Exercise the flow with minimum, maximum, empty, and duplicate values',
        'Repeat the primary action where applicable',
        'Verify final system state remains consistent'
      ],
      expected_result: 'Boundary states are handled without data loss, duplicate side effects, or unclear errors.',
      test_data: ['Minimum values', 'Maximum values', 'Duplicate submissions'],
      traceability
    },
    {
      id: 'TC-004',
      scenario_id: 'TS-004',
      title: 'Validate impacted regression paths',
      type: 'regression',
      priority: 'Medium',
      preconditions: ['Existing related flows are available'],
      steps: [
        'Identify related components, labels, linked issues, or versions',
        'Run smoke checks across impacted flows',
        'Confirm existing behavior still works after the change'
      ],
      expected_result: 'No related core workflow regresses because of the Jira change.',
      test_data: jiraIssue.components.length ? jiraIssue.components : ['Related component data'],
      traceability
    }
  ];
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function toMarkdown(payload) {
  const plan = payload.test_plan;
  const lines = [
    `# Test Plan: ${payload.jira_issue_id}`,
    '',
    `Generated: ${payload.generated_at}`,
    `Mode: ${payload.generation_mode}`,
    '',
    '## Source',
    '',
    `- Title: ${payload.source.title}`,
    `- Status: ${payload.source.status}`,
    `- Type: ${payload.source.issue_type}`,
    `- Priority: ${payload.source.priority}`,
    `- Project: ${payload.source.project}`,
    '',
    '## Objective',
    '',
    plan.objective,
    '',
    section('Assumptions', payload.assumptions),
    section('Scope', plan.scope),
    section('Out Of Scope', plan.out_of_scope),
    section('Entry Criteria', plan.entry_criteria),
    section('Exit Criteria', plan.exit_criteria),
    section('Risks', plan.risks),
    '## Test Scenarios',
    '',
    ...plan.test_scenarios.map(
      (scenario) => `- ${scenario.id || ''} ${scenario.title || scenario}. ${scenario.coverage || ''}`
    ),
    '',
    '## Test Cases',
    '',
    ...plan.test_cases.flatMap((testCase) => [
      `### ${testCase.id || ''} ${testCase.title || 'Test Case'}`,
      '',
      `- Type: ${testCase.type || 'Unknown'}`,
      `- Priority: ${testCase.priority || 'Medium'}`,
      `- Scenario: ${testCase.scenario_id || 'Unknown'}`,
      `- Preconditions: ${asArray(testCase.preconditions).join('; ') || 'None specified'}`,
      `- Steps: ${asArray(testCase.steps).join('; ') || 'None specified'}`,
      `- Expected Result: ${testCase.expected_result || 'Expected result not specified'}`,
      `- Test Data: ${asArray(testCase.test_data).join('; ') || 'None specified'}`,
      `- Traceability: ${asArray(testCase.traceability).join(', ') || payload.jira_issue_id}`,
      ''
    ]),
    section('Automation Candidates', plan.automation_candidates)
  ];

  if (payload.generation_warning) {
    lines.push('## Generation Warning', '', payload.generation_warning, '');
  }

  return lines.join('\n');
}

function section(title, items) {
  const values = asArray(items);
  if (!values.length) return '';
  return [`## ${title}`, '', ...values.map((item) => `- ${item}`), ''].join('\n');
}
