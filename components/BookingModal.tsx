'use client'

import { useState } from 'react'
import type { Protocol } from '@/lib/protocols'

type Props = {
  protocol: Protocol
  open: boolean
  onClose: () => void
  onConfirmed?: () => void
}

export default function BookingModal({ protocol, open, onClose, onConfirmed }: Props) {
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('LongevityIQ Ada Flagship')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          service: protocol.slug,
          scheduled_for: new Date(date).toISOString(),
          location,
          notes,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Could not submit the booking.')
      }
      setSuccess(true)
      onConfirmed?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="card relative w-full max-w-md p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-mist hover:text-gold"
          aria-label="Close"
        >
          x
        </button>
        <p className="heading-ui text-gold">Book Protocol</p>
        <h3 className="heading-display mt-2 text-2xl font-light text-bone">{protocol.name}</h3>
        <p className="mt-2 text-sm text-mist">
          {`Estimated ${protocol.durationMinutes} minutes. Investment ${formatRange(
            protocol.priceMin,
            protocol.priceMax,
          )}.`}
        </p>

        {success ? (
          <div className="mt-6 space-y-3 text-sm text-bone">
            <p>
              Your request is in. A concierge will confirm the appointment within four
              business hours.
            </p>
            <button type="button" onClick={onClose} className="btn-gold w-full">
              Done
            </button>
          </div>
        ) : (
          <form className="mt-6 space-y-4 text-sm" onSubmit={submit}>
            <label className="block">
              <span className="heading-ui text-mist">Preferred date and time</span>
              <input
                type="datetime-local"
                value={date}
                required
                onChange={(e) => setDate(e.target.value)}
                className="input-field mt-2"
              />
            </label>
            <label className="block">
              <span className="heading-ui text-mist">Location</span>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field mt-2"
              >
                <option>LongevityIQ Ada Flagship</option>
                <option>LongevityIQ Manhattan</option>
                <option>LongevityIQ Mobile Clinical</option>
              </select>
            </label>
            <label className="block">
              <span className="heading-ui text-mist">Notes for the concierge</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field mt-2 min-h-[80px]"
                placeholder="Specific goals, allergies, or scheduling constraints"
              />
            </label>
            {error && <p className="text-sm text-amber">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-gold w-full">
              {submitting ? 'Submitting' : 'Confirm Booking'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function formatRange(min: number, max: number) {
  return `$${min} to $${max}`
}
