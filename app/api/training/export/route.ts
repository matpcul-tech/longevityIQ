// Training data export. Streams the local training_events table as JSON Lines
// (one event per line) for ingestion into the Sovereign AI pipeline.
//
// Auth: requires SOVEREIGN_TRAINING_EXPORT_TOKEN header. This is meant to be
// hit by a server-to-server cron (Sovereign training bus puller) not the UI.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const required = process.env.SOVEREIGN_TRAINING_EXPORT_TOKEN
  if (!required) {
    return NextResponse.json({ error: 'Export not configured.' }, { status: 503 })
  }
  const auth = request.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${required}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const since = url.searchParams.get('since')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 1000), 5000)
  const eventType = url.searchParams.get('type')

  const supabase = createServiceClient()
  let query = supabase
    .from('training_events')
    .select('event_id, event_type, source_app, subject_hash, digest, payload, created_at')
    .order('created_at', { ascending: true })
    .limit(limit)
  if (since) query = query.gt('created_at', since)
  if (eventType) query = query.eq('event_type', eventType)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const lines = (data ?? []).map((row) =>
    JSON.stringify({
      event_id: row.event_id,
      event_type: row.event_type,
      source_app: row.source_app,
      subject_hash: row.subject_hash,
      digest: row.digest,
      created_at: row.created_at,
      payload: row.payload,
    }),
  )
  const body = lines.join('\n') + (lines.length > 0 ? '\n' : '')

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/x-ndjson',
      'x-event-count': String(lines.length),
    },
  })
}
