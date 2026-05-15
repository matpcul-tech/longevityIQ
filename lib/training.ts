// LongevityIQ wiring for the Sovereign Healthcare training bus.
// Every clinical capture point (panel saved, wearable synced, protocol
// completed, insight generated) calls emitTraining(...) once.

import {
  createEmitter,
  hashSubject,
  type AnonymizerConfig,
  type PartialEvent,
  type TrainingEventEnvelope,
} from '@sovereign/clinical-core'
import { createServiceClient } from '@/lib/supabase/server'

const SOURCE_APP = 'longevityiq' as const

function getSalt(): AnonymizerConfig {
  const salt = process.env.SOVEREIGN_APP_SALT
  if (!salt) {
    throw new Error(
      'SOVEREIGN_APP_SALT must be set. Generate with: openssl rand -hex 32',
    )
  }
  return { appSalt: salt }
}

async function localSink({ envelope }: { envelope: TrainingEventEnvelope }) {
  const supabase = createServiceClient()
  await supabase.from('training_events').insert({
    event_id: envelope.event.eventId,
    event_type: envelope.event.type,
    source_app: envelope.event.sourceApp,
    subject_hash: envelope.event.subjectHash,
    digest: envelope.digest,
    payload: envelope.event,
  })
}

const emitter = createEmitter({
  sourceApp: SOURCE_APP,
  busUrl: process.env.SOVEREIGN_TRAINING_BUS_URL,
  busAuthHeader: process.env.SOVEREIGN_TRAINING_BUS_TOKEN
    ? `Bearer ${process.env.SOVEREIGN_TRAINING_BUS_TOKEN}`
    : undefined,
  localSink,
  onForwardError: async (err, envelope) => {
    // Record the error against the audit row for later replay.
    try {
      const supabase = createServiceClient()
      await supabase
        .from('training_events')
        .update({
          forward_error: err instanceof Error ? err.message : String(err),
        })
        .eq('event_id', envelope.event.eventId)
    } catch {
      // Swallow; emission is best-effort.
    }
  },
})

export async function emitTraining(partial: PartialEvent) {
  try {
    return await emitter.emit(partial)
  } catch (err) {
    console.error('[training] emit failed', err)
    return null
  }
}

export async function hashUserId(userId: string) {
  return hashSubject(userId, getSalt())
}

export { SOURCE_APP }
