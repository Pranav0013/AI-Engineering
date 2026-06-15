export const QUESTION_CATEGORIES = [
  { key: 'technicalQuestions', label: 'Technical Questions' },
  { key: 'behavioralQuestions', label: 'Behavioral Questions' },
  { key: 'roleSpecificQuestions', label: 'Role-Specific Questions' },
  { key: 'codingQuestions', label: 'Coding Questions' },
  { key: 'systemDesignQuestions', label: 'System Design Questions' },
  { key: 'mostAskedQuestions', label: 'Most Asked Questions (Company-Specific)', optional: true },
]

const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard']

function buildQuestionsPrompt({ jobTitle, companyName, jobDescription }) {
  return `You are a senior technical interviewer.

Analyze the following job description, then generate a tailored interview question set.

Job Title: ${jobTitle}
Company: ${companyName}
Job Description:
"""
${jobDescription}
"""

Generate interview questions in 6 categories:
1. technicalQuestions — exactly 12 questions. Focus heavily on the specific technologies, tools, and frameworks mentioned in the job description.
2. behavioralQuestions — exactly 8 questions about soft skills, teamwork, conflict resolution, and past experiences.
3. roleSpecificQuestions — exactly 10 questions specific to the day-to-day responsibilities of this exact job title.
4. codingQuestions — exactly 5 hands-on coding or algorithm questions relevant to the tech stack.
5. systemDesignQuestions — for senior roles only (job title contains words like Senior, Staff, Lead, Principal, Architect, Manager, or Head, or the job description implies 5+ years of experience). If the role is senior, generate exactly 4 questions; otherwise return an empty array.
6. mostAskedQuestions — ONLY if you have specific, recognizable knowledge of real interview questions that have been commonly reported by past candidates for "${companyName}" (e.g. well-known questions from interview-experience reports you learned during training). Include up to 8 such questions. If you do NOT have specific, company-verified knowledge of "${companyName}"'s actual past interview questions, return an empty array for this key — do NOT invent generic questions to fill it.

Requirements:
- Questions must be relevant to the role and company context.
- Avoid duplicate or near-duplicate questions, including across categories.
- Every question needs a "difficulty" of "Easy", "Medium", or "Hard".
- Return ONLY a JSON object (no markdown fences, no commentary) with exactly these keys, each an array of objects shaped like { "question": string, "difficulty": "Easy"|"Medium"|"Hard" }:
  - "technicalQuestions"
  - "behavioralQuestions"
  - "roleSpecificQuestions"
  - "codingQuestions"
  - "systemDesignQuestions"
  - "mostAskedQuestions"

Respond with JSON only.`
}

function buildAnswerPrompt({ question, jobTitle, companyName, jobDescription, category }) {
  const isCoding = category === 'codingQuestions'
  const answerInstructions = isCoding
    ? `Provide a complete, working code solution to this coding/algorithm question — NOT a theoretical explanation. Include:
- A one-sentence summary of the approach.
- A fenced code block with a full, runnable implementation (pick a language that fits the job's tech stack; default to JavaScript or Python if unclear).
- A brief note on time/space complexity.`
    : `Write a concise, high-quality suggested answer (roughly 3-6 sentences, or a short structured example if the question calls for it) that a strong candidate could give to this question.`

  return `You are a senior technical interviewer helping a candidate prepare for an upcoming interview.

Job Title: ${jobTitle}
Company: ${companyName}
${jobDescription ? `Job Description:\n"""\n${jobDescription}\n"""\n` : ''}
Interview Question: "${question}"

${answerInstructions}

Return ONLY a JSON object with exactly one key: { "answer": string }. The "answer" string may contain markdown/code fences if needed. Respond with JSON only.`
}

function stripFences(text) {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
}

function stripCodeFences(text) {
  return text.trim().replace(/```[a-zA-Z]*\n?/g, '')
}

function toQuestionItems(rawList) {
  if (!Array.isArray(rawList)) return []
  return rawList
    .map((item) => {
      const question = String(item?.question ?? '').trim()
      const difficulty = VALID_DIFFICULTIES.includes(item?.difficulty) ? item.difficulty : 'Medium'
      return {
        id: crypto.randomUUID(),
        question,
        difficulty,
        practiced: false,
        favorite: false,
        answer: null,
        showAnswer: false,
      }
    })
    .filter((item) => item.question)
}

async function callGroq(apiKey, { prompt, maxTokens }) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`GROQ API error ${response.status}: ${body.slice(0, 200)}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response from GROQ')
  return JSON.parse(stripFences(text))
}

export async function generateInterviewQuestions(input, apiKey) {
  if (!apiKey) throw new Error('A GROQ API key is required to generate interview questions.')

  const parsed = await callGroq(apiKey, {
    prompt: buildQuestionsPrompt(input),
    maxTokens: 4096,
  })

  return {
    generatedAt: new Date().toISOString(),
    technicalQuestions: toQuestionItems(parsed.technicalQuestions),
    behavioralQuestions: toQuestionItems(parsed.behavioralQuestions),
    roleSpecificQuestions: toQuestionItems(parsed.roleSpecificQuestions),
    codingQuestions: toQuestionItems(parsed.codingQuestions),
    systemDesignQuestions: toQuestionItems(parsed.systemDesignQuestions),
    mostAskedQuestions: toQuestionItems(parsed.mostAskedQuestions),
  }
}

export async function generateAnswer(input, apiKey) {
  if (!apiKey) throw new Error('A GROQ API key is required to generate a suggested answer.')

  const parsed = await callGroq(apiKey, {
    prompt: buildAnswerPrompt(input),
    maxTokens: input.category === 'codingQuestions' ? 1200 : 600,
  })

  return stripCodeFences(String(parsed.answer ?? ''))
}
