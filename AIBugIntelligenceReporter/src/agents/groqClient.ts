import Groq from 'groq-sdk'

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

let _client: Groq | null = null

function getClient(): Groq {
  if (!_client) {
    const apiKey = process.env.GORQ_KEY
    if (!apiKey) throw new Error('GORQ_KEY environment variable is not set')
    _client = new Groq({ apiKey })
  }
  return _client
}

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

interface RunAgentOptions {
  systemPrompt: string
  userPrompt: string
  images?: string[]  // base64 strings (no data URL prefix)
  imageType?: 'image/jpeg' | 'image/png' | 'image/webp'
}

export async function runAgent(options: RunAgentOptions): Promise<unknown> {
  const { systemPrompt, userPrompt, images = [], imageType = 'image/jpeg' } = options
  const client = getClient()

  const userContent: ContentPart[] = []

  for (const b64 of images) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:${imageType};base64,${b64}` },
    })
  }

  userContent.push({ type: 'text', text: userPrompt })

  const response = await client.chat.completions.create({
    model: VISION_MODEL,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent as any },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 2048,
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  return JSON.parse(raw)
}

export async function runTextAgent(options: {
  systemPrompt: string
  userPrompt: string
}): Promise<unknown> {
  const client = getClient()

  const response = await client.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      { role: 'system', content: options.systemPrompt },
      { role: 'user', content: options.userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 2048,
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  return JSON.parse(raw)
}
