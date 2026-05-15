import Link from 'next/link'
import { redirect } from 'next/navigation'
import MagicLinkForm from '@/components/MagicLinkForm'
import { createClient } from '@/lib/supabase/server'

export default async function FranchiseLogin() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  if (data.user) {
    redirect('/franchise/dashboard')
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr]">
      <section>
        <Link href="/" className="heading-ui text-mist hover:text-amber">
          &larr; Back to landing
        </Link>
        <p className="heading-ui mt-8 text-amber">Franchise Operator Portal</p>
        <h1 className="heading-display mt-4 text-5xl font-light text-bone">
          Operate a LongevityIQ location.
        </h1>
        <p className="mt-6 max-w-xl text-mist">
          Track revenue, clients, bookings and protocol mix at your location. Toggle
          services, override pricing, and reconcile platform fees in one place.
        </p>
        <ul className="mt-10 space-y-3 text-sm text-bone">
          <li className="flex gap-3"><span className="text-amber">01.</span> Live revenue ledger with platform fee math.</li>
          <li className="flex gap-3"><span className="text-amber">02.</span> Calendar with confirm, complete, cancel and walk-in.</li>
          <li className="flex gap-3"><span className="text-amber">03.</span> Toggle protocols and override pricing per location.</li>
          <li className="flex gap-3"><span className="text-amber">04.</span> Operator profile, hours and contact in one screen.</li>
        </ul>
      </section>
      <section className="self-center">
        <MagicLinkForm portal="franchise" accent="amber" />
      </section>
    </main>
  )
}
