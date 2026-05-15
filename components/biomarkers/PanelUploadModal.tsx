'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PANEL, categorize, categoryLabel, type BiomarkerCategory } from '@sovereign/clinical-core'

const ORDERED_CATS: BiomarkerCategory[] = [
  'metabolic',
  'lipids',
  'inflammation',
  'hormones',
  'hematology',
  'vitamins',
  'organ',
]

type Props = {
  open: boolean
  onClose: () => void
  existing?: Record<string, number>
}

export default function PanelUploadModal({ open, onClose, existing }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [drawnAt, setDrawnAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [lab, setLab] = useState('Quest Diagnostics')
  const [notes, setNotes] = useState('')
  const [values, setValues] = useState<Record<string, string>>(() =>
    existing
      ? Object.fromEntries(Object.entries(existing).map(([k, v]) => [k, String(v)]))
      : {},
  )
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const byCat = categorize()

  function setVal(slug: string, v: string) {
    setValues((s) => ({ ...s, [slug]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const markers: Array<{ slug: string; value: number }> = []
    for (const [slug, raw] of Object.entries(values)) {
      if (raw.trim() === '') continue
      const num = Number(raw)
      if (!Number.isFinite(num)) {
        setError(`Value for ${slug} must be numeric.`)
        return
      }
      markers.push({ slug, value: num })
    }
    if (markers.length === 0) {
      setError('Enter at least one biomarker value.')
      return
    }

    startTransition(async () => {
      const res = await fetch('/api/biomarkers/panels', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          drawn_at: drawnAt,
          lab,
          notes,
          markers,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Could not save panel.')
        return
      }
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/85 px-4 py-8">
      <div className="card relative w-full max-w-4xl p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-mist hover:text-teal"
          aria-label="Close"
        >
          x
        </button>
        <p className="heading-ui text-teal">New Panel</p>
        <h3 className="heading-display mt-2 text-2xl font-light text-bone">
          Upload your 46-marker draw.
        </h3>
        <p className="mt-2 text-xs text-mist">
          Enter only the values you have. PhenoAge auto-computes if the nine Levine
          inputs (albumin, creatinine, glucose, hs-CRP, lymphocyte %, MCV, RDW,
          alkaline phosphatase, WBC) are present.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm">
              <span className="heading-ui text-mist">Draw date</span>
              <input
                type="date"
                value={drawnAt}
                onChange={(e) => setDrawnAt(e.target.value)}
                className="input-field mt-2"
                required
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="heading-ui text-mist">Lab</span>
              <input
                value={lab}
                onChange={(e) => setLab(e.target.value)}
                className="input-field mt-2"
                placeholder="Quest, LabCorp, Boston Heart, Function Health"
              />
            </label>
          </div>

          {ORDERED_CATS.map((cat) => (
            <section key={cat}>
              <p className="heading-ui text-teal">{categoryLabel(cat)}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {byCat[cat].map((spec) => (
                  <label key={spec.slug} className="block text-xs">
                    <span className="heading-ui text-mist">{spec.name}</span>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        value={values[spec.slug] ?? ''}
                        onChange={(e) => setVal(spec.slug, e.target.value)}
                        placeholder={`${spec.optimalLow}–${spec.optimalHigh}`}
                        className="input-field"
                      />
                      <span className="text-mist">{spec.unit}</span>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          ))}

          <label className="block text-sm">
            <span className="heading-ui text-mist">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field mt-2 min-h-[80px]"
              placeholder="Fasting status, medications, supplementation"
            />
          </label>

          {error && <p className="text-sm text-amber">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="btn-gold">
              {pending ? 'Saving' : `Save ${PANEL.length}-marker panel`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
