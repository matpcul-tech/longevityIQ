import MembershipPanel from '@/components/MembershipPanel'
import { requireConsumer } from '@/lib/consumer'

export default async function MembershipTab() {
  const { profile } = await requireConsumer()

  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-gold">Membership</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Four tiers. One sovereign promise.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Membership benefits stack automatically across protocols, insights and
          wearable sync. Annual billing and family plans are available on request.
        </p>
      </header>
      <MembershipPanel currentTier={profile.tier} />
      <p className="text-xs text-mist">
        Billing handled by Stripe. Cancel anytime from the customer portal.
      </p>
    </div>
  )
}
