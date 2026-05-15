import { NextResponse } from 'next/server'
import { ageToBand, normalizeSex } from '@sovereign/clinical-core'
import { createClient } from '@/lib/supabase/server'
import { emitTraining, hashUserId } from '@/lib/training'

function jitter(base: number, scale: number) {
  return base + (Math.random() - 0.5) * 2 * scale
}

export async function POST() {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('consumer_profiles')
    .select('chronological_age')
    .eq('user_id', auth.user.id)
    .maybeSingle()
  const chronoAge = (profile?.chronological_age as number | null) ?? null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const rows: Array<Record<string, unknown>> = []
  for (let i = 0; i < 14; i += 1) {
    const date = new Date(today.getTime() - i * 86400000)
    rows.push({
      user_id: auth.user.id,
      date: date.toISOString().slice(0, 10),
      source: 'simulator',
      resting_hr: Math.round(jitter(58, 4) * 10) / 10,
      avg_hr: Math.round(jitter(78, 6) * 10) / 10,
      hrv_rmssd: Math.round(jitter(78, 12) * 10) / 10,
      spo2: Math.round(jitter(97, 1) * 10) / 10,
      steps: Math.round(jitter(8400, 1800)),
      sleep_hours: Math.round(jitter(7.4, 0.6) * 100) / 100,
      recovery_score: Math.round(jitter(78, 12)),
      vo2_max: Math.round(jitter(48, 2) * 10) / 10,
      active_calories: Math.round(jitter(540, 120)),
    })
  }

  const { error } = await supabase
    .from('wearable_daily_metrics')
    .upsert(rows, { onConflict: 'user_id,date' })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await supabase
    .from('wearable_connections')
    .upsert(
      {
        user_id: auth.user.id,
        provider: 'apple_health',
        status: 'connected',
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' },
    )

  // Emit a training event for the most recent day so the bus sees the stream.
  try {
    const subjectHash = await hashUserId(auth.user.id)
    const latest = rows[0]
    await emitTraining({
      type: 'wearable_daily_metrics',
      subjectHash,
      ageBand: ageToBand(chronoAge ?? undefined),
      sex: normalizeSex(null),
      date: latest.date as string,
      provider: 'apple_health',
      metrics: {
        restingHr: latest.resting_hr as number,
        avgHr: latest.avg_hr as number,
        hrvRmssd: latest.hrv_rmssd as number,
        spo2: latest.spo2 as number,
        steps: latest.steps as number,
        sleepHours: latest.sleep_hours as number,
        recoveryScore: latest.recovery_score as number,
        vo2Max: latest.vo2_max as number,
        activeCalories: latest.active_calories as number,
      },
    })
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true, days: rows.length })
}
