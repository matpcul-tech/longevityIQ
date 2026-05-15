'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type NavItem = { label: string; href: string }

type Props = {
  portalLabel: string
  homeHref: string
  email: string | null
  items: NavItem[]
  accent?: 'gold' | 'amber' | 'teal'
}

const accents: Record<NonNullable<Props['accent']>, string> = {
  gold: 'text-gold',
  amber: 'text-amber',
  teal: 'text-teal',
}

export default function Nav({
  portalLabel,
  homeHref,
  email,
  items,
  accent = 'gold',
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function signOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <header className="border-b border-edge bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
        <Link href={homeHref} className={`heading-ui ${accents[accent]}`}>
          LongevityIQ &middot; {portalLabel}
        </Link>
        <div className="flex items-center gap-4 text-xs text-mist">
          {email && <span className="hidden sm:inline">{email}</span>}
          <button onClick={signOut} disabled={signingOut} className="btn-ghost">
            {signingOut ? 'Signing out' : 'Sign Out'}
          </button>
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
        {items.map((item) => {
          const active =
            item.href === homeHref
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`heading-ui rounded-t px-4 py-3 ${
                active
                  ? `${accents[accent]} border-b border-current`
                  : 'text-mist hover:text-bone'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
