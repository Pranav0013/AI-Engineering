import axios from 'axios';

function extractTextFromADF(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';
  if (node.type === 'rule') return '\n---\n';
  if (node.content && Array.isArray(node.content)) {
    const sep = ['paragraph', 'bulletList', 'orderedList', 'blockquote', 'heading'].includes(node.type) ? '\n' : ' ';
    return node.content.map(extractTextFromADF).join(sep).trim();
  }
  return '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    issueId,
    jiraEmail = process.env.JIRA_EMAIL,
    jiraToken = process.env.JIRA_TOKEN,
    jiraBaseUrl = process.env.JIRA_URL,
  } = req.body;

  if (!issueId) return res.status(400).json({ error: 'issueId is required' });
  if (!jiraEmail || !jiraToken || !jiraBaseUrl) {
    return res.status(400).json({ error: 'Jira credentials are not configured. Fill in Settings.' });
  }

  const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
  const url = `${jiraBaseUrl.replace(/\/$/, '')}/rest/api/3/issue/${issueId}`;

  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
    });

    const f = data.fields;
    const description = f.description ? extractTextFromADF(f.description) : 'No description provided.';

    res.json({
      key: data.key,
      summary: f.summary || '',
      description,
      issueType: f.issuetype?.name || 'Unknown',
      status: f.status?.name || 'Unknown',
      priority: f.priority?.name || 'Unknown',
      labels: f.labels || [],
      components: (f.components || []).map((c) => c.name),
      reporter: f.reporter?.displayName || 'Unknown',
      assignee: f.assignee?.displayName || 'Unassigned',
      project: f.project?.name || '',
      webUrl: `${jiraBaseUrl.replace(/\/$/, '')}/browse/${data.key}`,
    });
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) return res.status(401).json({ error: 'Invalid Jira credentials.' });
    if (status === 404) return res.status(404).json({ error: `Issue "${issueId}" not found.` });
    return res.status(503).json({ error: `Cannot reach Jira: ${err.message}` });
  }
}
