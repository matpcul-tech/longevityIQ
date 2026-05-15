'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TIERS, type Tier } from '@/lib/tiers'
import type { TierId } from '@/lib/stripe'

type Props = {
  currentTier: TierId
}

export default function MembershipPanel({ currentTier }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState<TierId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function upgrade(tier: Tier) {
    if (tier.id === currentTier) return
    setPending(tier.id)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', tier: tier.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error ?? 'Could not start checkout.')
      }
      if (body.checkoutUrl) {
        window.location.href = body.checkoutUrl
        return
      }
      if (body.simulated) {
        setMessage(
          `Stripe checkout is not configured yet. Your ${tier.name} tier was applied for preview.`
        )
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6">
      {(error || message) && (
        <div className="card p-4 text-sm">
          {error && <p className="text-amber">{error}</p>}
          {message && <p className="text-bone">{message}</p>}
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((tier) => {
          const isCurrent = tier.id === currentTier
          return (
            <article
              key={tier.id}
              className={`card flex h-full flex-col p-6 ${
                isCurrent ? 'border-gold shadow-gilt' : ''
              }`}
            >
              <p className="heading-ui text-gold">{tier.name}</p>
              <p className="heading-display mt-3 text-4xl text-bone">
                {tier.priceMonthly === 0 ? 'Free' : `$${tier.priceMonthly}`}
                {tier.priceMonthly > 0 && (
                  <span className="ml-1 text-sm text-mist">/ month</span>
                )}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-bone">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-gold">&middot;</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                {isCurrent ? (
                  <p className="heading-ui text-gold">Current Tier</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => upgrade(tier)}
                    disabled={pending !== null}
                    className={tier.id === 'free' ? 'btn-ghost w-full' : 'btn-gold w-full'}
                  >
                    {pending === tier.id ? 'Starting' : tier.id === 'free' ? 'Downgrade' : 'Upgrade'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
