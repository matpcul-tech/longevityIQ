'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PHASE_1_PROTOCOLS } from '@/lib/protocols'

export type FranchiseBooking = {
  id: string
  service: string
  scheduled_for: string
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled'
  notes: string | null
  member: string
}

type Props = {
  bookings: FranchiseBooking[]
  locationId: string
  canMutate: boolean
}

function protocolName(slug: string) {
  return PHASE_1_PROTOCOLS.find((p) => p.slug === slug)?.name ?? slug
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export default function BookingsManager({ bookings, locationId, canMutate }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [walkInOpen, setWalkInOpen] = useState(false)

  const grouped = groupByDay(bookings)

  async function changeStatus(id: string, status: FranchiseBooking['status']) {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/franchise/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Could not update booking.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mist">
          {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} on the calendar.
        </p>
        {canMutate && (
          <button
            type="button"
            onClick={() => setWalkInOpen(true)}
            className="btn-gold"
          >
            Add Walk-In
          </button>
        )}
      </div>

      {error && <p className="text-sm text-amber">{error}</p>}

      {Object.keys(grouped).length === 0 ? (
        <div className="card p-8 text-sm text-mist">
          No upcoming bookings. Walk-ins added here will sync to the consumer record.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, items]) => (
            <section key={day} className="card p-6">
              <p className="heading-ui text-amber">{day}</p>
              <ul className="mt-4 divide-y divide-edge">
                {items.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="heading-display text-xl text-bone">
                        {protocolName(b.service)}
                      </p>
                      <p className="text-xs text-mist">
                        {fmtFull(b.scheduled_for)} · {b.member}
                      </p>
                      {b.notes && <p className="mt-1 text-xs text-mist">Note: {b.notes}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={b.status} />
                      {canMutate && b.status !== 'completed' && b.status !== 'cancelled' && (
                        <>
                          {b.status !== 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => changeStatus(b.id, 'confirmed')}
                              disabled={pending}
                              className="btn-ghost"
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => changeStatus(b.id, 'completed')}
                            disabled={pending}
                            className="btn-ghost"
                          >
                            Mark Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => changeStatus(b.id, 'cancelled')}
                            disabled={pending}
                            className="btn-ghost"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {walkInOpen && (
        <WalkInModal
          locationId={locationId}
          onClose={() => setWalkInOpen(false)}
          onCreated={() => {
            setWalkInOpen(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: FranchiseBooking['status'] }) {
  const tone =
    status === 'confirmed'
      ? 'text-teal border-teal/40'
      : status === 'completed'
        ? 'text-gold border-gold/40'
        : status === 'cancelled'
          ? 'text-amber border-amber/40'
          : 'text-mist border-edge'
  return (
    <span className={`heading-ui rounded-full border px-3 py-1 ${tone}`}>
      {status}
    </span>
  )
}

function groupByDay(bookings: FranchiseBooking[]) {
  const groups: Record<string, FranchiseBooking[]> = {}
  for (const b of [...bookings].sort(
    (a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime(),
  )) {
    const day = startOfDay(new Date(b.scheduled_for)).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    if (!groups[day]) groups[day] = []
    groups[day].push(b)
  }
  return groups
}

function WalkInModal({
  locationId,
  onClose,
  onCreated,
}: {
  locationId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [service, setService] = useState(PHASE_1_PROTOCOLS[0].slug)
  const [memberName, setMemberName] = useState('')
  const [scheduled, setScheduled] = useState(() => {
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() + 1)
    return d.toISOString().slice(0, 16)
  })
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/franchise/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          locationId,
          service,
          scheduled_for: new Date(scheduled).toISOString(),
          notes: notes || `Walk-in: ${memberName || 'guest'}`,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Could not create walk-in.')
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
          className="absolute right-4 top-4 text-mist hover:text-amber"
          aria-label="Close"
        >
          x
        </button>
        <p className="heading-ui text-amber">Add Walk-In</p>
        <h3 className="heading-display mt-2 text-2xl font-light text-bone">
          Book a session at the desk.
        </h3>
        <form onSubmit={submit} className="mt-6 space-y-4 text-sm">
          <label className="block">
            <span className="heading-ui text-mist">Protocol</span>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="input-field mt-2"
            >
              {PHASE_1_PROTOCOLS.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="heading-ui text-mist">Guest name</span>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="input-field mt-2"
              placeholder="Optional"
            />
          </label>
          <label className="block">
            <span className="heading-ui text-mist">When</span>
            <input
              type="datetime-local"
              required
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
              className="input-field mt-2"
            />
          </label>
          <label className="block">
            <span className="heading-ui text-mist">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field mt-2 min-h-[80px]"
              placeholder="Anything the operator should remember"
            />
          </label>
          {error && <p className="text-amber">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-gold w-full">
            {submitting ? 'Saving' : 'Create Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}
