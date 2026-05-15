import Link from 'next/link'
import MagicLinkForm from '@/components/MagicLinkForm'

export default function FranchiseLogin() {
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
        <p className="mt-6 text-sm text-mist">
          Franchise build ships next. Sign in to claim your operator seat early.
        </p>
      </section>
      <section className="self-center">
        <MagicLinkForm portal="franchise" accent="amber" />
      </section>
    </main>
  )
}
