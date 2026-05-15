'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalErrorBoundary]', error)
  }, [error])

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="heading-ui text-amber">Something went wrong</p>
      <h1 className="heading-display mt-4 text-4xl font-light text-bone">
        This screen could not load.
      </h1>
      <p className="mt-6 text-sm text-mist">
        The most common cause is that the portal&apos;s backend services have
        not been configured yet. If you just deployed, set the environment
        variables listed in DEPLOY.md and redeploy.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-mist">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-10 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn-gold">
          Try Again
        </button>
        <Link href="/" className="btn-ghost">
          Back to LongevityIQ
        </Link>
      </div>
    </main>
  )
}
