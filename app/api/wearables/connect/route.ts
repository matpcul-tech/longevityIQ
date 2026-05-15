import { NextResponse } from 'next/server'
import { WEARABLE_PROVIDERS, type WearableProvider } from '@sovereign/clinical-core'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  let payload: { provider?: string } = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const provider = (payload.provider ?? '').toLowerCase() as WearableProvider
  if (!WEARABLE_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: 'Unknown provider.' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Mark any other connections disconnected.
  await supabase
    .from('wearable_connections')
    .update({ status: 'disconnected' })
    .eq('user_id', auth.user.id)

  const { error } = await supabase
    .from('wearable_connections')
    .upsert(
      {
        user_id: auth.user.id,
        provider,
        status: 'connected',
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' },
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // In production, redirect to Terra widget here:
  //   const terraSession = await terra.generateWidgetSession({ ... })
  //   return NextResponse.json({ redirectTo: terraSession.url })
  return NextResponse.json({ ok: true, provider })
}

export async function DELETE() {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  await supabase
    .from('wearable_connections')
    .update({ status: 'disconnected' })
    .eq('user_id', auth.user.id)

  return NextResponse.json({ ok: true })
}
