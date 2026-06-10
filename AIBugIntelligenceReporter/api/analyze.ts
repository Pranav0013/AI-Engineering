import type { VercelRequest, VercelResponse } from '@vercel/node'
import { runPipeline } from '../src/agents/pipeline.js'
import type { AnalysisRequest } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = req.body as AnalysisRequest

  if (!body?.media?.type || !body?.media?.filename) {
    res.status(400).json({ error: 'Missing required fields: media.type and media.filename' })
    return
  }

  const hasContent =
    body.media.imageData ||
    (body.media.frames && body.media.frames.length > 0) ||
    body.media.textContent ||
    body.media.traceContent

  if (!hasContent) {
    res.status(400).json({ error: 'No media content provided' })
    return
  }

  // Stream NDJSON back to client
  res.setHeader('Content-Type', 'application/x-ndjson')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.setHeader('X-Accel-Buffering', 'no')

  function send(event: unknown) {
    res.write(JSON.stringify(event) + '\n')
  }

  try {
    const pipeline = runPipeline(body)
    for await (const event of pipeline) {
      send(event)
      if (event.event === 'error') {
        res.end()
        return
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    send({ event: 'error', message })
  }

  res.end()
}
