import Link from 'next/link'
import MagicLinkForm from '@/components/MagicLinkForm'

export default function ClinicalLogin() {
  return (
    <main className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr]">
      <section>
        <Link href="/" className="heading-ui text-mist hover:text-teal">
          &larr; Back to landing
        </Link>
        <p className="heading-ui mt-8 text-teal">Clinical Partner Portal</p>
        <h1 className="heading-display mt-4 text-5xl font-light text-bone">
          Practice with sovereign tooling.
        </h1>
        <p className="mt-6 max-w-xl text-mist">
          Review orders, document protocols, monitor revenue share and maintain
          compliance across the states you practice in.
        </p>
        <p className="mt-6 text-sm text-mist">
          Clinical build ships after the franchise portal. Sign in to reserve your
          partner record.
        </p>
      </section>
      <section className="self-center">
        <MagicLinkForm portal="clinical" accent="teal" />
      </section>
    </main>
  )
}
