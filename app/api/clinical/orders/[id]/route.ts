import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED = new Set(['pending', 'approved', 'declined', 'completed'])

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  let payload: { status?: string; clinical_notes?: string | null } = {}
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

  const update: Record<string, unknown> = {}
  if (payload.status !== undefined) {
    const status = payload.status.toLowerCase()
    if (!ALLOWED.has(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }
    update.status = status
    if (status === 'completed') {
      update.completed_at = new Date().toISOString()
    }
  }
  if (payload.clinical_notes !== undefined) {
    update.clinical_notes = payload.clinical_notes
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('clinical_orders')
    .update(update)
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
