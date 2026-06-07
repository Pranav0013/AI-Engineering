import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfigStatus } from './env.js';
import { testJiraConnection } from './jiraClient.js';
import { testGroqConnection } from './groqClient.js';
import { createTestPlan } from './testPlanCreator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const port = Number(process.env.API_PORT || process.env.PORT || 5174);

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') return sendJson(response, 204, {});

    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return sendJson(response, 200, { ok: true, service: 'blast-jira-test-planner' });
    }

    if (url.pathname === '/api/config/status' && request.method === 'GET') {
      return sendJson(response, 200, getConfigStatus());
    }

    if (url.pathname === '/api/connections/test' && request.method === 'POST') {
      const body = await readJson(request);
      const settings = body.settings || {};
      const results = {};

      try {
        results.jira = await testJiraConnection(settings);
      } catch (error) {
        results.jira = { ok: false, error: error.message };
      }

      try {
        results.groq = await testGroqConnection(settings);
      } catch (error) {
        results.groq = { ok: false, error: error.message };
      }

      return sendJson(response, 200, results);
    }

    if (url.pathname === '/api/test-plan' && request.method === 'POST') {
      const body = await readJson(request);
      try {
        const payload = await createTestPlan(body);
        return sendJson(response, 200, { ok: true, ...payload });
      } catch (error) {
        return sendJson(response, 200, { ok: false, error: error.message });
      }
    }

    return serveStaticOrApiHint(url, response);
  } catch (error) {
    return sendJson(response, 500, { ok: false, error: error.message });
  }
});

server.listen(port, () => {
  console.log(`BLAST Jira Test Planner API listening on http://127.0.0.1:${port}`);
});

function serveStaticOrApiHint(url, response) {
  if (!fs.existsSync(distDir)) {
    return sendJson(response, 404, {
      ok: false,
      message: 'API is running. Start Vite with npm run dev or build the UI with npm run build.'
    });
  }

  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(distDir, safePath);

  if (!filePath.startsWith(distDir) || !fs.existsSync(filePath)) {
    return sendFile(response, path.join(distDir, 'index.html'));
  }

  return sendFile(response, filePath);
}

function sendFile(response, filePath) {
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
  };

  response.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });

  if (statusCode === 204) return response.end();
  return response.end(JSON.stringify(payload, null, 2));
}
