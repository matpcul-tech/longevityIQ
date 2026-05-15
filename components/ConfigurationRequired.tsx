import Link from 'next/link'

type Props = {
  portal: 'Consumer' | 'Franchise' | 'Clinical' | 'Sovereign'
  accent?: 'gold' | 'amber' | 'teal'
  missing?: string[]
}

const accents = {
  gold: 'text-gold',
  amber: 'text-amber',
  teal: 'text-teal',
}

export default function ConfigurationRequired({
  portal,
  accent = 'gold',
  missing = [],
}: Props) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="heading-ui text-mist hover:text-gold">
        &larr; Back to LongevityIQ
      </Link>
      <p className={`heading-ui mt-8 ${accents[accent]}`}>{portal} Portal</p>
      <h1 className="heading-display mt-4 text-4xl font-light text-bone">
        Backend not yet configured.
      </h1>
      <p className="mt-6 max-w-xl text-mist">
        The {portal.toLowerCase()} portal needs Supabase, Anthropic and the
        Sovereign training bus wired up before it can sign in or persist data.
        The wellness experience at the root URL continues to work in the
        meantime.
      </p>

      <section className="card mt-10 p-6">
        <p className="heading-ui text-gold">Required environment variables</p>
        <ul className="mt-4 space-y-2 font-mono text-sm text-bone">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          <li>SUPABASE_SERVICE_ROLE_KEY</li>
          <li>ANTHROPIC_API_KEY</li>
          <li>SOVEREIGN_APP_SALT</li>
          <li>RESEND_API_KEY</li>
        </ul>
        {missing.length > 0 && (
          <p className="mt-4 text-xs text-amber">
            Currently missing: {missing.join(', ')}
          </p>
        )}
        <p className="mt-4 text-xs text-mist">
          Set these in Vercel under Project Settings &middot; Environment
          Variables. Full list and setup steps in DEPLOY.md.
        </p>
      </section>

      <section className="card mt-6 p-6">
        <p className="heading-ui text-gold">After configuration</p>
        <ol className="mt-4 space-y-2 text-sm text-bone">
          <li>1. Run migrations 00001 through 00004 in the Supabase SQL editor.</li>
          <li>2. Optionally run supabase/seed.sql for demo locations.</li>
          <li>3. Redeploy the Vercel project.</li>
          <li>4. Return here and sign in with a magic link.</li>
        </ol>
      </section>
    </main>
  )
}
