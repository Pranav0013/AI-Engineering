import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export function loadEnv(filePath = path.join(process.cwd(), '.env')) {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

export function resolveSettings(overrides = {}) {
  const env = loadEnv();

  return {
    jiraBaseUrl:
      overrides.jiraBaseUrl ||
      overrides.jira_base_url ||
      env.JIRA_BASE_URL ||
      process.env.JIRA_BASE_URL ||
      '',
    jiraEmail:
      overrides.jiraEmail ||
      overrides.jira_email ||
      env.JIRA_EMAIL ||
      process.env.JIRA_EMAIL ||
      '',
    jiraToken:
      overrides.jiraToken ||
      overrides.jira_token ||
      env.JIRA_TOKEN ||
      process.env.JIRA_TOKEN ||
      '',
    groqKey:
      overrides.groqKey ||
      overrides.groq_key ||
      env.GROQ_KEY ||
      env.GROQ_API_KEY ||
      process.env.GROQ_KEY ||
      process.env.GROQ_API_KEY ||
      '',
    groqModel:
      overrides.groqModel ||
      overrides.groq_model ||
      env.GROQ_MODEL ||
      process.env.GROQ_MODEL ||
      DEFAULT_MODEL
  };
}

export function getConfigStatus(overrides = {}) {
  const settings = resolveSettings(overrides);

  return {
    jiraBaseUrlConfigured: Boolean(settings.jiraBaseUrl),
    jiraEmailConfigured: Boolean(settings.jiraEmail),
    jiraTokenConfigured: Boolean(settings.jiraToken),
    groqKeyConfigured: Boolean(settings.groqKey),
    groqModel: settings.groqModel,
    jiraBaseUrlHost: settings.jiraBaseUrl ? safeHost(settings.jiraBaseUrl) : ''
  };
}

function safeHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return 'invalid-url';
  }
}
