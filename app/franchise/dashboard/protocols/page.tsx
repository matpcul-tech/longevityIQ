import ProtocolsManager from '@/components/franchise/ProtocolsManager'
import { requireOperator } from '@/lib/franchise'

export default async function FranchiseProtocols() {
  const { location, demo } = await requireOperator()
  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-amber">Protocols</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Service menu and pricing at {location.location_name}.
        </h1>
        <p className="mt-2 text-sm text-mist">
          Toggle which Phase 1 protocols are live at this location. Override pricing
          where local market or clinical staffing requires.
        </p>
      </header>
      <ProtocolsManager
        locationId={location.id}
        activeServices={location.active_services}
        overrides={location.pricing_overrides}
        canMutate={!demo}
      />
    </div>
  )
}
