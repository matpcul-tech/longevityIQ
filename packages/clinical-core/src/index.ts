export * as biomarkers from './biomarkers'
export * as wearables from './wearables'
export * as training from './training'
export * as units from './units'

export {
  PANEL,
  PANEL_COUNT,
  panelBySlug,
  categorize,
  categoryLabel,
  statusFor,
} from './biomarkers/panel'
export type {
  BiomarkerCategory,
  BiomarkerSpec,
  PhenoAgeInputs,
} from './biomarkers/panel'
export { computePhenoAge, phenoAgeBreakdown } from './biomarkers/phenoage'
export type { PhenoAgeBreakdown } from './biomarkers/phenoage'

export { WEARABLE_PROVIDERS, emptyDaily } from './wearables/types'
export type {
  WearableProvider,
  ConnectionStatus,
  WearableConnection,
  WearableDailyMetrics,
} from './wearables/types'

export {
  TRAINING_EVENT_VERSION,
  SOURCE_APPS,
} from './training/events'
export type {
  SourceApp,
  AgeBand,
  Sex,
  EventBase,
  BiomarkerPanelEvent,
  WearableDailyEvent,
  ProtocolEvent,
  ClinicalOrderEvent,
  InsightEvent,
  LifestyleScoreEvent,
  TierChangeEvent,
  TrainingEvent,
  TrainingEventEnvelope,
} from './training/events'
export {
  ageToBand,
  normalizeSex,
  scrubText,
  hashSubject,
  canonicalDigest,
} from './training/anonymizer'
export type { AnonymizerConfig } from './training/anonymizer'
export {
  createEmitter,
} from './training/emitter'
export type {
  EmitterConfig,
  PartialEvent,
  LocalSinkInput,
} from './training/emitter'
