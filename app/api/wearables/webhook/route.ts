import { NextResponse } from 'next/server'
import { ageToBand, normalizeSex } from '@sovereign/clinical-core'
import { createServiceClient } from '@/lib/supabase/server'
import { emitTraining, hashUserId } from '@/lib/training'

// Terra-compatible webhook payload (subset). Adapt mapping if you swap providers.
type TerraDailyPayload = {
  type: 'daily'
  user: { user_id?: string; reference_id?: string; provider?: string }
  data: Array<{
    metadata?: { start_time?: string; end_time?: string }
    heart_rate_data?: {
      summary?: { resting_hr_bpm?: number; avg_hr_bpm?: number; hrv_rmssd?: number }
    }
    oxygen_data?: { avg_saturation_percentage?: number }
    sleep_durations_data?: { asleep?: { duration_asleep_state_seconds?: number } }
    distance_data?: { steps?: number }
    scores?: { recovery?: number }
    vo2max?: { vo2max_ml_per_min_per_kg?: number }
    active_durations_data?: { activity_seconds?: number }
  }>
}

export async function POST(request: Request) {
  const secret = process.env.TERRA_WEBHOOK_SECRET
  const signature = request.headers.get('terra-signature')
  if (secret && signature !== secret) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  let payload: TerraDailyPayload
  try {
    payload = (await request.json()) as TerraDailyPayload
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 })
  }

  if (payload.type !== 'daily' || !payload.data || payload.data.length === 0) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const reference = payload.user.reference_id ?? payload.user.user_id
  if (!reference) {
    return NextResponse.json({ error: 'Missing user reference.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // reference_id is set by us when creating a Terra user; map to our auth user.
  const { data: profile } = await supabase
    .from('consumer_profiles')
    .select('user_id, chronological_age')
    .eq('user_id', reference)
    .maybeSingle()
  if (!profile) {
    return NextResponse.json({ error: 'Unknown subject.' }, { status: 404 })
  }
  const userId = profile.user_id as string

  const provider = (payload.user.provider ?? 'apple_health').toLowerCase()
  const rows = payload.data.map((d) => {
    const date = (d.metadata?.start_time ?? new Date().toISOString()).slice(0, 10)
    return {
      user_id: userId,
      date,
      source: provider,
      resting_hr: d.heart_rate_data?.summary?.resting_hr_bpm ?? null,
      avg_hr: d.heart_rate_data?.summary?.avg_hr_bpm ?? null,
      hrv_rmssd: d.heart_rate_data?.summary?.hrv_rmssd ?? null,
      spo2: d.oxygen_data?.avg_saturation_percentage ?? null,
      sleep_hours:
        typeof d.sleep_durations_data?.asleep?.duration_asleep_state_seconds === 'number'
          ? d.sleep_durations_data.asleep.duration_asleep_state_seconds / 3600
          : null,
      steps: d.distance_data?.steps ?? null,
      recovery_score: d.scores?.recovery ?? null,
      vo2_max: d.vo2max?.vo2max_ml_per_min_per_kg ?? null,
      active_calories: null,
      raw: d,
    }
  })

  const { error } = await supabase
    .from('wearable_daily_metrics')
    .upsert(rows, { onConflict: 'user_id,date' })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await supabase
    .from('wearable_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'connected')

  // Emit one training event per day in the payload.
  try {
    const subjectHash = await hashUserId(userId)
    if (!subjectHash) throw new Error('training disabled')
    for (const row of rows) {
      await emitTraining({
        type: 'wearable_daily_metrics',
        subjectHash,
        ageBand: ageToBand((profile.chronological_age as number | null) ?? undefined),
        sex: normalizeSex(null),
        date: row.date,
        provider,
        metrics: {
          restingHr: row.resting_hr,
          avgHr: row.avg_hr,
          hrvRmssd: row.hrv_rmssd,
          spo2: row.spo2,
          steps: row.steps,
          sleepHours: row.sleep_hours,
          recoveryScore: row.recovery_score,
          vo2Max: row.vo2_max,
          activeCalories: row.active_calories,
        },
      })
    }
  } catch {
    // emission best-effort
  }

  return NextResponse.json({ ok: true, days: rows.length })
}
