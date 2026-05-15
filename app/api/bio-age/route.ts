import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeBioAge } from '@/lib/lifestyle-score'

export async function POST(request: Request) {
  let body: { chronologicalAge?: number; scores?: Record<string, number> } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const chronological = Number(body.chronologicalAge)
  if (!Number.isFinite(chronological) || chronological < 18 || chronological > 100) {
    return NextResponse.json({ error: 'Chronological age must be between 18 and 100.' }, { status: 400 })
  }

  const scores = body.scores ?? {}
  const valid = Object.values(scores).every(
    (v) => typeof v === 'number' && v >= 1 && v <= 5
  )
  if (!valid) {
    return NextResponse.json({ error: 'Scores must be numbers from 1 to 5.' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const bioAge = computeBioAge(scores, chronological)

  const { error } = await supabase
    .from('consumer_profiles')
    .update({
      chronological_age: chronological,
      assessment_scores: scores,
      bio_age: bioAge,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', auth.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, bioAge })
}
