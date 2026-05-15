type Props = {
  insight: string | null
  generatedAt: string | null
  loading?: boolean
}

export default function InsightCard({ insight, generatedAt, loading }: Props) {
  const stamp = generatedAt
    ? new Date(generatedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Not yet generated'

  return (
    <div className="card p-8">
      <div className="flex items-center justify-between">
        <p className="heading-ui text-gold">Daily Insight</p>
        <span className="text-xs text-mist">{stamp}</span>
      </div>
      <p className="heading-display mt-6 text-2xl font-light leading-relaxed text-bone">
        {loading
          ? 'Composing your insight from the latest signals.'
          : insight ?? 'No insight yet. Complete the bio age assessment to unlock today’s read.'}
      </p>
    </div>
  )
}
