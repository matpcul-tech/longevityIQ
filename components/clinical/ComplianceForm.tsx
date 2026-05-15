'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  partnerId: string
  initial: {
    name: string
    license_type: string | null
    license_number_masked: string | null
    state: string | null
    dea_masked: string | null
    malpractice_expiry: string | null
    revenue_share_pct: number
  }
}

function maskValue(input: string) {
  const trimmed = input.trim()
  if (trimmed.length <= 4) return trimmed
  return `${trimmed.slice(0, 2)}-XXX-${trimmed.slice(-4)}`
}

export default function ComplianceForm({ partnerId, initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [draft, setDraft] = useState({
    name: initial.name,
    license_type: initial.license_type ?? '',
    license_number_masked: initial.license_number_masked ?? '',
    state: initial.state ?? '',
    dea_masked: initial.dea_masked ?? '',
    malpractice_expiry: initial.malpractice_expiry ?? '',
    revenue_share_pct: initial.revenue_share_pct,
  })
  const [licenseInput, setLicenseInput] = useState('')
  const [deaInput, setDeaInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function update<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const payload: Record<string, unknown> = {
      partnerId,
      name: draft.name,
      license_type: draft.license_type || null,
      state: draft.state || null,
      malpractice_expiry: draft.malpractice_expiry || null,
      revenue_share_pct: Number(draft.revenue_share_pct),
    }
    if (licenseInput.trim()) payload.license_number_masked = maskValue(licenseInput)
    else payload.license_number_masked = draft.license_number_masked || null
    if (deaInput.trim()) payload.dea_masked = maskValue(deaInput)
    else payload.dea_masked = draft.dea_masked || null

    startTransition(async () => {
      const res = await fetch('/api/clinical/partner', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Could not save compliance details.')
        return
      }
      setMessage('Compliance record updated.')
      setLicenseInput('')
      setDeaInput('')
      router.refresh()
    })
  }

  const expiryDays = draft.malpractice_expiry
    ? Math.round(
        (new Date(draft.malpractice_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="card grid gap-4 p-6 md:grid-cols-2">
        <label className="block text-sm">
          <span className="heading-ui text-mist">Practitioner name</span>
          <input
            className="input-field mt-2"
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="heading-ui text-mist">License type</span>
          <input
            className="input-field mt-2"
            value={draft.license_type}
            onChange={(e) => update('license_type', e.target.value)}
            placeholder="MD, DO, NP, PA"
          />
        </label>
        <label className="block text-sm">
          <span className="heading-ui text-mist">State of practice</span>
          <input
            className="input-field mt-2"
            value={draft.state}
            onChange={(e) => update('state', e.target.value)}
            placeholder="NY"
          />
        </label>
        <label className="block text-sm">
          <span className="heading-ui text-mist">Revenue share</span>
          <input
            type="number"
            min={0}
            max={100}
            className="input-field mt-2"
            value={draft.revenue_share_pct}
            onChange={(e) => update('revenue_share_pct', Number(e.target.value))}
          />
        </label>
      </div>

      <div className="card grid gap-4 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="heading-ui text-teal">Sensitive Identifiers</p>
          <p className="mt-1 text-xs text-mist">
            License and DEA numbers are stored masked. The full value is never persisted
            and only your last four characters are kept.
          </p>
        </div>
        <label className="block text-sm">
          <span className="heading-ui text-mist">Current stored license</span>
          <input
            className="input-field mt-2 font-mono"
            value={draft.license_number_masked}
            disabled
          />
        </label>
        <label className="block text-sm">
          <span className="heading-ui text-mist">Replace license number</span>
          <input
            type="password"
            className="input-field mt-2"
            value={licenseInput}
            onChange={(e) => setLicenseInput(e.target.value)}
            placeholder="Type full license, we will mask it"
          />
        </label>
        <label className="block text-sm">
          <span className="heading-ui text-mist">Current stored DEA</span>
          <input
            className="input-field mt-2 font-mono"
            value={draft.dea_masked}
            disabled
          />
        </label>
        <label className="block text-sm">
          <span className="heading-ui text-mist">Replace DEA</span>
          <input
            type="password"
            className="input-field mt-2"
            value={deaInput}
            onChange={(e) => setDeaInput(e.target.value)}
            placeholder="Type full DEA, we will mask it"
          />
        </label>
      </div>

      <div className="card p-6">
        <p className="heading-ui text-teal">Malpractice Insurance</p>
        <label className="mt-3 block text-sm">
          <span className="heading-ui text-mist">Expiration date</span>
          <input
            type="date"
            className="input-field mt-2 max-w-xs"
            value={draft.malpractice_expiry}
            onChange={(e) => update('malpractice_expiry', e.target.value)}
          />
        </label>
        {expiryDays !== null && (
          <p
            className={`mt-3 text-sm ${
              expiryDays <= 30
                ? 'text-amber'
                : expiryDays <= 90
                  ? 'text-gold'
                  : 'text-mist'
            }`}
          >
            {expiryDays > 0
              ? `Insurance expires in ${expiryDays} days.`
              : `Insurance lapsed ${Math.abs(expiryDays)} days ago. Update immediately.`}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-amber">{error}</p>}
      {message && <p className="text-sm text-teal">{message}</p>}

      <button type="submit" disabled={pending} className="btn-gold">
        {pending ? 'Saving' : 'Save Compliance Record'}
      </button>
    </form>
  )
}
