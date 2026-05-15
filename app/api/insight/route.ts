import { NextResponse } from 'next/server'
import { ageToBand, normalizeSex } from '@sovereign/clinical-core'
import { createClient } from '@/lib/supabase/server'
import { generateDailyInsight, type InsightContext } from '@/lib/anthropic'
import { PHASE_1_PROTOCOLS } from '@/lib/protocols'
import { emitTraining, hashUserId } from '@/lib/training'

const REFRESH_WINDOW_HOURS = 20

export async function POST() {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('consumer_profiles')
    .select('*')
    .eq('user_id', auth.user.id)
    .single()
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  const { data: latest } = await supabase
    .from('daily_insights')
    .select('id, insight_text, generated_at')
    .eq('consumer_id', profile.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest) {
    const ageHours =
      (Date.now() - new Date(latest.generated_at as string).getTime()) / (1000 * 60 * 60)
    if (ageHours < REFRESH_WINDOW_HOURS) {
      return NextResponse.json({
        ok: true,
        cached: true,
        insight: latest.insight_text,
        generatedAt: latest.generated_at,
      })
    }
  }

  // Recent protocols.
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('service')
    .eq('consumer_id', profile.id)
    .order('scheduled_for', { ascending: false })
    .limit(5)
  const recentProtocols = (recentBookings ?? [])
    .map((row) => PHASE_1_PROTOCOLS.find((p) => p.slug === row.service)?.name)
    .filter((v): v is string => Boolean(v))

  // Out-of-optimal biomarkers (latest panel).
  let outOfOptimal: InsightContext['outOfOptimalBiomarkers'] = []
  const { data: panel } = await supabase
    .from('biomarker_panels')
    .select('id')
    .eq('consumer_id', profile.id)
    .order('drawn_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (panel) {
    const { data: results } = await supabase
      .from('biomarker_results')
      .select('marker_name, value, unit, status')
      .eq('panel_id', panel.id)
      .in('status', ['high', 'low', 'critical'])
      .limit(6)
    outOfOptimal = (results ?? []).map((r) => ({
      name: r.marker_name as string,
      value: Number(r.value ?? 0),
      unit: (r.unit as string) ?? '',
      status: (r.status as string) ?? 'unknown',
    }))
  }

  // Wearable seven-day average.
  const sevenAgo = new Date()
  sevenAgo.setDate(sevenAgo.getDate() - 7)
  const { data: wearableRows } = await supabase
    .from('wearable_daily_metrics')
    .select('resting_hr, hrv_rmssd, sleep_hours, recovery_score')
    .eq('user_id', auth.user.id)
    .gte('date', sevenAgo.toISOString().slice(0, 10))
  const wearableTrend = wearableRows && wearableRows.length > 0
    ? aggregate(wearableRows)
    : null

  const insightText = await generateDailyInsight({
    email: profile.email,
    tier: profile.tier,
    bioAge: profile.bio_age,
    phenoAge: profile.phenoage,
    chronologicalAge: profile.chronological_age,
    assessmentScores: profile.assessment_scores ?? {},
    recentProtocols,
    outOfOptimalBiomarkers: outOfOptimal,
    wearableTrend,
  })

  const { data: stored, error } = await supabase
    .from('daily_insights')
    .insert({ consumer_id: profile.id, insight_text: insightText })
    .select('id, insight_text, generated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Emit training event so the Sovereign AI learns from every prompt response cycle.
  try {
    const daysOnPlatform = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(profile.created_at as string).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    )
    const promptDigest = await digestString(`${SYSTEM_SUMMARY}|${insightText}`)
    const subjectHash = await hashUserId(auth.user.id)
    if (!subjectHash) throw new Error('training disabled')
    await emitTraining({
      type: 'ai_insight_generated',
      subjectHash,
      ageBand: ageToBand((profile.chronological_age as number | null) ?? undefined),
      sex: normalizeSex(null),
      tier: (profile.tier as 'free' | 'essential' | 'optimizer' | 'sovereign') ?? 'free',
      modelId: 'claude-sonnet-4-20250514',
      promptDigest,
      insightSummary: insightText.slice(0, 240),
      contextSignals: {
        hasBiomarkerPanel: !!panel,
        hasWearableSync: !!wearableTrend,
        bioAgeDelta:
          profile.phenoage !== null && profile.chronological_age !== null
            ? Number(profile.phenoage) - Number(profile.chronological_age)
            : profile.bio_age !== null && profile.chronological_age !== null
              ? Number(profile.bio_age) - Number(profile.chronological_age)
              : null,
        daysOnPlatform,
      },
    })
  } catch {
    // emission best-effort
  }

  return NextResponse.json({
    ok: true,
    cached: false,
    insight: stored.insight_text,
    generatedAt: stored.generated_at,
  })
}

const SYSTEM_SUMMARY = 'sovereign-longevity-advisor-v1'

async function digestString(input: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return 'no-digest'
  const buf = await subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function aggregate(
  rows: Array<{
    resting_hr: number | null
    hrv_rmssd: number | null
    sleep_hours: number | null
    recovery_score: number | null
  }>,
) {
  function avg(field: keyof (typeof rows)[number]) {
    const nums = rows
      .map((r) => r[field])
      .filter((v): v is number => typeof v === 'number')
    if (nums.length === 0) return null
    return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
  }
  return {
    avgRestingHr: avg('resting_hr'),
    avgHrv: avg('hrv_rmssd'),
    avgSleepHours: avg('sleep_hours'),
    avgRecovery: avg('recovery_score'),
    days: rows.length,
  }
}
