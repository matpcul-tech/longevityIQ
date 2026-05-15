'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  WEARABLE_PROVIDERS,
  type WearableProvider,
  type WearableDailyMetrics,
} from '@sovereign/clinical-core'

type Connection = {
  provider: WearableProvider
  status: string
  lastSyncedAt: string | null
}

type Props = {
  metrics: WearableDailyMetrics[]
  connection: Connection | null
}

const PROVIDER_LABEL: Record<WearableProvider, string> = {
  apple_health: 'Apple Health',
  google_fit: 'Google Fit',
  oura: 'Oura',
  whoop: 'Whoop',
  garmin: 'Garmin',
  polar: 'Polar',
  fitbit: 'Fitbit',
  eight_sleep: 'Eight Sleep',
  continuous_glucose: 'Continuous Glucose Monitor',
}

export default function WearableDashboard({ metrics, connection }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [picker, setPicker] = useState<WearableProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const today = metrics[0]
  const trailing = metrics.slice(0, 14)

  function call(method: 'POST' | 'DELETE', body?: unknown) {
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/wearables/connect', {
        method,
        headers: { 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? 'Could not update connection.')
        return
      }
      setPicker(null)
      router.refresh()
    })
  }

  async function seedDemo() {
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/wearables/seed-demo', { method: 'POST' })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? 'Could not seed demo metrics.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <div className="card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="heading-ui text-gold">Connection</p>
          <p className="heading-display mt-2 text-2xl text-bone">
            {connection
              ? `${PROVIDER_LABEL[connection.provider]} linked`
              : 'No device connected'}
          </p>
          <p className="mt-1 text-xs text-mist">
            {connection?.lastSyncedAt
              ? `Last sync ${new Date(connection.lastSyncedAt).toLocaleString()}`
              : 'Connect a device or seed demo metrics to populate your record.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {connection ? (
            <button
              type="button"
              onClick={() => call('DELETE')}
              disabled={pending}
              className="btn-ghost"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPicker('apple_health')}
              disabled={pending}
              className="btn-gold"
            >
              Connect Device
            </button>
          )}
          <button
            type="button"
            onClick={seedDemo}
            disabled={pending}
            className="btn-ghost"
          >
            Seed Demo Stream
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-amber">{error}</p>}

      {picker && (
        <div className="card p-6">
          <p className="heading-ui text-gold">Select Provider</p>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {WEARABLE_PROVIDERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => call('POST', { provider: p })}
                disabled={pending}
                className="rounded border border-edge px-4 py-3 text-left text-sm text-bone transition hover:border-gold"
              >
                {PROVIDER_LABEL[p]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPicker(null)}
            className="btn-ghost mt-4"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <Tile label="Resting HR" value={fmt(today?.restingHr ?? null, 'bpm')} accent="gold" />
        <Tile label="HRV" value={fmt(today?.hrvRmssd ?? null, 'ms')} accent="teal" />
        <Tile label="SpO2" value={fmt(today?.spo2 ?? null, '%')} accent="amber" />
        <Tile label="Steps Today" value={fmtInt(today?.steps ?? null)} accent="gold" />
        <Tile
          label="Sleep Last Night"
          value={today?.sleepHours !== null && today?.sleepHours !== undefined
            ? `${today.sleepHours.toFixed(1)} h`
            : 'No data'}
          accent="teal"
        />
        <Tile
          label="Recovery"
          value={today?.recoveryScore !== null && today?.recoveryScore !== undefined
            ? `${today.recoveryScore} / 100`
            : 'No data'}
          accent="amber"
        />
      </div>

      <section>
        <p className="heading-ui text-gold">Last 14 Days</p>
        <div className="card mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-mist">
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Rest HR</th>
                <th className="px-5 py-4">HRV</th>
                <th className="px-5 py-4">Sleep</th>
                <th className="px-5 py-4">Recovery</th>
                <th className="px-5 py-4">Steps</th>
                <th className="px-5 py-4">VO2 Max</th>
              </tr>
            </thead>
            <tbody>
              {trailing.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-mist">
                    No metrics yet. Connect a device or seed the demo stream.
                  </td>
                </tr>
              ) : (
                trailing.map((m) => (
                  <tr key={m.date} className="border-t border-edge text-bone">
                    <td className="px-5 py-3 text-mist">
                      {new Date(m.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3">{fmt(m.restingHr, '')}</td>
                    <td className="px-5 py-3">{fmt(m.hrvRmssd, '')}</td>
                    <td className="px-5 py-3">
                      {m.sleepHours !== null ? `${m.sleepHours.toFixed(1)}` : '—'}
                    </td>
                    <td className="px-5 py-3">{m.recoveryScore ?? '—'}</td>
                    <td className="px-5 py-3">{fmtInt(m.steps)}</td>
                    <td className="px-5 py-3">{fmt(m.vo2Max, '')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'gold' | 'amber' | 'teal'
}) {
  const tone = accent === 'gold' ? 'text-gold' : accent === 'amber' ? 'text-amber' : 'text-teal'
  return (
    <div className="card p-6">
      <p className={`heading-ui ${tone}`}>{label}</p>
      <p className="heading-display mt-3 text-4xl text-bone">{value}</p>
    </div>
  )
}

function fmt(v: number | null, unit: string) {
  if (v === null || v === undefined) return 'No data'
  return `${v.toFixed(1)} ${unit}`.trim()
}

function fmtInt(v: number | null) {
  if (v === null || v === undefined) return 'No data'
  return v.toLocaleString()
}
