'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ClinicalProtocol } from '@/lib/clinical'

type Draft = ClinicalProtocol & { _key: string }

type Props = {
  partnerId: string
  initial: ClinicalProtocol[]
}

function makeKey() {
  return `p-${Math.random().toString(36).slice(2, 10)}`
}

export default function ProtocolsEditor({ partnerId, initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [items, setItems] = useState<Draft[]>(() =>
    initial.map((p) => ({ ...p, _key: makeKey() })),
  )
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function update(key: string, patch: Partial<ClinicalProtocol>) {
    setItems((current) =>
      current.map((p) => (p._key === key ? { ...p, ...patch } : p)),
    )
  }

  function remove(key: string) {
    setItems((current) => current.filter((p) => p._key !== key))
  }

  function add() {
    setItems((current) => [
      ...current,
      { _key: makeKey(), id: `protocol-${current.length + 1}`, name: '', price: 0, notes: '' },
    ])
  }

  async function save() {
    setError(null)
    setMessage(null)
    for (const item of items) {
      if (!item.id.trim() || !item.name.trim()) {
        setError('Each protocol needs an id and name.')
        return
      }
      if (!Number.isFinite(item.price) || item.price < 0) {
        setError(`Price for ${item.name || item.id} must be a non-negative number.`)
        return
      }
    }
    const payload = items.map(({ _key, ...rest }) => rest)
    startTransition(async () => {
      const res = await fetch('/api/clinical/partner', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ partnerId, active_protocols: payload }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Could not save protocols.')
        return
      }
      setMessage('Protocol catalog updated.')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {items.length === 0 && (
          <p className="card p-6 text-sm text-mist">
            No protocols yet. Add the clinical services you currently offer to begin
            accepting orders.
          </p>
        )}
        {items.map((p) => (
          <article key={p._key} className="card grid gap-3 p-5 md:grid-cols-2">
            <label className="block text-sm">
              <span className="heading-ui text-mist">Identifier</span>
              <input
                className="input-field mt-2"
                value={p.id}
                onChange={(e) => update(p._key, { id: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="heading-ui text-mist">Name</span>
              <input
                className="input-field mt-2"
                value={p.name}
                onChange={(e) => update(p._key, { name: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="heading-ui text-mist">Price USD</span>
              <input
                type="number"
                min={0}
                className="input-field mt-2"
                value={p.price}
                onChange={(e) =>
                  update(p._key, { price: Number(e.target.value) })
                }
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="heading-ui text-mist">Clinical notes</span>
              <textarea
                className="input-field mt-2 min-h-[80px]"
                value={p.notes}
                onChange={(e) => update(p._key, { notes: e.target.value })}
                placeholder="Default dose, contraindications, monitoring."
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => remove(p._key)}
                className="btn-ghost"
              >
                Remove Protocol
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={add} className="btn-ghost">
          Add Protocol
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn-gold"
        >
          {pending ? 'Saving' : 'Save Protocol Catalog'}
        </button>
      </div>

      {error && <p className="text-sm text-amber">{error}</p>}
      {message && <p className="text-sm text-teal">{message}</p>}
    </div>
  )
}
