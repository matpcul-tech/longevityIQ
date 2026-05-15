'use client'

import { useState } from 'react'
import BookingModal from '@/components/BookingModal'
import { PHASE_1_PROTOCOLS, type Protocol } from '@/lib/protocols'

type Booking = {
  id: string
  service: string
  scheduled_for: string
  status: string
}

type Props = {
  bookings: Booking[]
}

export default function ProtocolsList({ bookings }: Props) {
  const [active, setActive] = useState<Protocol | null>(null)
  return (
    <div className="space-y-10">
      <div className="grid gap-5 md:grid-cols-2">
        {PHASE_1_PROTOCOLS.map((protocol) => (
          <article key={protocol.slug} className="card flex h-full flex-col p-6">
            <p className="heading-ui text-gold">{categoryLabel(protocol.category)}</p>
            <h3 className="heading-display mt-3 text-2xl text-bone">{protocol.name}</h3>
            <p className="mt-2 text-sm text-mist">{protocol.shortDescription}</p>
            <p className="mt-4 text-xs text-mist">{protocol.longDescription}</p>
            <div className="mt-auto pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-mist">{protocol.durationMinutes} min</span>
                <span className="heading-display text-2xl text-bone">
                  ${protocol.priceMin} to ${protocol.priceMax}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActive(protocol)}
                className="btn-gold mt-4 w-full"
              >
                Book Protocol
              </button>
            </div>
          </article>
        ))}
      </div>

      <section>
        <p className="heading-ui text-gold">Recent Bookings</p>
        {bookings.length === 0 ? (
          <p className="mt-3 text-sm text-mist">
            No bookings yet. Choose a protocol above to schedule with the concierge team.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="card flex flex-col gap-2 p-4 text-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="heading-ui text-gold">{labelForService(booking.service)}</p>
                  <p className="text-mist">
                    {new Date(booking.scheduled_for).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className="heading-ui text-mist">Status: {booking.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {active && (
        <BookingModal
          protocol={active}
          open
          onClose={() => setActive(null)}
          onConfirmed={() => {
            // Allow the modal to display its success state, then refresh on close.
          }}
        />
      )}
    </div>
  )
}

function categoryLabel(c: Protocol['category']) {
  switch (c) {
    case 'recovery':
      return 'Recovery'
    case 'performance':
      return 'Performance'
    case 'longevity':
      return 'Longevity'
    case 'clinical':
      return 'Clinical'
  }
}

function labelForService(slug: string) {
  const match = PHASE_1_PROTOCOLS.find((p) => p.slug === slug)
  return match?.name ?? slug
}
