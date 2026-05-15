import RevenueChart from '@/components/RevenueChart'
import { requireOperator, platformFeeRate } from '@/lib/franchise'
import { PHASE_1_PROTOCOLS } from '@/lib/protocols'

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

function protocolName(slug: string) {
  return PHASE_1_PROTOCOLS.find((p) => p.slug === slug)?.name ?? slug
}

export default async function FranchiseOverview() {
  const { supabase, location } = await requireOperator()

  const monthStart = startOfMonth()

  const [clientsRes, bookingsRes, revenueRes] = await Promise.all([
    supabase
      .from('franchise_clients')
      .select('id, joined_date, last_visit, total_sessions')
      .eq('location_id', location.id),
    supabase
      .from('bookings')
      .select('id, service, status, scheduled_for')
      .eq('location_id', location.id)
      .gte('scheduled_for', monthStart),
    supabase
      .from('franchise_revenue')
      .select('service, sessions, gross_revenue, platform_fee, net_revenue, month')
      .eq('location_id', location.id),
  ])

  const clients = clientsRes.data ?? []
  const bookings = bookingsRes.data ?? []
  const revenueRows = revenueRes.data ?? []

  const newThisMonth = clients.filter((c) =>
    c.joined_date && new Date(c.joined_date as string) >= new Date(monthStart),
  ).length

  const sessionsThisMonth = bookings.filter((b) =>
    ['confirmed', 'completed'].includes(b.status as string),
  ).length

  const currentMonthRevenue = revenueRows.filter((r) =>
    sameMonth(r.month as string),
  )
  const grossMonth = sum(currentMonthRevenue, 'gross_revenue')
  const platformMonth = sum(currentMonthRevenue, 'platform_fee')
  const netMonth = sum(currentMonthRevenue, 'net_revenue')

  const topProtocolSlug = topByCount(bookings.map((b) => b.service as string)) ??
    topByCount(revenueRows.map((r) => r.service as string))

  const rows = currentMonthRevenue.map((r, i) => ({
    label: protocolName(r.service as string),
    value: Number(r.gross_revenue ?? 0),
    accent: (i % 3 === 0 ? 'gold' : i % 3 === 1 ? 'amber' : 'teal') as
      | 'gold'
      | 'amber'
      | 'teal',
  }))

  return (
    <div className="space-y-10">
      <header>
        <p className="heading-ui text-amber">Overview</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          {location.location_name}
        </h1>
        <p className="mt-2 text-sm text-mist">
          {location.city ? `${location.city}, ${location.state}` : 'Location'} ·
          Org code {location.org_code ?? 'pending assignment'}
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Tile label="Total Clients" value={`${clients.length}`} sub={`${newThisMonth} new this month`} />
        <Tile label="Sessions This Month" value={`${sessionsThisMonth}`} sub={`${bookings.length} on the books`} />
        <Tile
          label="Gross Revenue"
          value={currency(grossMonth)}
          sub={`Platform fee ${currency(platformMonth)}`}
        />
        <Tile
          label="Top Protocol"
          value={topProtocolSlug ? protocolName(topProtocolSlug) : 'No data yet'}
          sub="Last 30 days"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <RevenueChart
          title={`Revenue by Service · ${new Date().toLocaleString(undefined, { month: 'long', year: 'numeric' })}`}
          rows={rows.length > 0 ? rows : [{ label: 'No revenue recorded yet', value: 0 }]}
          total={grossMonth}
        />
        <div className="card p-6">
          <p className="heading-ui text-amber">Franchise Math</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between border-b border-edge pb-3">
              <span className="text-mist">Monthly franchise fee</span>
              <span className="text-bone">{currency(Number(location.monthly_fee))}</span>
            </li>
            <li className="flex justify-between border-b border-edge pb-3">
              <span className="text-mist">Platform fee rate</span>
              <span className="text-bone">{(platformFeeRate() * 100).toFixed(0)}%</span>
            </li>
            <li className="flex justify-between border-b border-edge pb-3">
              <span className="text-mist">Net after platform fee</span>
              <span className="text-bone">{currency(netMonth)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-mist">Owner take this month</span>
              <span className="heading-display text-2xl text-bone">
                {currency(Math.max(0, netMonth - Number(location.monthly_fee)))}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Tile({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="card p-6">
      <p className="heading-ui text-amber">{label}</p>
      <p className="heading-display mt-3 text-4xl text-bone">{value}</p>
      {sub && <p className="mt-2 text-xs text-mist">{sub}</p>}
    </div>
  )
}

function sum(rows: Array<Record<string, unknown>>, field: string) {
  return rows.reduce((acc, r) => acc + Number(r[field] ?? 0), 0)
}

function sameMonth(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function topByCount(items: string[]) {
  if (items.length === 0) return null
  const counts: Record<string, number> = {}
  for (const item of items) counts[item] = (counts[item] ?? 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

function currency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}
