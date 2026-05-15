// Wearable contract shared across every Sovereign app. Each source app maps
// its provider integration (Terra, Vital, Apple HealthKit Shortcut, direct
// OAuth) into this normalized daily summary before persisting.

export const WEARABLE_PROVIDERS = [
  'apple_health',
  'google_fit',
  'oura',
  'whoop',
  'garmin',
  'polar',
  'fitbit',
  'eight_sleep',
  'continuous_glucose',
] as const

export type WearableProvider = (typeof WEARABLE_PROVIDERS)[number]

export type ConnectionStatus = 'connected' | 'disconnected' | 'error'

export type WearableConnection = {
  userId: string
  provider: WearableProvider
  providerUserId: string | null
  status: ConnectionStatus
  lastSyncedAt: string | null
  connectedAt: string
}

export type WearableDailyMetrics = {
  userId: string
  date: string // ISO date
  source: WearableProvider | 'manual' | 'simulator'
  restingHr: number | null
  avgHr: number | null
  hrvRmssd: number | null
  spo2: number | null
  steps: number | null
  sleepHours: number | null
  recoveryScore: number | null
  vo2Max: number | null
  activeCalories: number | null
}

export function emptyDaily(
  userId: string,
  date: string,
  source: WearableDailyMetrics['source'] = 'manual',
): WearableDailyMetrics {
  return {
    userId,
    date,
    source,
    restingHr: null,
    avgHr: null,
    hrvRmssd: null,
    spo2: null,
    steps: null,
    sleepHours: null,
    recoveryScore: null,
    vo2Max: null,
    activeCalories: null,
  }
}
