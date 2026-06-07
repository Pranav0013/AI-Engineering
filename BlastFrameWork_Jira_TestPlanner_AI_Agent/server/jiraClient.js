import { resolveSettings } from './env.js';

export async function fetchJiraIssue(issueId, overrides = {}) {
  const settings = resolveSettings(overrides);
  validateJiraSettings(settings);

  const issueKey = String(issueId || '').trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_]+-\d+$/.test(issueKey)) {
    throw new Error('Enter a valid Jira issue key, for example DOC-3706.');
  }

  const path =
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}` +
    '?expand=names,renderedFields&fields=*all';
  const rawIssue = await jiraRequest(path, settings);

  return normalizeIssue(rawIssue);
}

export async function testJiraConnection(overrides = {}) {
  const settings = resolveSettings(overrides);
  validateJiraSettings(settings);
  const account = await jiraRequest('/rest/api/3/myself', settings);

  return {
    ok: true,
    account: {
      displayName: account.displayName || 'Unknown user',
      emailAddress: account.emailAddress || 'Hidden by Jira permissions',
      accountId: account.accountId || ''
    }
  };
}

async function jiraRequest(resourcePath, settings) {
  const baseUrl = normalizeJiraBaseUrl(settings.jiraBaseUrl);
  const url = `${baseUrl}${resourcePath}`;
  const auth = Buffer.from(`${settings.jiraEmail}:${settings.jiraToken}`).toString('base64');

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Jira request failed with ${response.status}: ${body.slice(0, 350) || response.statusText}`
    );
  }

  return response.json();
}

function validateJiraSettings(settings) {
  if (!settings.jiraBaseUrl || !settings.jiraEmail || !settings.jiraToken) {
    throw new Error('Jira base URL, email, and token are required.');
  }

  try {
    normalizeJiraBaseUrl(settings.jiraBaseUrl);
  } catch {
    throw new Error('Jira base URL must be a valid URL.');
  }
}

function normalizeJiraBaseUrl(rawBaseUrl) {
  const url = new URL(String(rawBaseUrl || '').trim());
  url.pathname = url.pathname.replace(/\/browse\/?$/i, '').replace(/\/+$/, '');
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/+$/, '');
}

function normalizeIssue(rawIssue) {
  const fields = rawIssue.fields || {};
  const renderedFields = rawIssue.renderedFields || {};
  const names = rawIssue.names || {};
  const description =
    valueToText(fields.description) || stripHtml(renderedFields.description) || 'Unknown';

  const comments = (fields.comment?.comments || []).map((comment) => ({
    author: comment.author?.displayName || 'Unknown',
    created: comment.created || '',
    body: valueToText(comment.body)
  }));

  return {
    id: rawIssue.id || '',
    key: rawIssue.key || '',
    self: rawIssue.self || '',
    title: fields.summary || 'Untitled Jira issue',
    description,
    status: fields.status?.name || 'Unknown',
    issueType: fields.issuetype?.name || 'Unknown',
    priority: fields.priority?.name || 'Unknown',
    project: fields.project?.name || fields.project?.key || 'Unknown',
    labels: fields.labels || [],
    components: (fields.components || []).map((component) => component.name),
    versions: (fields.versions || []).map((version) => version.name),
    fixVersions: (fields.fixVersions || []).map((version) => version.name),
    assignee: fields.assignee?.displayName || 'Unassigned',
    reporter: fields.reporter?.displayName || 'Unknown',
    comments,
    attachments: (fields.attachment || []).map((attachment) => ({
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size
    })),
    linkedIssues: normalizeLinkedIssues(fields.issuelinks || []),
    requirementFields: extractRequirementFields(fields, names),
    fetchedAt: new Date().toISOString()
  };
}

function normalizeLinkedIssues(links) {
  return links.map((link) => {
    const linkedIssue = link.outwardIssue || link.inwardIssue || {};
    return {
      relationship: link.type?.name || link.type?.outward || link.type?.inward || 'Linked',
      key: linkedIssue.key || '',
      summary: linkedIssue.fields?.summary || '',
      status: linkedIssue.fields?.status?.name || ''
    };
  });
}

function extractRequirementFields(fields, names) {
  return Object.entries(names)
    .filter(([fieldId, displayName]) => {
      const value = fields[fieldId];
      return (
        value !== null &&
        value !== undefined &&
        /acceptance|criteria|requirement|scope|story|expected|definition/i.test(displayName)
      );
    })
    .map(([fieldId, displayName]) => ({
      id: fieldId,
      name: displayName,
      value: valueToText(fields[fieldId])
    }))
    .filter((field) => field.value);
}

export function valueToText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return stripHtml(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(valueToText).filter(Boolean).join('\n');

  if (value.type === 'doc' && Array.isArray(value.content)) {
    return adfToText(value).trim();
  }

  if (value.value) return valueToText(value.value);
  if (value.name) return valueToText(value.name);
  if (value.displayName) return valueToText(value.displayName);

  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function adfToText(node) {
  if (!node) return '';
  if (typeof node.text === 'string') return node.text;

  const content = Array.isArray(node.content) ? node.content : [];
  const childText = content.map(adfToText).filter(Boolean).join(node.type === 'paragraph' ? ' ' : '\n');

  if (['paragraph', 'heading', 'listItem'].includes(node.type) && childText) {
    return `${childText}\n`;
  }

  return childText;
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}
