import Link from 'next/link'
import PortalCard from '@/components/PortalCard'
import { BIO_AGE_QUESTIONS } from '@/lib/lifestyle-score'

export default function LandingPage() {
  const previewQuestion = BIO_AGE_QUESTIONS[0]
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="heading-ui text-gold">Sovereign Healthcare</p>
          <h1 className="heading-display mt-6 text-5xl font-light leading-tight text-bone md:text-6xl">
            The longevity spa with a clinical record underneath.
          </h1>
          <p className="mt-6 max-w-xl text-base text-mist">
            Forty-six biomarker panel with Levine PhenoAge. Continuous wearable
            stream from Apple Health, Oura, Whoop and Garmin. Eight Phase 1
            protocols you can book today. Every reading anonymized and routed to
            the Sovereign AI so the insight you receive tomorrow is sharper than
            the one you received today.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/consumer" className="btn-gold">Enter Wellness</Link>
            <Link href="/franchise" className="btn-ghost">Franchise Portal</Link>
            <Link href="/clinical" className="btn-ghost">Clinical Partner Portal</Link>
          </div>
        </div>
        <div className="card p-8">
          <p className="heading-ui text-teal">Bio Age Preview</p>
          <h2 className="heading-display mt-4 text-2xl font-light text-bone">
            {previewQuestion.prompt}
          </h2>
          <p className="mt-2 text-xs text-mist">{previewQuestion.helper}</p>
          <ul className="mt-6 space-y-2">
            {previewQuestion.options.map((option) => (
              <li
                key={option.label}
                className="flex items-center justify-between rounded border border-edge px-4 py-3 text-sm text-bone"
              >
                <span>{option.label}</span>
                <span className="heading-ui text-mist">Score {option.score}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-mist">
            Sign in with magic link to complete the five-question assessment and receive
            your biological age estimate.
          </p>
          <Link href="/consumer" className="btn-gold mt-6 inline-block">
            Continue Assessment
          </Link>
        </div>
      </section>

      <div className="rule my-20" />

      <section>
        <p className="heading-ui text-gold">Three Portals</p>
        <h2 className="heading-display mt-3 text-3xl font-light text-bone">
          One operating system. Three sovereign entry points.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <PortalCard
            eyebrow="Consumer"
            title="Enter Wellness"
            description="Bio age scoring, Phase 1 protocol booking, membership and live AI insights tuned to your data."
            href="/consumer"
            cta="Open Consumer Portal"
            accent="gold"
          />
          <PortalCard
            eyebrow="Operator"
            title="Franchise Portal"
            description="Run a LongevityIQ location with live revenue, client retention, protocol scheduling and platform fee tracking."
            href="/franchise"
            cta="Open Franchise Portal"
            accent="amber"
          />
          <PortalCard
            eyebrow="Clinical"
            title="Clinical Partner Portal"
            description="Approve orders, document protocols, monitor revenue share, and protect compliance status across states."
            href="/clinical"
            cta="Open Clinical Portal"
            accent="teal"
          />
        </div>
      </section>

      <div className="rule my-20" />

      <section className="grid gap-8 md:grid-cols-3">
        <div className="card p-6">
          <p className="heading-ui text-gold">Forty-Six Biomarkers</p>
          <p className="heading-display mt-2 text-2xl text-bone">Levine PhenoAge from a single draw.</p>
          <p className="mt-3 text-sm text-mist">
            ApoB, hs-CRP, GlycA, HbA1c, omega-3 index, vitamin D, free testosterone
            and 39 more. Longevity-optimization ranges, not just lab reference.
          </p>
        </div>
        <div className="card p-6">
          <p className="heading-ui text-amber">Continuous Stream</p>
          <p className="heading-display mt-2 text-2xl text-bone">Every wearable feeds one AI.</p>
          <p className="mt-3 text-sm text-mist">
            Apple Health, Oura, Whoop, Garmin, Polar, Fitbit, Eight Sleep and CGM
            normalize into one daily shape. The Sovereign AI gets smarter with every
            night of sleep, every recovery score, every HRV reading.
          </p>
        </div>
        <div className="card p-6">
          <p className="heading-ui text-teal">Sovereign Data</p>
          <p className="heading-display mt-2 text-2xl text-bone">Hashed before it leaves.</p>
          <p className="mt-3 text-sm text-mist">
            Records encrypted at rest with AES-256-GCM. Training events anonymized
            with a per-app salt before they ever cross our boundary. We sell nothing
            and store only what clinical continuity requires.
          </p>
        </div>
      </section>
    </main>
  )
}
