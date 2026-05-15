import Link from 'next/link'
import { redirect } from 'next/navigation'
import MagicLinkForm from '@/components/MagicLinkForm'
import { createClient } from '@/lib/supabase/server'

export default async function ClinicalLogin() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  if (data.user) {
    redirect('/clinical/dashboard')
  }

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
        <ul className="mt-10 space-y-3 text-sm text-bone">
          <li className="flex gap-3"><span className="text-teal">01.</span> Pending order queue with one-tap approve and decline.</li>
          <li className="flex gap-3"><span className="text-teal">02.</span> Patient roster with masked IDs and protocol history.</li>
          <li className="flex gap-3"><span className="text-teal">03.</span> Editable protocol catalog with clinical notes and pricing.</li>
          <li className="flex gap-3"><span className="text-teal">04.</span> Revenue share ledger, compliance alerts on license and malpractice expiry.</li>
        </ul>
      </section>
      <section className="self-center">
        <MagicLinkForm portal="clinical" accent="teal" />
      </section>
    </main>
  )
}
