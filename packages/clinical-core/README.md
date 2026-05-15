# @sovereign/clinical-core

Shared clinical primitives for every Sovereign Healthcare app. One package, one
schema, one training bus, one AI brain.

## Why

The Sovereign thesis is that the same AI gets smarter as every app feeds it
clinical observations. To make that work, every app needs to speak the same
language: identical biomarker definitions, identical wearable shapes,
identical training event envelopes, identical anonymization rules. This
package owns that contract.

## What's in here

- **Forty-six biomarker panel** with longevity-optimization ranges, not just
  standard reference ranges
- **Levine 2018 PhenoAge** calculation from nine validated blood biomarkers
- **Wearable types** normalizing Apple Health, Google Fit, Oura, Whoop,
  Garmin, Polar, Fitbit, Eight Sleep and CGM into one daily metric shape
- **Training event schema v1** covering biomarker panels, wearable streams,
  protocol bookings, clinical orders, AI insights, lifestyle scores and tier
  changes
- **Anonymizer** that strips PII, scrubs free text, and hashes subject ids
  with a per-app salt so no email, phone, address or DEA leaves an app
- **Emitter** that validates, digests, audits locally and forwards to the
  central training bus

## Consumers

- `sovereign-shield` (existing healthcare OS)
- `longevityiq` (longevity spa OS)
- Future Sovereign apps

## Install

In a sibling app:

```
npm install file:../path/to/sovereign-monorepo/packages/clinical-core
```

Or pack and distribute:

```
cd packages/clinical-core && npm pack
# produces sovereign-clinical-core-0.1.0.tgz
```

## Usage

```ts
import {
  PANEL,
  computePhenoAge,
  createEmitter,
  ageToBand,
  hashSubject,
} from '@sovereign/clinical-core'

const emitter = createEmitter({
  sourceApp: 'longevityiq',
  busUrl: process.env.SOVEREIGN_TRAINING_BUS_URL,
  busAuthHeader: `Bearer ${process.env.SOVEREIGN_TRAINING_BUS_TOKEN}`,
  localSink: async ({ envelope }) => {
    await supabase.from('training_events').insert({
      event_id: envelope.event.eventId,
      payload: envelope.event,
      digest: envelope.digest,
    })
  },
})
```

## Schema discipline

1. Never widen `EventBase` per-app. Add a new event variant instead.
2. Never emit raw email, phone, address, license, DEA or precise DOB.
3. Always hash subject ids through `hashSubject(userId, { appSalt })`.
4. Always scrub free text through `scrubText(input)`.
5. Bump `TRAINING_EVENT_VERSION` for any breaking change.
