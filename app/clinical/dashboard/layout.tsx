import Nav from '@/components/Nav'
import { requireClinicalPartner } from '@/lib/clinical'

const items = [
  { label: 'Overview', href: '/clinical/dashboard' },
  { label: 'Patients', href: '/clinical/dashboard/patients' },
  { label: 'Protocols', href: '/clinical/dashboard/protocols' },
  { label: 'Orders', href: '/clinical/dashboard/orders' },
  { label: 'Revenue', href: '/clinical/dashboard/revenue' },
  { label: 'Compliance', href: '/clinical/dashboard/compliance' },
]

export default async function ClinicalDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, partner } = await requireClinicalPartner()
  return (
    <div>
      <Nav
        portalLabel={`Clinical · ${partner.name}`}
        homeHref="/clinical/dashboard"
        email={user.email ?? null}
        items={items}
        accent="teal"
      />
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  )
}
