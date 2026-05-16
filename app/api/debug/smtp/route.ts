// Debug-only endpoint to inspect why magic-link sends are failing.
//
// Usage:
//   GET /api/debug/smtp?email=you@example.com
//   Header: x-debug-token: <SOVEREIGN_DEBUG_TOKEN>
//
// Returns the full underlying Supabase error verbatim so you can see what
// the SMTP failure is without needing access to Supabase Auth logs.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured, missingSupabaseKeys } from '@/lib/supabase/config'

export async function GET(request: Request) {
  const token = request.headers.get('x-debug-token')
  const expected = process.env.SOVEREIGN_DEBUG_TOKEN
  if (!expected) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'Debug endpoint disabled. Set SOVEREIGN_DEBUG_TOKEN in Vercel env to enable.',
      },
      { status: 503 },
    )
  }
  if (token !== expected) {
    return NextResponse.json(
      { ok: false, reason: 'Invalid x-debug-token header.' },
      { status: 401 },
    )
  }

  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  if (!email) {
    return NextResponse.json(
      { ok: false, reason: 'Pass ?email=you@example.com' },
      { status: 400 },
    )
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: false,
      step: 'configuration',
      missing: missingSupabaseKeys(),
    })
  }

  const supabase = createClient()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  const redirectTo = `${siteUrl}/auth/callback?next=/consumer/dashboard`

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
  })

  return NextResponse.json({
    ok: !error,
    step: 'signInWithOtp',
    redirectTo,
    siteUrlEnv: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    data,
    error: error
      ? {
          message: error.message,
          status: (error as { status?: number }).status ?? null,
          name: error.name,
          code: (error as { code?: string }).code ?? null,
        }
      : null,
  })
}
