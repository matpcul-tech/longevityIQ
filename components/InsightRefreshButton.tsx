'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  ageHours: number | null
}

export default function InsightRefreshButton({ ageHours }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canRefresh = ageHours === null || ageHours >= 20

  async function refresh() {
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/insight', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Could not refresh.')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={refresh}
        disabled={pending || !canRefresh}
        className="btn-gold self-start"
      >
        {pending
          ? 'Generating'
          : canRefresh
            ? 'Refresh Today’s Insight'
            : 'Next refresh available later today'}
      </button>
      {error && <p className="text-sm text-amber">{error}</p>}
    </div>
  )
}
