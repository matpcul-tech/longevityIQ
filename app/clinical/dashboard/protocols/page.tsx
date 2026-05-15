import ProtocolsEditor from '@/components/clinical/ProtocolsEditor'
import { requireClinicalPartner } from '@/lib/clinical'

export default async function ClinicalProtocolsPage() {
  const { partner } = await requireClinicalPartner()
  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-teal">Protocols</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Your clinical service catalog.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Define each protocol you offer with pricing and clinical notes. Consumer
          bookings will only flow to you for protocols you keep listed here.
        </p>
      </header>
      <ProtocolsEditor partnerId={partner.id} initial={partner.active_protocols} />
    </div>
  )
}
