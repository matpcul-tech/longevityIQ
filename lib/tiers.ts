import type { TierId } from './stripe'

export type Tier = {
  id: TierId
  name: string
  priceMonthly: number
  sessionsIncluded: number | 'unlimited'
  discountPct: number
  features: string[]
}

export const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Discover',
    priceMonthly: 0,
    sessionsIncluded: 0,
    discountPct: 0,
    features: [
      'Bio age assessment',
      'Browse Phase 1 protocols',
      'One starter insight per week',
    ],
  },
  {
    id: 'essential',
    name: 'Essential',
    priceMonthly: 99,
    sessionsIncluded: 4,
    discountPct: 10,
    features: [
      'Four sessions per month',
      'Ten percent off additional protocols',
      'Daily insight cadence',
    ],
  },
  {
    id: 'optimizer',
    name: 'Optimizer',
    priceMonthly: 179,
    sessionsIncluded: 8,
    discountPct: 15,
    features: [
      'Eight sessions per month',
      'Fifteen percent off additional protocols',
      'Wearable sync and full daily insights',
    ],
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    priceMonthly: 299,
    sessionsIncluded: 'unlimited',
    discountPct: 20,
    features: [
      'Unlimited sessions',
      'Concierge coaching sessions',
      'Clinical priority queue',
      'AILT leadership score and quarterly review',
    ],
  },
]

export function getTier(id: TierId | string | null | undefined): Tier {
  const match = TIERS.find((t) => t.id === id)
  return match ?? TIERS[0]
}
