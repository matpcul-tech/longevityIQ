import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDailyInsight } from '@/lib/anthropic'
import { PHASE_1_PROTOCOLS } from '@/lib/protocols'

const REFRESH_WINDOW_HOURS = 20

export async function POST() {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('consumer_profiles')
    .select('*')
    .eq('user_id', auth.user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  const { data: latest } = await supabase
    .from('daily_insights')
    .select('id, insight_text, generated_at')
    .eq('consumer_id', profile.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest) {
    const ageHours =
      (Date.now() - new Date(latest.generated_at as string).getTime()) / (1000 * 60 * 60)
    if (ageHours < REFRESH_WINDOW_HOURS) {
      return NextResponse.json({
        ok: true,
        cached: true,
        insight: latest.insight_text,
        generatedAt: latest.generated_at,
      })
    }
  }

  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('service')
    .eq('consumer_id', profile.id)
    .order('scheduled_for', { ascending: false })
    .limit(5)

  const recentProtocols = (recentBookings ?? [])
    .map((row) => PHASE_1_PROTOCOLS.find((p) => p.slug === row.service)?.name)
    .filter((v): v is string => Boolean(v))

  const insightText = await generateDailyInsight({
    email: profile.email,
    tier: profile.tier,
    bioAge: profile.bio_age,
    chronologicalAge: profile.chronological_age,
    assessmentScores: profile.assessment_scores ?? {},
    recentProtocols,
  })

  const { data: stored, error } = await supabase
    .from('daily_insights')
    .insert({ consumer_id: profile.id, insight_text: insightText })
    .select('id, insight_text, generated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    cached: false,
    insight: stored.insight_text,
    generatedAt: stored.generated_at,
  })
}
