'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

type Hours = Record<string, string>

type Props = {
  locationId: string
  initial: {
    location_name: string
    address: string | null
    city: string | null
    state: string | null
    contact_email: string | null
    contact_phone: string | null
    hours: Hours
  }
  canMutate: boolean
}

export default function LocationSettingsForm({ locationId, initial, canMutate }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [draft, setDraft] = useState({
    location_name: initial.location_name,
    address: initial.address ?? '',
    city: initial.city ?? '',
    state: initial.state ?? '',
    contact_email: initial.contact_email ?? '',
    contact_phone: initial.contact_phone ?? '',
  })
  const [hours, setHours] = useState<Hours>({
    monday: initial.hours.monday ?? '',
    tuesday: initial.hours.tuesday ?? '',
    wednesday: initial.hours.wednesday ?? '',
    thursday: initial.hours.thursday ?? '',
    friday: initial.hours.friday ?? '',
    saturday: initial.hours.saturday ?? '',
    sunday: initial.hours.sunday ?? '',
  })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function field(key: keyof typeof draft, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/franchise/location', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          locationId,
          location_name: draft.location_name,
          address: draft.address || null,
          city: draft.city || null,
          state: draft.state || null,
          contact_email: draft.contact_email || null,
          contact_phone: draft.contact_phone || null,
          hours,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Could not save settings.')
        return
      }
      setMessage('Settings saved.')
      router.refresh()
    })
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="card grid gap-4 p-6 md:grid-cols-2">
        <label className="block text-sm">
          <span className="heading-ui text-mist">Location name</span>
          <input
            className="input-field mt-2"
            value={draft.location_name}
            onChange={(e) => field('location_name', e.target.value)}
            disabled={!canMutate}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="heading-ui text-mist">Address</span>
          <input
            className="input-field mt-2"
            value={draft.address}
            onChange={(e) => field('address', e.target.value)}
            disabled={!canMutate}
          />
        </label>
        <label className="block text-sm">
          <span className="heading-ui text-mist">City</span>
          <input
            className="input-field mt-2"
            value={draft.city}
            onChange={(e) => field('city', e.target.value)}
            disabled={!canMutate}
          />
        </label>
        <label className="block text-sm">
          <span className="heading-ui text-mist">State</span>
          <input
            className="input-field mt-2"
            value={draft.state}
            onChange={(e) => field('state', e.target.value)}
            disabled={!canMutate}
          />
        </label>
        <label className="block text-sm">
          <span className="heading-ui text-mist">Contact email</span>
          <input
            type="email"
            className="input-field mt-2"
            value={draft.contact_email}
            onChange={(e) => field('contact_email', e.target.value)}
            disabled={!canMutate}
          />
        </label>
        <label className="block text-sm">
          <span className="heading-ui text-mist">Contact phone</span>
          <input
            type="tel"
            className="input-field mt-2"
            value={draft.contact_phone}
            onChange={(e) => field('contact_phone', e.target.value)}
            disabled={!canMutate}
          />
        </label>
      </div>

      <div className="card p-6">
        <p className="heading-ui text-amber">Operating Hours</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {DAYS.map((day) => (
            <label key={day} className="block text-sm">
              <span className="heading-ui text-mist capitalize">{day}</span>
              <input
                className="input-field mt-2"
                value={hours[day] ?? ''}
                onChange={(e) => setHours((h) => ({ ...h, [day]: e.target.value }))}
                placeholder="06:00 to 21:00"
                disabled={!canMutate}
              />
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-amber">{error}</p>}
      {message && <p className="text-sm text-teal">{message}</p>}

      <button
        type="submit"
        disabled={pending || !canMutate}
        className="btn-gold"
      >
        {pending ? 'Saving' : canMutate ? 'Save Settings' : 'Demo mode (read-only)'}
      </button>
    </form>
  )
}
