import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED = new Set(['requested', 'confirmed', 'completed', 'cancelled'])

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  let payload: { status?: string } = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const status = (payload.status ?? '').toLowerCase()
  if (!ALLOWED.has(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
