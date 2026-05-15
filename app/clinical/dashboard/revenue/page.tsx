import RevenueChart from '@/components/RevenueChart'
import { requireClinicalPartner } from '@/lib/clinical'

function currency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 7)
}

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export default async function ClinicalRevenue() {
  const { supabase, partner } = await requireClinicalPartner()

  const { data } = await supabase
    .from('clinical_orders')
    .select('protocol, revenue, partner_share, status, completed_at, ordered_at')
    .eq('partner_id', partner.id)
    .order('ordered_at', { ascending: false })
    .limit(500)

  const orders = data ?? []
  const completed = orders.filter((o) => o.status === 'completed')

  const byMonth: Record<string, { revenue: number; share: number; count: number }> = {}
  const byService: Record<string, { revenue: number; share: number; count: number }> = {}

  for (const o of completed) {
    const dateIso = (o.completed_at as string | null) ?? (o.ordered_at as string)
    const key = monthKey(dateIso)
    const monthBucket = byMonth[key] ?? { revenue: 0, share: 0, count: 0 }
    monthBucket.revenue += Number(o.revenue ?? 0)
    monthBucket.share += Number(o.partner_share ?? 0)
    monthBucket.count += 1
    byMonth[key] = monthBucket

    const svc = (o.protocol as string) ?? 'unspecified'
    const svcBucket = byService[svc] ?? { revenue: 0, share: 0, count: 0 }
    svcBucket.revenue += Number(o.revenue ?? 0)
    svcBucket.share += Number(o.partner_share ?? 0)
    svcBucket.count += 1
    byService[svc] = svcBucket
  }

  const monthKeys = Object.keys(byMonth).sort().reverse()
  const currentMonthKey = monthKeys[0]
  const currentMonth = currentMonthKey ? byMonth[currentMonthKey] : null

  const serviceRows = Object.entries(byService).map(([label, v], i) => ({
    label,
    value: v.share,
    accent: (i % 3 === 0 ? 'teal' : i % 3 === 1 ? 'gold' : 'amber') as
      | 'gold'
      | 'amber'
      | 'teal',
  }))

  const totalShare = serviceRows.reduce((acc, r) => acc + r.value, 0)

  return (
    <div className="space-y-10">
      <header>
        <p className="heading-ui text-teal">Revenue</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Revenue share earned across clinical orders.
        </h1>
        <p className="mt-2 text-sm text-mist">
          Your contracted revenue share is {partner.revenue_share_pct}% of gross
          clinical revenue. Industry range: 30 to 40 percent.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Tile
          label={currentMonthKey ? monthLabel(currentMonthKey) : 'No revenue yet'}
          value={currency(currentMonth?.share ?? 0)}
          sub={`${currentMonth?.count ?? 0} completed orders`}
        />
        <Tile
          label="Gross This Month"
          value={currency(currentMonth?.revenue ?? 0)}
          sub="Before revenue share"
        />
        <Tile
          label="Lifetime Share"
          value={currency(totalShare)}
          sub={`${completed.length} completed orders`}
        />
        <Tile
          label="Share Rate"
          value={`${partner.revenue_share_pct}%`}
          sub="Adjust in contract addendum"
        />
      </div>

      <RevenueChart
        title="Lifetime share by service"
        rows={serviceRows.length ? serviceRows : [{ label: 'No revenue', value: 0 }]}
        total={totalShare}
      />

      <section>
        <p className="heading-ui text-teal">Monthly Ledger</p>
        <div className="card mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-mist">
                <th className="px-5 py-4">Month</th>
                <th className="px-5 py-4">Completed Orders</th>
                <th className="px-5 py-4">Gross</th>
                <th className="px-5 py-4">Your Share</th>
              </tr>
            </thead>
            <tbody>
              {monthKeys.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-mist">
                    No completed orders yet.
                  </td>
                </tr>
              ) : (
                monthKeys.map((key) => {
                  const v = byMonth[key]
                  return (
                    <tr key={key} className="border-t border-edge text-bone">
                      <td className="px-5 py-4">{monthLabel(key)}</td>
                      <td className="px-5 py-4">{v.count}</td>
                      <td className="px-5 py-4">{currency(v.revenue)}</td>
                      <td className="px-5 py-4 heading-display text-xl">
                        {currency(v.share)}
                      </td>
                    </tr>
                  )
                })
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
      <p className="heading-ui text-teal">{label}</p>
      <p className="heading-display mt-3 text-4xl text-bone">{value}</p>
      {sub && <p className="mt-2 text-xs text-mist">{sub}</p>}
    </div>
  )
}
