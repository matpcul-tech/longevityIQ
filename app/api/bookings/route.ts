import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProtocol } from '@/lib/protocols'

export async function POST(request: Request) {
  let payload: {
    service?: string
    scheduled_for?: string
    location?: string
    notes?: string
  } = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const service = (payload.service ?? '').trim()
  const scheduled = payload.scheduled_for ? new Date(payload.scheduled_for) : null

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

  const { data: profile, error: profileError } = await supabase
    .from('consumer_profiles')
    .select('id')
    .eq('user_id', auth.user.id)
    .single()
  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  let locationId: string | null = null
  if (payload.location) {
    const { data: locRow } = await supabase
      .from('franchise_locations')
      .select('id')
      .eq('location_name', payload.location)
      .maybeSingle()
    locationId = (locRow?.id as string | undefined) ?? null
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      consumer_id: profile.id,
      service,
      scheduled_for: scheduled.toISOString(),
      location: payload.location ?? null,
      location_id: locationId,
      notes: payload.notes ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true, id: data.id })
}
