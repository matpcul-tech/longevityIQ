import ProtocolsList from '@/components/ProtocolsList'
import { requireConsumer } from '@/lib/consumer'

export default async function ProtocolsTab() {
  const { supabase, profile } = await requireConsumer()
  const { data } = await supabase
    .from('bookings')
    .select('id, service, scheduled_for, status')
    .eq('consumer_id', profile.id)
    .order('scheduled_for', { ascending: false })
    .limit(10)

  const bookings = (data ?? []).map((row) => ({
    id: row.id as string,
    service: row.service as string,
    scheduled_for: row.scheduled_for as string,
    status: row.status as string,
  }))

  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-gold">Phase 1 Protocols</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Eight modalities. Concierge scheduling.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Book any protocol directly. The local franchise will confirm the appointment
          inside four business hours and adjust pricing to your membership tier.
        </p>
      </header>
      <ProtocolsList bookings={bookings} />
    </div>
  )
}
