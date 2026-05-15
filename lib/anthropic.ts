import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT =
  'You are the Sovereign Healthcare AI longevity advisor. Generate a single personalized 1-2 sentence insight grounded in evidence-based longevity science. Cite the specific signal (PhenoAge delta, biomarker out of optimal, HRV trend, recovery trend, recent protocol) that drives the recommendation. Be specific and actionable. Never use em dashes.'

export type InsightContext = {
  email: string
  tier: string | null
  bioAge: number | null
  phenoAge: number | null
  chronologicalAge: number | null
  assessmentScores: Record<string, number> | null
  recentProtocols: string[]
  outOfOptimalBiomarkers: Array<{
    name: string
    value: number
    unit: string
    status: string
  }>
  wearableTrend: {
    avgRestingHr: number | null
    avgHrv: number | null
    avgSleepHours: number | null
    avgRecovery: number | null
    days: number
  } | null
}

export async function generateDailyInsight(ctx: InsightContext): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return fallbackInsight(ctx)

  const client = new Anthropic({ apiKey: key })

  const phenoBlock =
    ctx.phenoAge !== null && ctx.chronologicalAge !== null
      ? `PhenoAge: ${ctx.phenoAge} (chronological ${ctx.chronologicalAge}, delta ${(ctx.phenoAge - ctx.chronologicalAge).toFixed(1)} years)`
      : `PhenoAge: not yet measured`

  const bioBlock =
    ctx.bioAge !== null && ctx.chronologicalAge !== null
      ? `Lifestyle vitality age: ${ctx.bioAge} (chronological ${ctx.chronologicalAge})`
      : `Lifestyle vitality age: not yet scored`

  const wearableBlock = ctx.wearableTrend
    ? `Wearable ${ctx.wearableTrend.days}-day average: resting HR ${ctx.wearableTrend.avgRestingHr}, HRV ${ctx.wearableTrend.avgHrv}, sleep ${ctx.wearableTrend.avgSleepHours}h, recovery ${ctx.wearableTrend.avgRecovery}`
    : `Wearable: no recent stream`

  const biomarkerBlock =
    ctx.outOfOptimalBiomarkers.length > 0
      ? `Biomarkers outside optimal: ${ctx.outOfOptimalBiomarkers
          .map((m) => `${m.name} ${m.value}${m.unit} (${m.status})`)
          .join('; ')}`
      : `Biomarkers: all within optimal or no panel`

  const userBlock = [
    `Tier: ${ctx.tier ?? 'free'}`,
    phenoBlock,
    bioBlock,
    `Lifestyle scores (1-5): ${JSON.stringify(ctx.assessmentScores ?? {})}`,
    biomarkerBlock,
    wearableBlock,
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
  if (ctx.outOfOptimalBiomarkers.length > 0) {
    const worst = ctx.outOfOptimalBiomarkers[0]
    return `Your ${worst.name} sits at ${worst.value}${worst.unit}, outside the longevity-optimal band. Discuss targeted intervention with your clinical partner this week.`
  }
  if (ctx.phenoAge !== null && ctx.chronologicalAge !== null && ctx.phenoAge < ctx.chronologicalAge) {
    return 'Your PhenoAge is trending younger than your chronological age. Defend the lead with 45 minutes of Zone 2 today.'
  }
  return 'Aim for 7.5 hours of sleep and 30 grams of protein at breakfast today. Both inputs move biological age more than any single supplement.'
}
