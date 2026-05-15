import {
  PANEL,
  categorize,
  categoryLabel,
  statusFor,
  type BiomarkerSpec,
  type BiomarkerCategory,
} from '@sovereign/clinical-core'

export type ResultRow = {
  slug: string
  value: number | null
  unit: string | null
  status: string | null
}

type Props = {
  results: ResultRow[]
}

const STATUS_TONE: Record<string, string> = {
  optimal: 'text-teal',
  normal: 'text-bone',
  high: 'text-amber',
  low: 'text-amber',
  critical: 'text-red-400',
}

const STATUS_BORDER: Record<string, string> = {
  optimal: 'border-teal/40',
  normal: 'border-edge',
  high: 'border-amber/40',
  low: 'border-amber/40',
  critical: 'border-red-400/60',
}

export default function PanelView({ results }: Props) {
  const byCat = categorize()
  const valueMap = new Map(results.map((r) => [r.slug, r]))
  const orderedCats: BiomarkerCategory[] = [
    'metabolic',
    'lipids',
    'inflammation',
    'hormones',
    'hematology',
    'vitamins',
    'organ',
  ]

  return (
    <div className="space-y-8">
      {orderedCats.map((cat) => (
        <section key={cat}>
          <header className="flex items-baseline justify-between">
            <p className="heading-ui text-teal">{categoryLabel(cat)}</p>
            <p className="text-xs text-mist">{byCat[cat].length} markers</p>
          </header>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {byCat[cat].map((spec) => (
              <MarkerRow key={spec.slug} spec={spec} result={valueMap.get(spec.slug)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function MarkerRow({
  spec,
  result,
}: {
  spec: BiomarkerSpec
  result: ResultRow | undefined
}) {
  const hasValue = result && typeof result.value === 'number'
  const status = hasValue && result?.value !== null ? statusFor(spec, result.value) : null
  const tone = status ? STATUS_TONE[status] ?? 'text-bone' : 'text-mist'
  const border = status ? STATUS_BORDER[status] ?? 'border-edge' : 'border-edge'

  return (
    <li className={`card border ${border} p-4`}>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="font-body text-sm text-bone">{spec.name}</p>
          <p className="text-xs text-mist">
            Optimal {spec.optimalLow}–{spec.optimalHigh} {spec.unit}
          </p>
        </div>
        <div className="text-right">
          <p className={`heading-display text-2xl ${tone}`}>
            {hasValue && result?.value !== null
              ? formatValue(result.value as number, spec.unit)
              : 'No data'}
          </p>
          {status && (
            <p className={`heading-ui text-xs ${tone}`}>{status}</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-mist">{spec.rationale}</p>
    </li>
  )
}

function formatValue(value: number, _unit: string) {
  if (Math.abs(value) >= 100) return value.toFixed(0)
  if (Math.abs(value) >= 10) return value.toFixed(1)
  return value.toFixed(2)
}

export function totalMarkers() {
  return PANEL.length
}
