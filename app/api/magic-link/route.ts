import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_PORTALS = new Set(['consumer', 'franchise', 'clinical'])

export async function POST(request: Request) {
  let payload: { email?: string; portal?: string } = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const email = (payload.email ?? '').trim().toLowerCase()
  const portal = (payload.portal ?? 'consumer').toLowerCase()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }
  if (!VALID_PORTALS.has(portal)) {
    return NextResponse.json({ error: 'Unknown portal.' }, { status: 400 })
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  const redirectTo = `${siteUrl}/auth/callback?next=/${portal}/dashboard`

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, portal })
}
