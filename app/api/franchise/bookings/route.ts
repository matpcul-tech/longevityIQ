import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProtocol } from '@/lib/protocols'

export async function POST(request: Request) {
  let payload: {
    locationId?: string
    service?: string
    scheduled_for?: string
    notes?: string | null
  } = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { locationId, service } = payload
  const scheduled = payload.scheduled_for ? new Date(payload.scheduled_for) : null

  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required.' }, { status: 400 })
  }
  if (!service || !getProtocol(service)) {
    return NextResponse.json({ error: 'Unknown protocol.' }, { status: 400 })
  }
  if (!scheduled || Number.isNaN(scheduled.getTime())) {
    return NextResponse.json({ error: 'A valid date and time is required.' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Confirm the operator owns this location.
  const { data: loc } = await supabase
    .from('franchise_locations')
    .select('id, location_name')
    .eq('id', locationId)
    .eq('operator_id', auth.user.id)
    .maybeSingle()

  if (!loc) {
    return NextResponse.json({ error: 'Location not found.' }, { status: 404 })
  }

  // Walk-ins are not tied to a consumer profile, so we mark them with a synthetic consumer record per operator.
  const { data: walkInConsumer } = await supabase
    .from('consumer_profiles')
    .select('id')
    .eq('email', `walkin+${auth.user.id}@longevityiq.local`)
    .maybeSingle()

  let consumerId = walkInConsumer?.id as string | undefined
  if (!consumerId) {
    const { data: created, error: createErr } = await supabase
      .from('consumer_profiles')
      .insert({
        user_id: auth.user.id,
        email: `walkin+${auth.user.id}@longevityiq.local`,
        full_name: 'Walk-In Pool',
      })
      .select('id')
      .single()
    if (createErr || !created) {
      return NextResponse.json(
        { error: createErr?.message ?? 'Could not initialize walk-in pool.' },
        { status: 400 },
      )
    }
    consumerId = created.id as string
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      consumer_id: consumerId,
      location_id: loc.id,
      location: loc.location_name,
      service,
      scheduled_for: scheduled.toISOString(),
      status: 'confirmed',
      notes: payload.notes ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true, id: data.id })
}
