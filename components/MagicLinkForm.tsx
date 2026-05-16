'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Props = {
  portal: 'consumer' | 'franchise' | 'clinical'
  accent?: 'gold' | 'amber' | 'teal'
}

const accents = {
  gold: 'text-gold',
  amber: 'text-amber',
  teal: 'text-teal',
}

export default function MagicLinkForm({ portal, accent = 'gold' }: Props) {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(urlError)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    try {
      const res = await fetch('/api/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, portal }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Could not send the magic link.')
      }
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="card p-8 text-sm text-bone">
        <p className={`heading-ui ${accents[accent]}`}>Check your inbox</p>
        <p className="heading-display mt-4 text-2xl font-light">
          We sent a sign-in link to {email}.
        </p>
        <p className="mt-3 text-mist">
          The link expires in fifteen minutes. Open it on this device to continue into
          the portal.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-8 text-sm">
      <label className="block">
        <span className="heading-ui text-mist">Email address</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
          className="input-field mt-2"
        />
      </label>
      {error && <p className="text-amber">{error}</p>}
      <button type="submit" disabled={status === 'sending'} className="btn-gold w-full">
        {status === 'sending' ? 'Sending magic link' : 'Send Magic Link'}
      </button>
      <p className="text-xs text-mist">
        No passwords. Magic link delivery via Resend, signed and rate limited by Supabase.
      </p>
    </form>
  )
}
