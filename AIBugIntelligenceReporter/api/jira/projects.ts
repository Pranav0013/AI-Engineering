import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const jiraUrl = process.env.JIRA_URL
  const jiraEmail = process.env.JIRA_EMAIL
  const jiraToken = process.env.JIRA_TOKEN

  if (!jiraUrl || !jiraEmail || !jiraToken) {
    res.status(500).json({ error: 'Jira credentials are not configured on the server' })
    return
  }

  const credentials = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')

  try {
    const response = await fetch(
      `${jiraUrl.replace(/\/$/, '')}/rest/api/3/project?orderBy=name&maxResults=50`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      const text = await response.text()
      res.status(response.status).json({ error: `Jira API error: ${text}` })
      return
    }

    const data = await response.json() as unknown[]
    res.status(200).json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch Jira projects'
    res.status(500).json({ error: message })
  }
}
