const SECTION_PATTERNS = {
  responsibilities:
    /responsibilit|what you('|’)?ll do|what you will do|day.to.day|duties|key tasks|about the role|role overview/i,
  required:
    /requirements?|required skills?|qualifications|must.have|minimum qualifications|who you are|what you('|’)?ll need|what we('|’)?re looking for|basic qualifications/i,
  niceToHave:
    /nice.to.have|preferred qualifications|preferred skills?|bonus points?|good to have|desirable|^pluses?\b|a plus\b/i,
}

const HEADING_PATTERN = /:\s*$|^#{1,6}\s|^[A-Z][A-Za-z\s/&-]+$/

const SALARY_REGEXES = [
  /\$\s?\d[\d,]*(\.\d+)?\s?(k|K)?(\s?-\s?\$?\s?\d[\d,]*(\.\d+)?\s?(k|K)?)?(\s?(per|\/)\s?(year|yr|annum|hour|hr|month|mo))?/g,
  /₹\s?\d[\d,]*(\.\d+)?\s?(lakh|lakhs|lpa|l|k)?/gi,
  /€\s?\d[\d,]*(\.\d+)?\s?(k|K)?/g,
  /£\s?\d[\d,]*(\.\d+)?\s?(k|K)?/g,
  /\b\d{2,3}\s?-\s?\d{2,3}\s?(k|K)\b/g,
  /\bCTC[^.\n]{0,60}/gi,
  /\bsalary range[^.\n]{0,60}/gi,
]

const EXPERIENCE_REGEXES = [
  /\d+\+?\s*(?:-\s*\d+\+?\s*)?years?(?:\s+of)?\s+(?:relevant\s+)?experience/gi,
  /minimum\s+of\s+\d+\+?\s*years?/gi,
  /\d+\+?\s*yrs?\b(?:\s+(?:of\s+)?experience)?/gi,
  /entry.level|senior.level|mid.level|junior.level/gi,
]

const RED_FLAG_PHRASES = [
  { pattern: /wear (many|multiple) hats/i, note: '"Wear many hats" often signals understaffing or an unclear role scope.' },
  { pattern: /fast.paced environment/i, note: '"Fast-paced environment" can be a euphemism for high pressure or long hours.' },
  { pattern: /rockstar|ninja|guru|superhero/i, note: 'Buzzword titles ("rockstar"/"ninja"/"guru") may indicate an unstructured or immature engineering culture.' },
  { pattern: /work hard,? play hard/i, note: '"Work hard, play hard" can mask expectations of long hours.' },
  { pattern: /other duties as assigned/i, note: '"Other duties as assigned" gives broad, undefined scope-creep latitude.' },
  { pattern: /unlimited (pto|vacation)/i, note: '"Unlimited PTO" policies sometimes correlate with employees taking less time off due to social pressure.' },
  { pattern: /must be willing to work (nights|weekends|holidays|extended hours|overtime)/i, note: 'Explicit expectation of nights, weekends, holidays, or overtime.' },
  { pattern: /competitive salary/i, note: '"Competitive salary" with no figures often signals below-market pay.' },
  { pattern: /equity in lieu of (salary|pay|compensation)/i, note: 'Equity offered in place of salary — verify vesting schedule and valuation carefully.' },
  { pattern: /\bunpaid\b/i, note: 'Mentions an unpaid component (e.g. unpaid trial period or internship).' },
  { pattern: /fast.growing startup|rapidly growing/i, note: '"Fast-growing startup" language can mean instability or undefined processes.' },
  { pattern: /like a family|family[- ]oriented/i, note: '"We\'re like a family" is sometimes used to justify blurred work/life boundaries.' },
  { pattern: /self.starter.{0,30}(minimal|little) (supervision|guidance|support)/i, note: 'Minimal support/guidance expected — may indicate a lack of onboarding or mentorship.' },
  { pattern: /must wear multiple hats|jack of all trades/i, note: 'Broad, loosely-defined responsibilities — role scope may be unclear.' },
]

function splitLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function stripBullet(line) {
  return line.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim()
}

function matchSectionHeading(line) {
  if (line.length > 70) return null
  const withoutHeader = line.replace(/^#{1,6}\s*/, '')
  if (!HEADING_PATTERN.test(line)) return null
  if (SECTION_PATTERNS.niceToHave.test(withoutHeader)) return 'niceToHave'
  if (SECTION_PATTERNS.required.test(withoutHeader)) return 'required'
  if (SECTION_PATTERNS.responsibilities.test(withoutHeader)) return 'responsibilities'
  return 'other'
}

function extractSections(text) {
  const lines = splitLines(text)
  const result = { responsibilities: [], required: [], niceToHave: [] }
  let current = null

  for (const rawLine of lines) {
    const heading = matchSectionHeading(rawLine)
    if (heading) {
      current = heading === 'other' ? null : heading
      continue
    }
    if (current) {
      const cleaned = stripBullet(rawLine)
      if (cleaned) result[current].push(cleaned)
    }
  }

  return result
}

function extractMatches(text, regexes) {
  const found = new Set()
  for (const regex of regexes) {
    const matches = text.matchAll(regex)
    for (const match of matches) {
      const value = match[0].trim()
      if (value) found.add(value)
    }
  }
  return Array.from(found)
}

function extractRedFlags(text, salaryInfo) {
  const flags = []
  for (const { pattern, note } of RED_FLAG_PHRASES) {
    if (pattern.test(text)) flags.push(note)
  }
  if (salaryInfo.length === 0) {
    flags.push('No salary or compensation figures found in this JD — consider asking about pay range during screening.')
  }
  return flags
}

export function summarizeOffline(jdText) {
  const sections = extractSections(jdText)
  const salaryInfo = extractMatches(jdText, SALARY_REGEXES)
  const experienceRequirements = extractMatches(jdText, EXPERIENCE_REGEXES)

  return {
    mode: 'heuristic',
    keyResponsibilities: sections.responsibilities,
    requiredSkills: sections.required,
    niceToHaveSkills: sections.niceToHave,
    salaryInfo,
    experienceRequirements,
    redFlags: extractRedFlags(jdText, salaryInfo),
  }
}

const RESULT_KEYS = [
  'keyResponsibilities',
  'requiredSkills',
  'niceToHaveSkills',
  'salaryInfo',
  'experienceRequirements',
  'redFlags',
]

function buildPrompt(jdText) {
  return `You are analyzing a job description. Extract the following six fields and respond with ONLY a JSON object (no markdown fences, no commentary) with these exact keys, each an array of short strings:

- "keyResponsibilities": distinct responsibilities or duties
- "requiredSkills": required skills, qualifications, or must-haves
- "niceToHaveSkills": preferred or bonus skills
- "salaryInfo": any salary/compensation figures or ranges mentioned (empty array if none)
- "experienceRequirements": experience or seniority requirements mentioned (empty array if none)
- "redFlags": potential concerns in the JD (e.g. vague compensation, scope creep, unrealistic requirements, concerning culture language). Empty array if none found.

Respond with JSON only.

Job description:
"""
${jdText}
"""`
}

function parseGroqResponse(data) {
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response from GROQ')

  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  const parsed = JSON.parse(cleaned)

  const result = { mode: 'ai' }
  for (const key of RESULT_KEYS) {
    const value = parsed[key]
    result[key] = Array.isArray(value) ? value.map(String) : []
  }
  return result
}

export async function summarizeWithGroq(jdText, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: buildPrompt(jdText) }],
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`GROQ API error ${response.status}: ${body.slice(0, 200)}`)
  }

  const data = await response.json()
  return parseGroqResponse(data)
}

export async function summarizeJD(jdText, apiKey) {
  if (!apiKey) return summarizeOffline(jdText)

  try {
    return await summarizeWithGroq(jdText, apiKey)
  } catch (err) {
    return {
      ...summarizeOffline(jdText),
      warning: `AI request failed (${err.message}) — showing local analysis instead.`,
    }
  }
}
