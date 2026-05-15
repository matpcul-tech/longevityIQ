import OrdersManager, { type ClinicalOrder } from '@/components/clinical/OrdersManager'
import { requireClinicalPartner } from '@/lib/clinical'

export default async function ClinicalOrders() {
  const { supabase, partner } = await requireClinicalPartner()

  const { data } = await supabase
    .from('clinical_orders')
    .select(
      'id, patient_id_masked, protocol, status, ordered_at, completed_at, revenue, partner_share, clinical_notes',
    )
    .eq('partner_id', partner.id)
    .order('ordered_at', { ascending: false })
    .limit(200)

  const orders: ClinicalOrder[] = (data ?? []).map((row) => ({
    id: row.id as string,
    patient_id_masked: row.patient_id_masked as string,
    protocol: row.protocol as string,
    status: row.status as ClinicalOrder['status'],
    ordered_at: row.ordered_at as string,
    completed_at: (row.completed_at as string | null) ?? null,
    revenue: Number(row.revenue ?? 0),
    partner_share: Number(row.partner_share ?? 0),
    clinical_notes: (row.clinical_notes as string | null) ?? null,
  }))

  const catalogNames = partner.active_protocols.map((p) => p.name).filter(Boolean)

  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-teal">Orders</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Approve, complete and document clinical orders.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Orders flow in from consumer bookings of clinical protocols and from manual
          intakes added at your discretion.
        </p>
      </header>
      <OrdersManager
        orders={orders}
        partnerId={partner.id}
        catalogNames={catalogNames}
      />
    </div>
  )
}
