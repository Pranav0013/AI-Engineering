import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { BugReport, JiraAttachment } from '../../src/types'

interface CreateIssueBody {
  bugReport: BugReport
  projectKey: string
  attachments?: JiraAttachment[]
}

function severityToJiraPriority(severity: string | null): string {
  switch (severity) {
    case 'critical': return 'Highest'
    case 'high': return 'High'
    case 'medium': return 'Medium'
    case 'low': return 'Low'
    default: return 'Medium'
  }
}

function buildADF(report: BugReport): unknown {
  const { report: r, rootCause, observation } = report

  function paragraph(text: string) {
    return {
      type: 'paragraph',
      content: [{ type: 'text', text }],
    }
  }

  function heading(text: string, level: number) {
    return {
      type: 'heading',
      attrs: { level },
      content: [{ type: 'text', text }],
    }
  }

  function bulletList(items: string[]) {
    return {
      type: 'bulletList',
      content: items.map((item) => ({
        type: 'listItem',
        content: [paragraph(item)],
      })),
    }
  }

  function orderedList(items: string[]) {
    return {
      type: 'orderedList',
      content: items.map((item) => ({
        type: 'listItem',
        content: [paragraph(item)],
      })),
    }
  }

  const nodes: unknown[] = [
    heading('Description', 2),
    paragraph(r.description),

    heading('Steps to Reproduce', 2),
    orderedList(r.stepsToReproduce),

    heading('Expected Result', 2),
    paragraph(r.expectedResult),

    heading('Actual Result', 2),
    paragraph(r.actualResult),

    heading('Root Cause Analysis', 2),
    paragraph(rootCause.hypothesis),
    ...(rootCause.evidence.length > 0 ? [heading('Evidence', 3), bulletList(rootCause.evidence)] : []),

    heading('Suggested Fix', 2),
    paragraph(r.suggestedFix),
  ]

  if (observation.errorMessages.length > 0) {
    nodes.push(heading('Error Messages (Verbatim)', 2))
    nodes.push({
      type: 'codeBlock',
      attrs: { language: 'text' },
      content: [{ type: 'text', text: observation.errorMessages.join('\n') }],
    })
  }

  if (r.additionalContext) {
    nodes.push(heading('Additional Context', 2))
    nodes.push(paragraph(r.additionalContext))
  }

  return { version: 1, type: 'doc', content: nodes }
}

/** Uploads evidence images to a Jira issue. Returns an error message if any upload fails, otherwise undefined. */
async function uploadAttachments(
  baseUrl: string,
  credentials: string,
  issueKey: string,
  attachments: JiraAttachment[]
): Promise<string | undefined> {
  const errors: string[] = []

  for (const attachment of attachments) {
    try {
      const buffer = Buffer.from(attachment.base64, 'base64')
      const form = new FormData()
      form.append('file', new Blob([buffer], { type: attachment.mimeType }), attachment.filename)

      const response = await fetch(`${baseUrl}/rest/api/3/issue/${issueKey}/attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: 'application/json',
          'X-Atlassian-Token': 'no-check',
        },
        body: form,
      })

      if (!response.ok) {
        const text = await response.text()
        errors.push(`${attachment.filename}: ${text}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'upload failed'
      errors.push(`${attachment.filename}: ${message}`)
    }
  }

  return errors.length > 0 ? `Some attachments failed to upload: ${errors.join('; ')}` : undefined
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const jiraUrl = process.env.JIRA_URL
  const jiraEmail = process.env.JIRA_EMAIL
  const jiraToken = process.env.JIRA_TOKEN

  if (!jiraUrl || !jiraEmail || !jiraToken) {
    res.status(500).json({ error: 'Jira credentials are not configured' })
    return
  }

  const { bugReport, projectKey, attachments } = req.body as CreateIssueBody

  if (!bugReport || !projectKey) {
    res.status(400).json({ error: 'Missing bugReport or projectKey' })
    return
  }

  const credentials = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')
  const baseUrl = jiraUrl.replace(/\/$/, '')

  const issuePayload = {
    fields: {
      project: { key: projectKey },
      summary: bugReport.report.title,
      description: buildADF(bugReport),
      issuetype: { name: 'Bug' },
      priority: { name: severityToJiraPriority(bugReport.classification.severity) },
      labels: bugReport.classification.tags ?? [],
    },
  }

  try {
    const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(issuePayload),
    })

    const data = await response.json() as { id: string; key: string; self: string }

    if (!response.ok) {
      res.status(response.status).json({ error: JSON.stringify(data) })
      return
    }

    let attachmentError: string | undefined
    if (attachments && attachments.length > 0) {
      attachmentError = await uploadAttachments(baseUrl, credentials, data.key, attachments)
    }

    res.status(201).json({
      ticketId: data.key,
      ticketUrl: `${baseUrl}/browse/${data.key}`,
      projectKey,
      ...(attachmentError ? { attachmentError } : {}),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create Jira issue'
    res.status(500).json({ error: message })
  }
}
