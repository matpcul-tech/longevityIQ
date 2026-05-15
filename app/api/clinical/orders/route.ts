import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { maskPatient } from '@/lib/clinical'

type Payload = {
  partnerId?: string
  protocol?: string
  patient_id_masked?: string
  revenue?: number
  clinical_notes?: string | null
}

export async function POST(request: Request) {
  let payload: Payload = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!payload.partnerId || !payload.protocol) {
    return NextResponse.json(
      { error: 'partnerId and protocol are required.' },
      { status: 400 },
    )
  }

  const revenue = Number(payload.revenue ?? 0)
  if (!Number.isFinite(revenue) || revenue < 0) {
    return NextResponse.json({ error: 'Revenue must be a non-negative number.' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { data: partner } = await supabase
    .from('clinical_partners')
    .select('id, revenue_share_pct')
    .eq('id', payload.partnerId)
    .eq('partner_id', auth.user.id)
    .maybeSingle()

  if (!partner) {
    return NextResponse.json({ error: 'Clinical partner not found.' }, { status: 404 })
  }

  const sharePct = Number(partner.revenue_share_pct ?? 35) / 100
  const partnerShare = Math.round(revenue * sharePct * 100) / 100

  const { data, error } = await supabase
    .from('clinical_orders')
    .insert({
      partner_id: partner.id,
      patient_id_masked: payload.patient_id_masked?.trim() || maskPatient(),
      protocol: payload.protocol,
      status: 'pending',
      ordered_at: new Date().toISOString(),
      revenue,
      partner_share: partnerShare,
      clinical_notes: payload.clinical_notes ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true, id: data.id })
}
