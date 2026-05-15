import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Patch = {
  partnerId?: string
  name?: string
  license_type?: string | null
  license_number_masked?: string | null
  state?: string | null
  dea_masked?: string | null
  malpractice_expiry?: string | null
  active_protocols?: Array<{ id: string; name: string; price: number; notes: string }>
  revenue_share_pct?: number
  location_id?: string | null
}

export async function PATCH(request: Request) {
  let payload: Patch = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  if (!payload.partnerId) {
    return NextResponse.json({ error: 'partnerId is required.' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  for (const key of [
    'name',
    'license_type',
    'license_number_masked',
    'state',
    'dea_masked',
    'malpractice_expiry',
    'active_protocols',
    'revenue_share_pct',
    'location_id',
  ] as const) {
    if (payload[key] !== undefined) update[key] = payload[key]
  }

  if (typeof update.revenue_share_pct === 'number') {
    const v = update.revenue_share_pct as number
    if (!Number.isFinite(v) || v < 0 || v > 100) {
      return NextResponse.json(
        { error: 'Revenue share must be between 0 and 100.' },
        { status: 400 },
      )
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('clinical_partners')
    .update(update)
    .eq('id', payload.partnerId)
    .eq('partner_id', auth.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
