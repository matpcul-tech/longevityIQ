import PanelHeader from '@/components/biomarkers/PanelHeader'
import PanelView, { type ResultRow } from '@/components/biomarkers/PanelView'
import { requireConsumer } from '@/lib/consumer'

export default async function BiomarkersTab() {
  const { supabase, profile } = await requireConsumer()

  const { data: panel } = await supabase
    .from('biomarker_panels')
    .select('id, drawn_at, lab, phenoage')
    .eq('consumer_id', profile.id)
    .order('drawn_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let results: ResultRow[] = []
  let existing: Record<string, number> = {}
  if (panel) {
    const { data: rows } = await supabase
      .from('biomarker_results')
      .select('marker_slug, value, unit, status')
      .eq('panel_id', panel.id)
    results = (rows ?? []).map((r) => ({
      slug: r.marker_slug as string,
      value: r.value as number | null,
      unit: (r.unit as string | null) ?? null,
      status: (r.status as string | null) ?? null,
    }))
    existing = Object.fromEntries(
      results.filter((r) => r.value !== null).map((r) => [r.slug, r.value as number]),
    )
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="heading-ui text-teal">Biomarkers</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Your 46-marker clinical record.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          The science under the spa. Levine PhenoAge from validated blood inputs,
          longevity-optimization ranges (not just lab reference), and every value
          contributing to the Sovereign AI as anonymized training signal.
        </p>
      </header>
      <PanelHeader
        drawnAt={panel?.drawn_at as string | null | undefined ?? null}
        lab={panel?.lab as string | null | undefined ?? null}
        phenoAge={(panel?.phenoage as number | null | undefined) ?? null}
        chronologicalAge={profile.chronological_age}
        markerCount={results.filter((r) => r.value !== null).length}
        existing={existing}
      />
      <PanelView results={results} />
    </div>
  )
}
