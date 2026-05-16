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

  // Normalize NEXT_PUBLIC_SITE_URL to just an origin even if it was
  // misconfigured with a path appended (e.g. /auth/callback). Strips trailing
  // slashes and any path component so the redirect URL is built correctly.
  const rawSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  let siteUrl: string
  try {
    const parsed = new URL(rawSiteUrl)
    siteUrl = `${parsed.protocol}//${parsed.host}`
  } catch {
    siteUrl = new URL(request.url).origin
  }
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
