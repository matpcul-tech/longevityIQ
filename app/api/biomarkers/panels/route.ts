import { NextResponse } from 'next/server'
import {
  PANEL,
  panelBySlug,
  computePhenoAge,
  statusFor,
  ageToBand,
  normalizeSex,
  type PhenoAgeInputs,
} from '@sovereign/clinical-core'
import { createClient } from '@/lib/supabase/server'
import { emitTraining, hashUserId } from '@/lib/training'

type Payload = {
  drawn_at?: string
  lab?: string
  notes?: string
  markers?: Array<{ slug: string; value: number }>
}

const PHENOAGE_FIELDS = {
  albumin: 'albumin_g_dL',
  creatinine: 'creatinine_mg_dL',
  glucose: 'glucose_mg_dL',
  hs_crp: 'crp_mg_L',
  lymphocytes_pct: 'lymphocyte_pct',
  mcv: 'mcv_fL',
  rdw: 'rdw_pct',
  alk_phos: 'alk_phos_U_L',
  wbc: 'wbc_10e3_uL',
} as const

export async function POST(request: Request) {
  let payload: Payload = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!payload.drawn_at || !payload.markers || payload.markers.length === 0) {
    return NextResponse.json(
      { error: 'drawn_at and at least one marker required.' },
      { status: 400 },
    )
  }

  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('consumer_profiles')
    .select('id, chronological_age')
    .eq('user_id', auth.user.id)
    .single()
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  // Validate marker slugs.
  const valuesBySlug = new Map<string, number>()
  for (const m of payload.markers) {
    const spec = panelBySlug(m.slug)
    if (!spec) {
      return NextResponse.json({ error: `Unknown marker: ${m.slug}` }, { status: 400 })
    }
    if (!Number.isFinite(m.value)) {
      return NextResponse.json({ error: `Invalid value for ${m.slug}.` }, { status: 400 })
    }
    valuesBySlug.set(m.slug, m.value)
  }

  // Compute PhenoAge if we have all 9 inputs.
  let phenoage: number | null = null
  const chronoAge = (profile.chronological_age as number | null) ?? null
  if (chronoAge !== null) {
    const candidate: Partial<PhenoAgeInputs> = { age_years: chronoAge }
    let complete = true
    for (const [slug, key] of Object.entries(PHENOAGE_FIELDS) as Array<
      [keyof typeof PHENOAGE_FIELDS, (typeof PHENOAGE_FIELDS)[keyof typeof PHENOAGE_FIELDS]]
    >) {
      const v = valuesBySlug.get(slug)
      if (typeof v !== 'number') {
        complete = false
        break
      }
      candidate[key] = v
    }
    if (complete) {
      phenoage = computePhenoAge(candidate as PhenoAgeInputs)
    }
  }

  // Insert panel.
  const { data: panel, error: panelErr } = await supabase
    .from('biomarker_panels')
    .insert({
      consumer_id: profile.id,
      drawn_at: payload.drawn_at,
      lab: payload.lab ?? null,
      notes: payload.notes ?? null,
      phenoage,
    })
    .select('id')
    .single()

  if (panelErr || !panel) {
    return NextResponse.json(
      { error: panelErr?.message ?? 'Could not create panel.' },
      { status: 400 },
    )
  }

  // Insert each marker result.
  const resultRows = Array.from(valuesBySlug.entries()).map(([slug, value]) => {
    const spec = panelBySlug(slug)!
    return {
      panel_id: panel.id,
      marker_slug: slug,
      marker_name: spec.name,
      category: spec.category,
      value,
      unit: spec.unit,
      ref_low: spec.refLow,
      ref_high: spec.refHigh,
      optimal_low: spec.optimalLow,
      optimal_high: spec.optimalHigh,
      status: statusFor(spec, value),
    }
  })
  const { error: resultsErr } = await supabase
    .from('biomarker_results')
    .insert(resultRows)
  if (resultsErr) {
    return NextResponse.json({ error: resultsErr.message }, { status: 400 })
  }

  // Cache phenoage on the consumer profile for quick reads.
  if (phenoage !== null) {
    await supabase
      .from('consumer_profiles')
      .update({
        phenoage,
        phenoage_updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
  }

  // Emit training event.
  try {
    const subjectHash = await hashUserId(auth.user.id)
    if (!subjectHash) throw new Error('training disabled')
    await emitTraining({
      type: 'biomarker_panel_recorded',
      subjectHash,
      ageBand: ageToBand(chronoAge ?? undefined),
      sex: normalizeSex(null),
      panel: {
        drawnAt: payload.drawn_at,
        phenoAge: phenoage,
        chronologicalAge: chronoAge ?? 0,
        phenoAgeDelta: phenoage !== null && chronoAge !== null ? phenoage - chronoAge : null,
        markers: PANEL.map((spec) => {
          const value = valuesBySlug.get(spec.slug) ?? null
          return {
            slug: spec.slug,
            value,
            unit: spec.unit,
            status: value !== null ? statusFor(spec, value) : null,
          }
        }),
      },
    })
  } catch {
    // Training emission is best-effort.
  }

  return NextResponse.json({ ok: true, id: panel.id, phenoage })
}

export async function GET() {
  return NextResponse.json({ count: PANEL.length, markers: PANEL.map((m) => m.slug) })
}
