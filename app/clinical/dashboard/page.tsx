import { requireClinicalPartner } from '@/lib/clinical'

function currency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysUntil(date: string | null) {
  if (!date) return null
  const ms = new Date(date).getTime() - Date.now()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export default async function ClinicalOverview() {
  const { supabase, partner } = await requireClinicalPartner()

  const { data: ordersData } = await supabase
    .from('clinical_orders')
    .select('id, status, protocol, ordered_at, revenue, partner_share, patient_id_masked')
    .eq('partner_id', partner.id)
    .order('ordered_at', { ascending: false })
    .limit(200)

  const orders = ordersData ?? []
  const month = startOfMonth().toISOString()

  const thisMonth = orders.filter(
    (o) => new Date(o.ordered_at as string).toISOString() >= month,
  )
  const completedThisMonth = thisMonth.filter((o) => o.status === 'completed')
  const pending = orders.filter((o) => o.status === 'pending')
  const earnedThisMonth = completedThisMonth.reduce(
    (acc, o) => acc + Number(o.partner_share ?? 0),
    0,
  )
  const patientsThisMonth = new Set(
    thisMonth.map((o) => o.patient_id_masked as string),
  ).size

  const expiryDays = daysUntil(partner.malpractice_expiry)

  const recent = orders.slice(0, 5)

  return (
    <div className="space-y-10">
      <header>
        <p className="heading-ui text-teal">Overview</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          {partner.name}
        </h1>
        <p className="mt-2 text-sm text-mist">
          {partner.license_type ?? 'Clinician'} · {partner.state ?? 'License pending'}{' '}
          · Revenue share {partner.revenue_share_pct}%
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Tile label="Active Patients" value={`${patientsThisMonth}`} sub="This month" />
        <Tile label="Protocols Ordered" value={`${thisMonth.length}`} sub={`${completedThisMonth.length} completed`} />
        <Tile label="Revenue Share Earned" value={currency(earnedThisMonth)} sub={`${partner.revenue_share_pct}% of completed clinical`} />
        <Tile
          label="Pending Orders"
          value={`${pending.length}`}
          sub={pending.length > 0 ? 'Action required in Orders' : 'No backlog'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-6">
          <p className="heading-ui text-teal">Recent Orders</p>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-mist">
              No orders yet. New consumer requests will land here as they are submitted.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-edge">
              {recent.map((o) => (
                <li key={o.id as string} className="flex flex-col gap-1 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="heading-display text-lg text-bone">
                      {o.protocol as string}
                    </p>
                    <p className="text-xs text-mist">
                      Patient {o.patient_id_masked as string} ·{' '}
                      {new Date(o.ordered_at as string).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-mist">{currency(Number(o.revenue ?? 0))}</span>
                    <span className="heading-ui text-teal">{o.status as string}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <p className="heading-ui text-teal">Compliance Watch</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between border-b border-edge pb-3">
              <span className="text-mist">License</span>
              <span className="text-bone">
                {partner.license_number_masked ?? 'Pending'}
              </span>
            </li>
            <li className="flex justify-between border-b border-edge pb-3">
              <span className="text-mist">DEA</span>
              <span className="text-bone">{partner.dea_masked ?? 'Not on file'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-mist">Malpractice expiry</span>
              <span className={`heading-display text-2xl ${expiryWarn(expiryDays)}`}>
                {partner.malpractice_expiry
                  ? `${expiryDays} days`
                  : 'Not on file'}
              </span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-mist">
            Open the Compliance tab to update license, DEA, and malpractice details.
          </p>
        </section>
      </div>
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

function expiryWarn(days: number | null) {
  if (days === null) return 'text-mist'
  if (days <= 30) return 'text-amber'
  if (days <= 90) return 'text-gold'
  return 'text-bone'
}
