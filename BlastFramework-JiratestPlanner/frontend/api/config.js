export default function handler(req, res) {
  res.json({
    jiraEmail: process.env.JIRA_EMAIL || '',
    jiraBaseUrl: process.env.JIRA_URL || '',
    hasJiraToken: Boolean(process.env.JIRA_TOKEN),
    hasGroqKey: Boolean(process.env.GORQ_KEY),
  });
}
