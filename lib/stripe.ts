import Stripe from 'stripe'

let cached: Stripe | null = null

export function getStripe(): Stripe | null {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  cached = new Stripe(key, { apiVersion: '2025-02-24.acacia' })
  return cached
}

export type TierId = 'free' | 'essential' | 'optimizer' | 'sovereign'

export const TIER_PRICE_ENV: Record<Exclude<TierId, 'free'>, string> = {
  essential: 'STRIPE_PRICE_ESSENTIAL',
  optimizer: 'STRIPE_PRICE_OPTIMIZER',
  sovereign: 'STRIPE_PRICE_SOVEREIGN',
}
