import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT =
  'You are a LongevityIQ AI health advisor. Generate a single personalized 1-2 sentence longevity insight based on the user data provided. Be specific and actionable. Never use em dashes. Ground recommendations in evidence-based longevity science.'

export type InsightContext = {
  email: string
  tier: string | null
  bioAge: number | null
  chronologicalAge: number | null
  assessmentScores: Record<string, number> | null
  recentProtocols: string[]
}

export async function generateDailyInsight(ctx: InsightContext): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return fallbackInsight(ctx)
  }

  const client = new Anthropic({ apiKey: key })

  const userBlock = [
    `Tier: ${ctx.tier ?? 'free'}`,
    `Chronological age: ${ctx.chronologicalAge ?? 'unknown'}`,
    `Biological age estimate: ${ctx.bioAge ?? 'unknown'}`,
    `Assessment scores (1 to 5): ${JSON.stringify(ctx.assessmentScores ?? {})}`,
    `Recent protocols: ${ctx.recentProtocols.length ? ctx.recentProtocols.join(', ') : 'none'}`,
  ].join('\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 220,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userBlock }],
  })

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join(' ')
    .replace(/—|–/g, ',')
    .trim()

  return text.length > 0 ? text : fallbackInsight(ctx)
}

function fallbackInsight(ctx: InsightContext): string {
  if (ctx.bioAge && ctx.chronologicalAge && ctx.bioAge < ctx.chronologicalAge) {
    return 'Your biological age is trending younger than your chronological age. Prioritize Zone 2 cardio for 45 minutes today to compound the gain.'
  }
  return 'Aim for 7.5 hours of sleep and 30 grams of protein at breakfast today. Both inputs move biological age more than any single supplement.'
}
