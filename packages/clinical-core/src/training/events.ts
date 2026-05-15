// Sovereign Healthcare Training Event Schema (v1).
//
// Every app in the Sovereign portfolio (Sovereign Shield, LongevityIQ, future
// products) emits these events to a shared training bus. The same Anthropic-
// backed AI is grounded in the union of every event ever emitted, scoped per
// user via a stable hashed subject id so no PII leaves an app boundary.
//
// Discipline: never emit raw email, phone, name, address, license number,
// DEA, or precise date of birth. Use age bands, hashed subject ids, and the
// already-masked patient ids. The anonymizer in `./anonymizer` enforces this.

export const TRAINING_EVENT_VERSION = '1.0.0'

export const SOURCE_APPS = [
  'sovereign_shield',
  'longevityiq',
  'sovereign_clinical',
  'sovereign_unknown',
] as const

export type SourceApp = (typeof SOURCE_APPS)[number]

export type AgeBand =
  | 'under_25'
  | '25_34'
  | '35_44'
  | '45_54'
  | '55_64'
  | '65_74'
  | '75_plus'

export type Sex = 'm' | 'f' | 'other' | 'unknown'

export type EventBase = {
  schemaVersion: typeof TRAINING_EVENT_VERSION
  eventId: string // uuid, generated on emit
  emittedAt: string // ISO timestamp
  sourceApp: SourceApp
  subjectHash: string // stable hash of user_id (consumer) or partner_id
  ageBand: AgeBand
  sex: Sex
  tier?: 'free' | 'essential' | 'optimizer' | 'sovereign'
}

export type BiomarkerPanelEvent = EventBase & {
  type: 'biomarker_panel_recorded'
  panel: {
    drawnAt: string
    phenoAge: number | null
    chronologicalAge: number
    phenoAgeDelta: number | null
    markers: Array<{
      slug: string
      value: number | null
      unit: string
      status: 'low' | 'optimal' | 'normal' | 'high' | 'critical' | null
    }>
  }
}

export type WearableDailyEvent = EventBase & {
  type: 'wearable_daily_metrics'
  date: string
  provider: string
  metrics: {
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
}

export type ProtocolEvent = EventBase & {
  type: 'protocol_event'
  stage: 'requested' | 'confirmed' | 'completed' | 'cancelled'
  protocolSlug: string
  protocolName: string
  locationCity: string | null // city only, no street
  durationMinutes: number | null
  priceTier: 'low' | 'mid' | 'high' | 'clinical'
  outcomeScore: number | null // 0 to 10, post-session client rating
  outcomeNotes: string | null // already anonymized free text
}

export type ClinicalOrderEvent = EventBase & {
  type: 'clinical_order_event'
  stage: 'pending' | 'approved' | 'declined' | 'completed'
  protocolName: string
  revenueBand: 'sub_300' | '300_750' | '750_1500' | 'over_1500'
  partnerStatePrior: string | null // two-letter state code
  patientCohortHash: string // hashed patient_id_masked
}

export type InsightEvent = EventBase & {
  type: 'ai_insight_generated'
  modelId: string
  promptDigest: string // sha256 of system+user prompts; for retrieval
  insightSummary: string // <= 240 chars, already anonymized
  contextSignals: {
    hasBiomarkerPanel: boolean
    hasWearableSync: boolean
    bioAgeDelta: number | null
    daysOnPlatform: number
  }
  userResponse?: 'positive' | 'neutral' | 'negative' | null
}

export type LifestyleScoreEvent = EventBase & {
  type: 'lifestyle_score_recorded'
  vitalityScore: number
  domainScores: {
    sleep: number
    cardio: number
    strength: number
    nutrition: number
    stress: number
  }
}

export type TierChangeEvent = EventBase & {
  type: 'membership_tier_change'
  fromTier: 'free' | 'essential' | 'optimizer' | 'sovereign'
  toTier: 'free' | 'essential' | 'optimizer' | 'sovereign'
  daysOnPriorTier: number
}

export type TrainingEvent =
  | BiomarkerPanelEvent
  | WearableDailyEvent
  | ProtocolEvent
  | ClinicalOrderEvent
  | InsightEvent
  | LifestyleScoreEvent
  | TierChangeEvent

export type TrainingEventEnvelope = {
  event: TrainingEvent
  digest: string // sha256 of canonical JSON; used for dedup on the bus
}
