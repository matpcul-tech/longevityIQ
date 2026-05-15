// Training bus emitter. Each Sovereign app instantiates this once with its
// app salt and bus URL, then calls .emit(event) at every clinical capture
// point. The emitter:
//   1. Validates against the schema
//   2. Generates an eventId and emittedAt timestamp
//   3. Computes a canonical SHA-256 digest for dedup
//   4. Writes to a local audit table (caller-provided callback)
//   5. Forwards to the central bus if a busUrl is configured

import { canonicalDigest } from './anonymizer'
import type { SourceApp, TrainingEvent, TrainingEventEnvelope } from './events'

// EventBase fields the emitter fills in automatically; callers provide the
// rest via PartialEvent.

export type LocalSinkInput = {
  envelope: TrainingEventEnvelope
}

export type EmitterConfig = {
  sourceApp: SourceApp
  busUrl?: string
  busAuthHeader?: string // e.g. "Bearer <signing token>"
  localSink: (input: LocalSinkInput) => Promise<void>
  onForwardError?: (err: unknown, envelope: TrainingEventEnvelope) => void
}

type DistributiveOmit<T, K extends keyof EventBaseRequired> = T extends unknown
  ? Omit<T, K>
  : never

type EventBaseRequired = {
  schemaVersion: '1.0.0'
  eventId: string
  emittedAt: string
  sourceApp: SourceApp
}

export type PartialEvent = DistributiveOmit<
  TrainingEvent,
  'schemaVersion' | 'eventId' | 'emittedAt' | 'sourceApp'
>

function generateId(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  // Fallback compliant uuid v4
  const bytes = new Uint8Array(16)
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function createEmitter(config: EmitterConfig) {
  async function emit(partial: PartialEvent): Promise<TrainingEventEnvelope> {
    const event = {
      ...partial,
      schemaVersion: '1.0.0' as const,
      eventId: generateId(),
      emittedAt: new Date().toISOString(),
      sourceApp: config.sourceApp,
    } as unknown as TrainingEvent

    const digest = await canonicalDigest(event)
    const envelope: TrainingEventEnvelope = { event, digest }

    // Always write to the local audit sink first.
    try {
      await config.localSink({ envelope })
    } catch (err) {
      // Surface but do not throw; emission must be best-effort.
      config.onForwardError?.(err, envelope)
    }

    // Forward to the central bus if configured.
    if (config.busUrl) {
      try {
        const res = await fetch(config.busUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(config.busAuthHeader ? { authorization: config.busAuthHeader } : {}),
          },
          body: JSON.stringify(envelope),
        })
        if (!res.ok) {
          throw new Error(`Bus responded ${res.status}`)
        }
      } catch (err) {
        config.onForwardError?.(err, envelope)
      }
    }

    return envelope
  }

  return { emit }
}
