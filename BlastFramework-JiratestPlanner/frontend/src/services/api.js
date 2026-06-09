import axios from 'axios';

export async function fetchJiraIssue(issueId, settings) {
  const { data } = await axios.post('/api/jira/issue', {
    issueId,
    jiraEmail: settings.jiraEmail,
    jiraToken: settings.jiraToken,
    jiraBaseUrl: settings.jiraBaseUrl,
  });
  return data;
}

export async function generateTestPlan(issue, settings) {
  const { data } = await axios.post('/api/testplan/generate', {
    issue,
    groqKey: settings.groqKey,
    groqModel: settings.groqModel,
  });
  return data;
}

export async function analyzeAutomation(issue, settings) {
  const { data } = await axios.post('/api/testplan/analyze', {
    issue,
    groqKey: settings.groqKey,
    groqModel: settings.groqModel,
  });
  return data;
}
