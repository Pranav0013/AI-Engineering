import { getConfigStatus } from '../server/env.js';
import { testJiraConnection } from '../server/jiraClient.js';
import { testGroqConnection } from '../server/groqClient.js';
import { createTestPlan } from '../server/testPlanCreator.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, service: 'blast-jira-test-planner' });
    }

    if (url.pathname === '/api/config/status' && req.method === 'GET') {
      return sendJson(res, 200, getConfigStatus());
    }

    if (url.pathname === '/api/connections/test' && req.method === 'POST') {
      const body = await readJson(req);
      const settings = body.settings || {};
      const results = {};

      try {
        results.jira = await testJiraConnection(settings);
      } catch (e) {
        results.jira = { ok: false, error: e.message };
      }

      try {
        results.groq = await testGroqConnection(settings);
      } catch (e) {
        results.groq = { ok: false, error: e.message };
      }

      return sendJson(res, 200, results);
    }

    if (url.pathname === '/api/test-plan' && req.method === 'POST') {
      const body = await readJson(req);
      try {
        const payload = await createTestPlan(body);
        return sendJson(res, 200, { ok: true, ...payload });
      } catch (e) {
        return sendJson(res, 200, { ok: false, error: e.message });
      }
    }

    return sendJson(res, 404, { ok: false, message: 'API route not found' });
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: e.message });
  }
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}
