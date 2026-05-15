import WearableDashboard from '@/components/wearables/WearableDashboard'
import type { WearableDailyMetrics, WearableProvider } from '@sovereign/clinical-core'
import { requireConsumer } from '@/lib/consumer'

export default async function WearableTab() {
  const { supabase, user } = await requireConsumer()

  const [connectionRes, metricsRes] = await Promise.all([
    supabase
      .from('wearable_connections')
      .select('provider, status, last_synced_at, connected_at')
      .eq('user_id', user.id)
      .eq('status', 'connected')
      .order('connected_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('wearable_daily_metrics')
      .select(
        'date, source, resting_hr, avg_hr, hrv_rmssd, spo2, steps, sleep_hours, recovery_score, vo2_max, active_calories',
      )
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30),
  ])

  const connection = connectionRes.data
    ? {
        provider: connectionRes.data.provider as WearableProvider,
        status: connectionRes.data.status as string,
        lastSyncedAt: (connectionRes.data.last_synced_at as string | null) ?? null,
      }
    : null

  const metrics: WearableDailyMetrics[] = (metricsRes.data ?? []).map((row) => ({
    userId: user.id,
    date: row.date as string,
    source: (row.source as WearableDailyMetrics['source']) ?? 'manual',
    restingHr: numOrNull(row.resting_hr),
    avgHr: numOrNull(row.avg_hr),
    hrvRmssd: numOrNull(row.hrv_rmssd),
    spo2: numOrNull(row.spo2),
    steps: numOrNull(row.steps),
    sleepHours: numOrNull(row.sleep_hours),
    recoveryScore: numOrNull(row.recovery_score),
    vo2Max: numOrNull(row.vo2_max),
    activeCalories: numOrNull(row.active_calories),
  }))

  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-gold">Wearable</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Continuous signal feeding the Sovereign AI.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Apple Health, Google Fit, Oura, Whoop, Garmin, Polar, Fitbit, Eight Sleep
          and CGM are normalized into one daily metric shape, then anonymized and
          emitted to the training bus so every reading sharpens your insight engine.
        </p>
      </header>
      <WearableDashboard metrics={metrics} connection={connection} />
    </div>
  )
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
