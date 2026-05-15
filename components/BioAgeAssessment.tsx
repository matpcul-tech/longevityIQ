'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BIO_AGE_QUESTIONS } from '@/lib/biomarkers'

type Props = {
  chronologicalAge: number | null
  bioAge: number | null
  existingScores: Record<string, number> | null
}

export default function BioAgeAssessment({
  chronologicalAge,
  bioAge,
  existingScores,
}: Props) {
  const router = useRouter()
  const [retake, setRetake] = useState(false)
  const [age, setAge] = useState<number | ''>(chronologicalAge ?? '')
  const [scores, setScores] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasResult = bioAge !== null && chronologicalAge !== null && !retake

  const delta = useMemo(() => {
    if (bioAge === null || chronologicalAge === null) return null
    return bioAge - chronologicalAge
  }, [bioAge, chronologicalAge])

  if (hasResult) {
    return (
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-8">
          <p className="heading-ui text-gold">Your Biological Age</p>
          <p className="heading-display mt-4 text-6xl text-bone">{bioAge}</p>
          <p className="mt-3 text-sm text-mist">
            Chronological age {chronologicalAge}. {deltaLabel(delta)}.
          </p>
          <button
            type="button"
            onClick={() => setRetake(true)}
            className="btn-ghost mt-8"
          >
            Retake Assessment
          </button>
        </div>
        <div className="card p-8">
          <p className="heading-ui text-gold">Last Inputs</p>
          <ul className="mt-6 space-y-3 text-sm text-bone">
            {BIO_AGE_QUESTIONS.map((q) => (
              <li key={q.key} className="flex justify-between border-b border-edge pb-3">
                <span>{q.prompt}</span>
                <span className="heading-ui text-mist">
                  {existingScores?.[q.key] ? `Score ${existingScores[q.key]}` : 'Unscored'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (typeof age !== 'number' || age < 18 || age > 100) {
      setError('Enter a chronological age between 18 and 100.')
      return
    }
    if (Object.keys(scores).length !== BIO_AGE_QUESTIONS.length) {
      setError('Answer every question to compute your bio age.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/bio-age', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chronologicalAge: age, scores }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Could not save the assessment.')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="card p-6">
        <label className="block">
          <span className="heading-ui text-gold">Chronological Age</span>
          <input
            type="number"
            min={18}
            max={100}
            required
            value={age}
            onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
            className="input-field mt-2 max-w-xs"
          />
        </label>
      </div>

      {BIO_AGE_QUESTIONS.map((q, idx) => (
        <fieldset key={q.key} className="card p-6">
          <legend className="heading-ui text-gold">
            Question 0{idx + 1}
          </legend>
          <p className="heading-display mt-3 text-2xl text-bone">{q.prompt}</p>
          <p className="mt-1 text-xs text-mist">{q.helper}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {q.options.map((option) => {
              const active = scores[q.key] === option.score
              return (
                <label
                  key={option.label}
                  className={`flex cursor-pointer items-center justify-between rounded border px-4 py-3 text-sm ${
                    active
                      ? 'border-gold bg-gold/10 text-bone'
                      : 'border-edge text-mist hover:border-gold/60'
                  }`}
                >
                  <span>{option.label}</span>
                  <input
                    type="radio"
                    name={q.key}
                    value={option.score}
                    checked={active}
                    onChange={() =>
                      setScores((s) => ({ ...s, [q.key]: option.score }))
                    }
                    className="sr-only"
                  />
                  <span className="heading-ui text-gold">{option.score}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}

      {error && <p className="text-sm text-amber">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-gold">
        {submitting ? 'Scoring' : 'Compute Bio Age'}
      </button>
    </form>
  )
}

function deltaLabel(delta: number | null) {
  if (delta === null) return 'Insufficient data'
  if (delta < 0) return `You read ${Math.abs(delta)} years younger than chronological`
  if (delta > 0) return `You read ${delta} years older than chronological`
  return 'Matched to chronological age'
}
