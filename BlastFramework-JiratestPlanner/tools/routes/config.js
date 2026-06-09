const express = require('express');
const router = express.Router();

// Returns which env vars are populated (values masked for security)
router.get('/', (req, res) => {
  res.json({
    jiraEmail: process.env.JIRA_EMAIL || '',
    jiraBaseUrl: process.env.JIRA_URL || '',
    hasJiraToken: Boolean(process.env.JIRA_TOKEN),
    hasGroqKey: Boolean(process.env.GORQ_KEY),
  });
});

module.exports = router;
