import RevenueChart from '@/components/RevenueChart'
import { requireOperator, platformFeeRate } from '@/lib/franchise'
import { PHASE_1_PROTOCOLS } from '@/lib/protocols'

function protocolName(slug: string) {
  return PHASE_1_PROTOCOLS.find((p) => p.slug === slug)?.name ?? slug
}

function currency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function monthLabel(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

export default async function FranchiseRevenue() {
  const { supabase, location } = await requireOperator()

  const { data } = await supabase
    .from('franchise_revenue')
    .select('id, month, service, sessions, gross_revenue, platform_fee, net_revenue')
    .eq('location_id', location.id)
    .order('month', { ascending: false })

  const rows = data ?? []

  const byMonth: Record<string, typeof rows> = {}
  for (const r of rows) {
    const key = monthLabel(r.month as string)
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(r)
  }

  const months = Object.keys(byMonth)
  const currentKey = months[0]
  const currentRows = currentKey ? byMonth[currentKey] : []

  const currentGross = sum(currentRows, 'gross_revenue')
  const currentPlatform = sum(currentRows, 'platform_fee')
  const currentNet = sum(currentRows, 'net_revenue')

  const chartRows = currentRows.map((r, i) => ({
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
        <p className="heading-ui text-amber">Revenue</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          {currentKey ?? 'Revenue ledger'}
        </h1>
        <p className="mt-2 text-sm text-mist">
          Platform fee runs at {(platformFeeRate() * 100).toFixed(0)}% of gross.
          Monthly franchise fee {currency(Number(location.monthly_fee))} settles on the
          first of each month.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Tile label="Gross" value={currency(currentGross)} sub="Across all services" />
        <Tile label="Platform Fee" value={currency(currentPlatform)} sub={`${(platformFeeRate() * 100).toFixed(0)}% of gross`} />
        <Tile
          label="Net to Location"
          value={currency(currentNet)}
          sub="Before franchise fee"
        />
        <Tile
          label="Owner Take"
          value={currency(Math.max(0, currentNet - Number(location.monthly_fee)))}
          sub="After franchise fee"
        />
      </div>

      <RevenueChart
        title={`Service mix · ${currentKey ?? 'No revenue yet'}`}
        rows={chartRows.length ? chartRows : [{ label: 'No revenue', value: 0 }]}
        total={currentGross}
      />

      <section className="space-y-4">
        <p className="heading-ui text-amber">Ledger</p>
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-mist">
                <th className="px-5 py-4">Month</th>
                <th className="px-5 py-4">Service</th>
                <th className="px-5 py-4">Sessions</th>
                <th className="px-5 py-4">Gross</th>
                <th className="px-5 py-4">Platform Fee</th>
                <th className="px-5 py-4">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-mist">
                    No revenue posted yet. Completed bookings will flow here automatically.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id as string} className="border-t border-edge text-bone">
                    <td className="px-5 py-4">{monthLabel(r.month as string)}</td>
                    <td className="px-5 py-4">{protocolName(r.service as string)}</td>
                    <td className="px-5 py-4">{r.sessions}</td>
                    <td className="px-5 py-4">{currency(Number(r.gross_revenue ?? 0))}</td>
                    <td className="px-5 py-4">{currency(Number(r.platform_fee ?? 0))}</td>
                    <td className="px-5 py-4">{currency(Number(r.net_revenue ?? 0))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
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
