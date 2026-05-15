import BookingsManager, { type FranchiseBooking } from '@/components/franchise/BookingsManager'
import { requireOperator } from '@/lib/franchise'

type ConsumerRef = { email: string; full_name: string | null } | null

function pickConsumer(value: unknown): ConsumerRef {
  if (!value) return null
  const node = Array.isArray(value) ? value[0] : value
  if (!node || typeof node !== 'object') return null
  const obj = node as { email?: unknown; full_name?: unknown }
  return {
    email: typeof obj.email === 'string' ? obj.email : '',
    full_name: typeof obj.full_name === 'string' ? obj.full_name : null,
  }
}

export default async function FranchiseBookings() {
  const { supabase, location, demo } = await requireOperator()

  const since = new Date()
  since.setDate(since.getDate() - 1)

  const { data } = await supabase
    .from('bookings')
    .select(
      'id, service, scheduled_for, status, notes, consumer:consumer_profiles(email, full_name)',
    )
    .or(`location_id.eq.${location.id},location.eq.${location.location_name}`)
    .gte('scheduled_for', since.toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(200)

  const bookings: FranchiseBooking[] = (data ?? []).map((row) => {
    const consumer = pickConsumer(row.consumer)
    return {
      id: row.id as string,
      service: row.service as string,
      scheduled_for: row.scheduled_for as string,
      status: row.status as FranchiseBooking['status'],
      notes: (row.notes as string | null) ?? null,
      member: consumer?.full_name ?? consumer?.email ?? 'Walk-in guest',
    }
  })

  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-amber">Bookings</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Calendar at {location.location_name}.
        </h1>
        <p className="mt-2 text-sm text-mist">
          Upcoming sessions from consumer requests and walk-ins. Confirm, complete or
          cancel inline.
        </p>
      </header>
      <BookingsManager
        bookings={bookings}
        locationId={location.id}
        canMutate={!demo}
      />
    </div>
  )
}
