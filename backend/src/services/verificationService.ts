import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
const THRESHOLD = parseFloat(process.env.VERIFY_THRESHOLD ?? '0.6')

export interface VerificationResult {
  score: number        // 0–1
  rationale: string
  decision: 'approved' | 'rejected'
  urlReachable?: boolean
}

const SYSTEM_PROMPT = `You are a technical bounty verification assistant. Your job is to evaluate whether a submitted solution adequately addresses a posted task description.

Scoring rules:
- Score range: 0.0 to 1.0
- Score ≥ ${THRESHOLD}: solution adequately addresses the task → decision: "approved"
- Score < ${THRESHOLD}: solution is insufficient, off-topic, or incomplete → decision: "rejected"
- Be strict but fair. A minimal working solution that addresses all core requirements can score ≥ ${THRESHOLD}.
- A vague, off-topic, or incomplete answer should score < ${THRESHOLD}.

Return ONLY valid JSON in this exact format (no markdown, no explanation outside JSON):
{
  "score": <number between 0.0 and 1.0>,
  "rationale": "<2-3 sentence explanation of the score>"
}`

export class VerificationService {
  async score(bountyDescription: string, solutionText: string): Promise<{ score: number; rationale: string }> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: SYSTEM_PROMPT,
    })

    const prompt = `BOUNTY TASK:\n${bountyDescription}\n\nSOLUTION SUBMITTED:\n${solutionText}`

    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()

    const parsed = JSON.parse(cleaned) as { score: number; rationale: string }
    if (typeof parsed.score !== 'number' || !parsed.rationale) {
      throw new Error('Invalid response format from Gemini')
    }
    // Clamp to [0, 1]
    parsed.score = Math.max(0, Math.min(1, parsed.score))
    return parsed
  }

  async verify(bountyDescription: string, solutionText: string, url?: string | null): Promise<VerificationResult> {
    const { score: rawScore, rationale: rawRationale } = await this.score(bountyDescription, solutionText)

    let urlReachable: boolean | undefined
    let score = rawScore
    let rationale = rawRationale

    if (url && url.trim()) {
      urlReachable = await validateUrl(url.trim())
      if (!urlReachable) {
        score = Math.max(0, score - 0.2)
        rationale += ` The submitted URL (${url}) could not be reached, which reduces confidence.`
      }
    }

    return {
      score,
      rationale,
      decision: score >= THRESHOLD ? 'approved' : 'rejected',
      urlReachable,
    }
  }
}

export async function validateUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' })
    clearTimeout(timeout)
    return res.ok || res.status === 405 // 405 = HEAD not allowed but server is alive
  } catch {
    return false
  }
}

export const verificationService = new VerificationService()
