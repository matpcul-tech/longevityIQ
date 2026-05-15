import Nav from '@/components/Nav'
import { requireOperator } from '@/lib/franchise'

const items = [
  { label: 'Overview', href: '/franchise/dashboard' },
  { label: 'Clients', href: '/franchise/dashboard/clients' },
  { label: 'Bookings', href: '/franchise/dashboard/bookings' },
  { label: 'Revenue', href: '/franchise/dashboard/revenue' },
  { label: 'Protocols', href: '/franchise/dashboard/protocols' },
  { label: 'Settings', href: '/franchise/dashboard/settings' },
]

export default async function FranchiseDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, location, demo } = await requireOperator()
  return (
    <div>
      <Nav
        portalLabel={`Franchise · ${location.location_name}`}
        homeHref="/franchise/dashboard"
        email={user.email ?? null}
        items={items}
        accent="amber"
      />
      {demo && (
        <div className="border-b border-edge bg-amber/10 px-6 py-3 text-center text-xs text-amber">
          Demo location active. Claim or assign your operator seat to manage live data.
        </div>
      )}
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  )
}
