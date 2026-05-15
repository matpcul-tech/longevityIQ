import Link from 'next/link'

type Props = {
  eyebrow: string
  title: string
  description: string
  href: string
  cta: string
  accent?: 'gold' | 'amber' | 'teal'
}

const accents: Record<NonNullable<Props['accent']>, string> = {
  gold: 'text-gold border-gold/40',
  amber: 'text-amber border-amber/40',
  teal: 'text-teal border-teal/50',
}

export default function PortalCard({
  eyebrow,
  title,
  description,
  href,
  cta,
  accent = 'gold',
}: Props) {
  return (
    <article className="card flex h-full flex-col p-8 transition hover:shadow-gilt">
      <p className={`heading-ui ${accents[accent].split(' ')[0]}`}>{eyebrow}</p>
      <h3 className="heading-display mt-4 text-3xl font-light text-bone">{title}</h3>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-mist">{description}</p>
      <Link href={href} className={`btn-ghost mt-8 inline-block text-center ${accents[accent]}`}>
        {cta}
      </Link>
    </article>
  )
}
