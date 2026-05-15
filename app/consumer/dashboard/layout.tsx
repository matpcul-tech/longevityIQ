import Nav from '@/components/Nav'
import { requireConsumer } from '@/lib/consumer'

const items = [
  { label: 'Bio Age', href: '/consumer/dashboard' },
  { label: 'Protocols', href: '/consumer/dashboard/protocols' },
  { label: 'Membership', href: '/consumer/dashboard/membership' },
  { label: 'Insights', href: '/consumer/dashboard/insights' },
  { label: 'Wearable', href: '/consumer/dashboard/wearable' },
]

export default async function ConsumerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireConsumer()
  return (
    <div>
      <Nav
        portalLabel="Consumer"
        homeHref="/consumer/dashboard"
        email={profile.email}
        items={items}
        accent="gold"
      />
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  )
}
