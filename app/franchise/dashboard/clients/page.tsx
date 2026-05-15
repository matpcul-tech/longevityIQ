import { requireOperator } from '@/lib/franchise'
import { PHASE_1_PROTOCOLS } from '@/lib/protocols'

type ConsumerRef = { email: string; full_name: string | null; tier: string } | null

function pickConsumer(value: unknown): ConsumerRef {
  if (!value) return null
  const node = Array.isArray(value) ? value[0] : value
  if (!node || typeof node !== 'object') return null
  const obj = node as { email?: unknown; full_name?: unknown; tier?: unknown }
  return {
    email: typeof obj.email === 'string' ? obj.email : '',
    full_name: typeof obj.full_name === 'string' ? obj.full_name : null,
    tier: typeof obj.tier === 'string' ? obj.tier : 'free',
  }
}

function fmt(date: string | null) {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function protocolName(slug: string) {
  return PHASE_1_PROTOCOLS.find((p) => p.slug === slug)?.name ?? slug
}

export default async function FranchiseClients() {
  const { supabase, location } = await requireOperator()

  const { data: clients } = await supabase
    .from('franchise_clients')
    .select(
      'id, consumer_id, joined_date, total_sessions, last_visit, consumer:consumer_profiles(email, full_name, tier)',
    )
    .eq('location_id', location.id)
    .order('last_visit', { ascending: false, nullsFirst: false })

  const rows = clients ?? []

  // Pull recent booking history per consumer to render protocol mix.
  const consumerIds = rows
    .map((r) => r.consumer_id)
    .filter((id): id is string => Boolean(id))

  const { data: bookings } = consumerIds.length
    ? await supabase
        .from('bookings')
        .select('consumer_id, service, scheduled_for')
        .in('consumer_id', consumerIds)
        .order('scheduled_for', { ascending: false })
        .limit(200)
    : { data: [] }

  const historyByConsumer: Record<string, string[]> = {}
  for (const row of bookings ?? []) {
    const id = row.consumer_id as string
    if (!historyByConsumer[id]) historyByConsumer[id] = []
    if (historyByConsumer[id].length < 4) {
      historyByConsumer[id].push(protocolName(row.service as string))
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-amber">Clients</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Membership roster at {location.location_name}.
        </h1>
        <p className="mt-2 text-sm text-mist">
          {rows.length === 0
            ? 'No clients linked yet. Bookings from the consumer portal will populate this list automatically.'
            : `${rows.length} active members across all tiers.`}
        </p>
      </header>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-mist">
              <th className="px-5 py-4">Member</th>
              <th className="px-5 py-4">Tier</th>
              <th className="px-5 py-4">Joined</th>
              <th className="px-5 py-4">Last Visit</th>
              <th className="px-5 py-4">Sessions</th>
              <th className="px-5 py-4">Recent Protocols</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-mist">
                  Roster is empty for this location.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const consumer = pickConsumer(row.consumer)
                const historyList = historyByConsumer[row.consumer_id as string] ?? []
                return (
                  <tr key={row.id as string} className="border-t border-edge text-bone">
                    <td className="px-5 py-4">
                      <div className="font-body">
                        {consumer?.full_name ?? consumer?.email ?? 'Member'}
                      </div>
                      {consumer?.full_name && (
                        <div className="text-xs text-mist">{consumer.email}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 heading-ui text-amber">
                      {consumer?.tier ?? 'free'}
                    </td>
                    <td className="px-5 py-4 text-mist">{fmt(row.joined_date as string)}</td>
                    <td className="px-5 py-4 text-mist">{fmt(row.last_visit as string)}</td>
                    <td className="px-5 py-4">{row.total_sessions}</td>
                    <td className="px-5 py-4 text-mist">
                      {historyList.length > 0 ? historyList.join(', ') : 'No history yet'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
