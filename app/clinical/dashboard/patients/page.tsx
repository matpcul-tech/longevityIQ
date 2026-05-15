import { requireClinicalPartner } from '@/lib/clinical'

type OrderRow = {
  patient_id_masked: string
  protocol: string
  status: string
  ordered_at: string
  completed_at: string | null
}

function fmt(date: string | null) {
  if (!date) return 'Pending'
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function ClinicalPatients() {
  const { supabase, partner } = await requireClinicalPartner()

  const { data } = await supabase
    .from('clinical_orders')
    .select('patient_id_masked, protocol, status, ordered_at, completed_at')
    .eq('partner_id', partner.id)
    .order('ordered_at', { ascending: false })
    .limit(500)

  const orders = (data ?? []) as OrderRow[]

  type Patient = {
    id: string
    protocols: string[]
    nextAppointment: string | null
    lastOrder: string
    status: string
    totalOrders: number
  }

  const map = new Map<string, Patient>()
  for (const order of orders) {
    const id = order.patient_id_masked
    const existing = map.get(id) ?? {
      id,
      protocols: [],
      nextAppointment: null,
      lastOrder: order.ordered_at,
      status: order.status,
      totalOrders: 0,
    }
    existing.totalOrders += 1
    if (!existing.protocols.includes(order.protocol)) {
      existing.protocols.push(order.protocol)
    }
    if (order.status === 'approved' && !existing.nextAppointment) {
      existing.nextAppointment = order.completed_at ?? order.ordered_at
    }
    if (new Date(order.ordered_at) > new Date(existing.lastOrder)) {
      existing.lastOrder = order.ordered_at
      existing.status = order.status
    }
    map.set(id, existing)
  }

  const patients = Array.from(map.values()).sort(
    (a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime(),
  )

  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-teal">Patients</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Patient roster with masked identifiers.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Patient names are masked at rest. Use the patient ID to look up the encrypted
          record when clinically necessary.
        </p>
      </header>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-mist">
              <th className="px-5 py-4">Patient ID</th>
              <th className="px-5 py-4">Protocol History</th>
              <th className="px-5 py-4">Last Order</th>
              <th className="px-5 py-4">Next Appointment</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-mist">
                  No patients yet. New clinical orders will populate this roster.
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="border-t border-edge text-bone">
                  <td className="px-5 py-4 font-mono text-xs text-bone">{p.id}</td>
                  <td className="px-5 py-4 text-mist">
                    {p.protocols.slice(0, 3).join(', ')}
                    {p.protocols.length > 3 ? ` +${p.protocols.length - 3} more` : ''}
                  </td>
                  <td className="px-5 py-4 text-mist">{fmt(p.lastOrder)}</td>
                  <td className="px-5 py-4 text-mist">
                    {p.nextAppointment ? fmt(p.nextAppointment) : 'Not scheduled'}
                  </td>
                  <td className="px-5 py-4 heading-ui text-teal">{p.status}</td>
                  <td className="px-5 py-4">{p.totalOrders}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
