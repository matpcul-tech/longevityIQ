'use client'

import { useState } from 'react'
import PanelUploadModal from './PanelUploadModal'

type Props = {
  drawnAt: string | null
  lab: string | null
  phenoAge: number | null
  chronologicalAge: number | null
  markerCount: number
  existing?: Record<string, number>
}

function delta(phenoAge: number | null, chrono: number | null) {
  if (phenoAge === null || chrono === null) return null
  return Math.round((phenoAge - chrono) * 10) / 10
}

export default function PanelHeader({
  drawnAt,
  lab,
  phenoAge,
  chronologicalAge,
  markerCount,
  existing,
}: Props) {
  const [open, setOpen] = useState(false)
  const d = delta(phenoAge, chronologicalAge)

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="card p-8">
          <p className="heading-ui text-teal">PhenoAge · Levine 2018</p>
          <div className="mt-4 flex items-baseline gap-6">
            <p className="heading-display text-6xl text-bone">
              {phenoAge !== null ? phenoAge.toFixed(1) : 'No panel yet'}
            </p>
            {chronologicalAge !== null && (
              <p className="text-sm text-mist">
                Chronological {chronologicalAge}
                {d !== null && (
                  <span className={`ml-2 ${d < 0 ? 'text-teal' : 'text-amber'}`}>
                    {d < 0 ? `${Math.abs(d)} yrs younger` : `${d} yrs older`}
                  </span>
                )}
              </p>
            )}
          </div>
          <p className="mt-4 max-w-xl text-xs text-mist">
            Computed from albumin, creatinine, fasting glucose, hs-CRP, lymphocyte
            percent, MCV, RDW, alkaline phosphatase and WBC. Predicts all-cause
            mortality with hazard ratios independent of chronological age.
          </p>
        </section>
        <section className="card p-8">
          <p className="heading-ui text-teal">Latest Draw</p>
          <p className="heading-display mt-3 text-2xl text-bone">
            {drawnAt
              ? new Date(drawnAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'No panels recorded'}
          </p>
          <p className="mt-1 text-xs text-mist">{lab ?? 'Lab not specified'}</p>
          <p className="mt-4 text-xs text-mist">
            {markerCount} of 46 markers captured
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-gold mt-6"
          >
            Upload New Panel
          </button>
        </section>
      </div>
      <PanelUploadModal open={open} onClose={() => setOpen(false)} existing={existing} />
    </>
  )
}
