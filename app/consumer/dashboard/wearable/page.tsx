import WearablePanel from '@/components/WearablePanel'
import { requireConsumer } from '@/lib/consumer'

export default async function WearableTab() {
  await requireConsumer()
  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-gold">Wearable</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Live signal feed for your sovereign record.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Connect Apple Health or Google Fit to stream HR, HRV, SpO2, steps and sleep
          into LongevityIQ. Data is encrypted at rest and never sold.
        </p>
      </header>
      <WearablePanel />
    </div>
  )
}
