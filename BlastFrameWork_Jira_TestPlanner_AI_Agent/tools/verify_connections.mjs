import { getConfigStatus } from '../server/env.js';
import { testJiraConnection } from '../server/jiraClient.js';
import { testGroqConnection } from '../server/groqClient.js';

const results = {
  env: getConfigStatus(),
  jira: null,
  groq: null
};

try {
  results.jira = await testJiraConnection();
} catch (error) {
  results.jira = { ok: false, error: error.message };
}

try {
  results.groq = await testGroqConnection();
} catch (error) {
  results.groq = { ok: false, error: error.message };
}

console.log(JSON.stringify(results, null, 2));
