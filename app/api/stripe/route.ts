import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, TIER_PRICE_ENV, type TierId } from '@/lib/stripe'

const VALID_TIERS: TierId[] = ['free', 'essential', 'optimizer', 'sovereign']

export async function POST(request: Request) {
  let payload: { action?: string; tier?: TierId } = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const action = payload.action ?? 'checkout'
  const tier = payload.tier

  if (action !== 'checkout' || !tier || !VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: 'Unknown action or tier.' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Downgrade to free is a simple profile update.
  if (tier === 'free') {
    await supabase
      .from('consumer_profiles')
      .update({ tier: 'free', updated_at: new Date().toISOString() })
      .eq('user_id', auth.user.id)
    return NextResponse.json({ ok: true, simulated: true, tier })
  }

  const stripe = getStripe()
  const priceEnv = TIER_PRICE_ENV[tier]
  const priceId = priceEnv ? process.env[priceEnv] : undefined

  if (!stripe || !priceId) {
    // Stripe not configured. Apply tier immediately for preview environments.
    await supabase
      .from('consumer_profiles')
      .update({ tier, updated_at: new Date().toISOString() })
      .eq('user_id', auth.user.id)
    return NextResponse.json({ ok: true, simulated: true, tier })
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: auth.user.email ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/consumer/dashboard/membership?status=success`,
    cancel_url: `${origin}/consumer/dashboard/membership?status=cancelled`,
    metadata: { tier, user_id: auth.user.id },
  })

  return NextResponse.json({ ok: true, checkoutUrl: session.url })
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Stripe webhook endpoint placeholder.' })
}
