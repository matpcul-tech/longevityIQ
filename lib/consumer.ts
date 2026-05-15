import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type ConsumerProfile = {
  id: string
  user_id: string
  email: string
  full_name: string | null
  chronological_age: number | null
  tier: 'free' | 'essential' | 'optimizer' | 'sovereign'
  bio_age: number | null
  assessment_scores: Record<string, number> | null
  tribal_verified: boolean
  enrollment_number: string | null
  fqhc_org_code: string | null
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export async function requireConsumer() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    redirect('/consumer')
  }

  const user = data.user
  const { data: existing } = await supabase
    .from('consumer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return { supabase, user, profile: existing as ConsumerProfile }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('consumer_profiles')
    .insert({
      user_id: user.id,
      email: user.email ?? '',
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
    })
    .select('*')
    .single()

  if (insertError || !inserted) {
    // RLS or duplicate key. Fall back to a synthesized profile so the dashboard still renders.
    return {
      supabase,
      user,
      profile: {
        id: user.id,
        user_id: user.id,
        email: user.email ?? '',
        full_name: null,
        chronological_age: null,
        tier: 'free',
        bio_age: null,
        assessment_scores: {},
        tribal_verified: false,
        enrollment_number: null,
        fqhc_org_code: null,
        stripe_customer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } satisfies ConsumerProfile,
    }
  }

  return { supabase, user, profile: inserted as ConsumerProfile }
}
