type Row = {
  label: string
  value: number
  accent?: 'gold' | 'amber' | 'teal'
}

type Props = {
  title: string
  rows: Row[]
  total: number
  currency?: string
}

const tones: Record<NonNullable<Row['accent']>, string> = {
  gold: 'bg-gold',
  amber: 'bg-amber',
  teal: 'bg-teal',
}

export default function RevenueChart({ title, rows, total, currency = 'USD' }: Props) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between">
        <p className="heading-ui text-gold">{title}</p>
        <p className="heading-display text-2xl text-bone">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(total)}
        </p>
      </div>
      <ul className="mt-6 space-y-4">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex justify-between text-xs text-mist">
              <span>{row.label}</span>
              <span>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(row.value)}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-edge">
              <div
                className={`h-1.5 rounded-full ${tones[row.accent ?? 'gold']}`}
                style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
