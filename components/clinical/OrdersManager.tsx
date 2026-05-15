'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export type ClinicalOrder = {
  id: string
  patient_id_masked: string
  protocol: string
  status: 'pending' | 'approved' | 'declined' | 'completed'
  ordered_at: string
  completed_at: string | null
  revenue: number
  partner_share: number
  clinical_notes: string | null
}

type Props = {
  orders: ClinicalOrder[]
  partnerId: string
  catalogNames: string[]
}

function currency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function OrdersManager({ orders, partnerId, catalogNames }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [intakeOpen, setIntakeOpen] = useState(false)

  function setNote(id: string, value: string) {
    setNotesDraft((d) => ({ ...d, [id]: value }))
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/clinical/orders/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Could not update order.')
        return
      }
      router.refresh()
    })
  }

  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const inFlight = orders.filter((o) => o.status === 'approved')
  const recent = orders.filter((o) => o.status === 'completed' || o.status === 'declined')

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mist">
          {pendingOrders.length} pending · {inFlight.length} approved · {recent.length}{' '}
          recent
        </p>
        <button type="button" onClick={() => setIntakeOpen(true)} className="btn-gold">
          New Intake Order
        </button>
      </div>

      {error && <p className="text-sm text-amber">{error}</p>}

      <Section title="Pending Orders" tone="amber">
        {pendingOrders.length === 0 ? (
          <p className="text-sm text-mist">No orders awaiting your review.</p>
        ) : (
          <ul className="space-y-4">
            {pendingOrders.map((o) => (
              <li key={o.id} className="card p-5">
                <OrderHeader order={o} />
                <textarea
                  className="input-field mt-4 min-h-[80px] text-sm"
                  placeholder="Clinical notes (required to approve high-acuity orders)"
                  value={notesDraft[o.id] ?? o.clinical_notes ?? ''}
                  onChange={(e) => setNote(o.id, e.target.value)}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      patch(o.id, {
                        status: 'approved',
                        clinical_notes: notesDraft[o.id] ?? o.clinical_notes ?? null,
                      })
                    }
                    disabled={pending}
                    className="btn-gold"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patch(o.id, {
                        status: 'declined',
                        clinical_notes: notesDraft[o.id] ?? o.clinical_notes ?? null,
                      })
                    }
                    disabled={pending}
                    className="btn-ghost"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Approved · Awaiting Completion" tone="teal">
        {inFlight.length === 0 ? (
          <p className="text-sm text-mist">No active orders.</p>
        ) : (
          <ul className="space-y-4">
            {inFlight.map((o) => (
              <li key={o.id} className="card p-5">
                <OrderHeader order={o} />
                {o.clinical_notes && (
                  <p className="mt-3 text-xs text-mist">Note: {o.clinical_notes}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => patch(o.id, { status: 'completed' })}
                    disabled={pending}
                    className="btn-gold"
                  >
                    Mark Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => patch(o.id, { status: 'declined' })}
                    disabled={pending}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Recent" tone="gold">
        {recent.length === 0 ? (
          <p className="text-sm text-mist">History will appear here.</p>
        ) : (
          <ul className="space-y-3">
            {recent.slice(0, 10).map((o) => (
              <li key={o.id} className="card p-4 text-sm">
                <OrderHeader order={o} compact />
                {o.clinical_notes && (
                  <p className="mt-2 text-xs text-mist">Note: {o.clinical_notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {intakeOpen && (
        <IntakeModal
          partnerId={partnerId}
          catalogNames={catalogNames}
          onClose={() => setIntakeOpen(false)}
          onCreated={() => {
            setIntakeOpen(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function Section({
  title,
  tone,
  children,
}: {
  title: string
  tone: 'gold' | 'amber' | 'teal'
  children: React.ReactNode
}) {
  const cls = tone === 'gold' ? 'text-gold' : tone === 'amber' ? 'text-amber' : 'text-teal'
  return (
    <section>
      <p className={`heading-ui ${cls}`}>{title}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function OrderHeader({
  order,
  compact,
}: {
  order: ClinicalOrder
  compact?: boolean
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p className={compact ? 'heading-display text-lg text-bone' : 'heading-display text-xl text-bone'}>
          {order.protocol}
        </p>
        <p className="text-xs text-mist">
          Patient {order.patient_id_masked} · Ordered {fmt(order.ordered_at)}
          {order.completed_at ? ` · Completed ${fmt(order.completed_at)}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-mist">{currency(order.revenue)} gross</span>
        <span className="heading-ui text-teal">{currency(order.partner_share)} share</span>
        <span className="heading-ui rounded-full border border-edge px-3 py-1 text-mist">
          {order.status}
        </span>
      </div>
    </div>
  )
}

function IntakeModal({
  partnerId,
  catalogNames,
  onClose,
  onCreated,
}: {
  partnerId: string
  catalogNames: string[]
  onClose: () => void
  onCreated: () => void
}) {
  const [protocol, setProtocol] = useState(catalogNames[0] ?? '')
  const [patientId, setPatientId] = useState('')
  const [revenue, setRevenue] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/clinical/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          protocol,
          patient_id_masked: patientId || undefined,
          revenue: typeof revenue === 'number' ? revenue : 0,
          clinical_notes: notes,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Could not create order.')
      }
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 px-4">
      <div className="card relative w-full max-w-md p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-mist hover:text-teal"
          aria-label="Close"
        >
          x
        </button>
        <p className="heading-ui text-teal">New Intake</p>
        <h3 className="heading-display mt-2 text-2xl font-light text-bone">
          Add a clinical order.
        </h3>
        <form onSubmit={submit} className="mt-6 space-y-4 text-sm">
          <label className="block">
            <span className="heading-ui text-mist">Protocol</span>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="input-field mt-2"
              required
            >
              {catalogNames.length === 0 ? (
                <option value="">Add a protocol catalog first</option>
              ) : (
                catalogNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block">
            <span className="heading-ui text-mist">Patient ID (optional)</span>
            <input
              type="text"
              className="input-field mt-2"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Auto-generate if blank"
            />
          </label>
          <label className="block">
            <span className="heading-ui text-mist">Gross revenue USD</span>
            <input
              type="number"
              min={0}
              className="input-field mt-2"
              value={revenue}
              onChange={(e) =>
                setRevenue(e.target.value === '' ? '' : Number(e.target.value))
              }
              required
            />
          </label>
          <label className="block">
            <span className="heading-ui text-mist">Clinical notes</span>
            <textarea
              className="input-field mt-2 min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          {error && <p className="text-amber">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-gold w-full">
            {submitting ? 'Saving' : 'Create Order'}
          </button>
        </form>
      </div>
    </div>
  )
}
