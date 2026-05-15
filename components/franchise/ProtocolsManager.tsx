'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PHASE_1_PROTOCOLS } from '@/lib/protocols'

type Props = {
  locationId: string
  activeServices: string[]
  overrides: Record<string, number>
  canMutate: boolean
}

export default function ProtocolsManager({
  locationId,
  activeServices,
  overrides,
  canMutate,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [draftActive, setDraftActive] = useState<string[]>(activeServices)
  const [draftOverrides, setDraftOverrides] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(overrides).map(([k, v]) => [k, String(v)])),
  )
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function toggle(slug: string) {
    setDraftActive((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
    )
  }

  function setOverride(slug: string, value: string) {
    setDraftOverrides((current) => {
      const next = { ...current }
      if (value.trim() === '') {
        delete next[slug]
      } else {
        next[slug] = value
      }
      return next
    })
  }

  async function save() {
    setError(null)
    setMessage(null)
    const parsedOverrides: Record<string, number> = {}
    for (const [slug, value] of Object.entries(draftOverrides)) {
      const n = Number(value)
      if (!Number.isFinite(n) || n < 0) {
        setError(`Invalid override for ${slug}.`)
        return
      }
      parsedOverrides[slug] = n
    }
    startTransition(async () => {
      const res = await fetch('/api/franchise/location', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          locationId,
          active_services: draftActive,
          pricing_overrides: parsedOverrides,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Could not save protocol mix.')
        return
      }
      setMessage('Protocol mix saved.')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {PHASE_1_PROTOCOLS.map((p) => {
          const active = draftActive.includes(p.slug)
          return (
            <article
              key={p.slug}
              className={`card flex flex-col gap-3 p-5 ${active ? 'border-amber' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="heading-ui text-amber">{p.category}</p>
                  <h3 className="heading-display mt-1 text-xl text-bone">{p.name}</h3>
                  <p className="mt-1 text-xs text-mist">
                    Suggested ${p.priceMin} to ${p.priceMax}
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-mist">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggle(p.slug)}
                    disabled={!canMutate}
                    className="h-4 w-4 accent-amber"
                  />
                  <span className="heading-ui">
                    {active ? 'On' : 'Off'}
                  </span>
                </label>
              </div>
              <label className="block text-xs text-mist">
                <span className="heading-ui">Location price override</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  disabled={!canMutate}
                  value={draftOverrides[p.slug] ?? ''}
                  onChange={(e) => setOverride(p.slug, e.target.value)}
                  placeholder={`Default $${p.priceMin}`}
                  className="input-field mt-2"
                />
              </label>
            </article>
          )
        })}
      </div>

      {error && <p className="text-sm text-amber">{error}</p>}
      {message && <p className="text-sm text-teal">{message}</p>}

      <button
        type="button"
        onClick={save}
        disabled={pending || !canMutate}
        className="btn-gold"
      >
        {pending ? 'Saving' : canMutate ? 'Save Protocol Mix' : 'Demo mode (read-only)'}
      </button>
    </div>
  )
}
