'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
      // Calling from the browser client (not /api/magic-link) so that the
      // PKCE code verifier is stored in cookies on THIS browser. The same
      // browser then opens the magic link, the verifier is still in its
      // cookie jar, and exchangeCodeForSession succeeds. If we called the
      // server route instead, the verifier would be saved on the server
      // response cookie which does not always survive a fetch round-trip
      // and a subsequent navigation.
      const supabase = createClient()
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (typeof window !== 'undefined' ? window.location.origin : '')
      const cleanOrigin = (() => {
        try {
          const parsed = new URL(origin)
          return `${parsed.protocol}//${parsed.host}`
        } catch {
          return origin
        }
      })()
      const redirectTo = `${cleanOrigin}/auth/callback?next=/${portal}/dashboard`

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
      })
      if (error) throw new Error(error.message)
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
          The link expires in fifteen minutes. Open it on this device, in this
          browser. Opening from a different browser, app, or device will break
          the sign-in flow.
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
