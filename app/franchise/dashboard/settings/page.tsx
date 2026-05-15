import LocationSettingsForm from '@/components/franchise/LocationSettingsForm'
import { requireOperator } from '@/lib/franchise'

export default async function FranchiseSettings() {
  const { location, demo } = await requireOperator()

  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-amber">Settings</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Location profile and hours.
        </h1>
        <p className="mt-2 text-sm text-mist">
          Org code{' '}
          <span className="text-bone">{location.org_code ?? 'pending assignment'}</span>{' '}
          · Monthly franchise fee{' '}
          <span className="text-bone">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(Number(location.monthly_fee))}
          </span>
        </p>
      </header>

      <LocationSettingsForm
        locationId={location.id}
        initial={{
          location_name: location.location_name,
          address: location.address,
          city: location.city,
          state: location.state,
          contact_email: location.contact_email,
          contact_phone: location.contact_phone,
          hours: location.hours,
        }}
        canMutate={!demo}
      />
    </div>
  )
}
