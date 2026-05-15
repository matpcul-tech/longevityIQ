import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Patch = {
  locationId?: string
  location_name?: string
  address?: string | null
  city?: string | null
  state?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  hours?: Record<string, string>
  active_services?: string[]
  pricing_overrides?: Record<string, number>
}

export async function PATCH(request: Request) {
  let payload: Patch = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { locationId } = payload
  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required.' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const update: Record<string, unknown> = {}
  for (const key of [
    'location_name',
    'address',
    'city',
    'state',
    'contact_email',
    'contact_phone',
    'hours',
    'active_services',
    'pricing_overrides',
  ] as const) {
    if (payload[key] !== undefined) update[key] = payload[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('franchise_locations')
    .update(update)
    .eq('id', locationId)
    .eq('operator_id', auth.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
