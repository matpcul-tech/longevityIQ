import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export type FranchiseLocation = {
  id: string
  operator_id: string | null
  location_name: string
  address: string | null
  city: string | null
  state: string | null
  org_code: string | null
  active_services: string[]
  monthly_fee: number
  hours: Record<string, string>
  contact_email: string | null
  contact_phone: string | null
  pricing_overrides: Record<string, number>
  is_demo: boolean
  created_at: string
}

const DEMO_HOURS = {
  monday: '06:00 to 21:00',
  tuesday: '06:00 to 21:00',
  wednesday: '06:00 to 21:00',
  thursday: '06:00 to 21:00',
  friday: '06:00 to 21:00',
  saturday: '08:00 to 18:00',
  sunday: '08:00 to 16:00',
}

const DEMO_LOCATION: FranchiseLocation = {
  id: 'demo-location',
  operator_id: null,
  location_name: 'LongevityIQ Manhattan',
  address: '300 Park Ave',
  city: 'New York',
  state: 'NY',
  org_code: 'LIQ-NYC-01',
  active_services: ['cryotherapy', 'red-light', 'hbot', 'contrast-therapy', 'vo2-baseline'],
  monthly_fee: 4500,
  hours: DEMO_HOURS,
  contact_email: 'concierge@longevityiq.com',
  contact_phone: '212-555-0123',
  pricing_overrides: {},
  is_demo: true,
  created_at: new Date().toISOString(),
}

function normalizeLocation(row: Record<string, unknown>): FranchiseLocation {
  return {
    id: row.id as string,
    operator_id: (row.operator_id as string | null) ?? null,
    location_name: row.location_name as string,
    address: (row.address as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    org_code: (row.org_code as string | null) ?? null,
    active_services: Array.isArray(row.active_services)
      ? (row.active_services as string[])
      : [],
    monthly_fee: Number(row.monthly_fee ?? 0),
    hours: (row.hours as Record<string, string> | null) ?? DEMO_HOURS,
    contact_email: (row.contact_email as string | null) ?? null,
    contact_phone: (row.contact_phone as string | null) ?? null,
    pricing_overrides:
      (row.pricing_overrides as Record<string, number> | null) ?? {},
    is_demo: Boolean(row.is_demo ?? false),
    created_at: (row.created_at as string) ?? new Date().toISOString(),
  }
}

export async function requireOperator() {
  if (!isSupabaseConfigured()) {
    redirect('/franchise')
  }
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    redirect('/franchise')
  }

  const { data: row } = await supabase
    .from('franchise_locations')
    .select('*')
    .eq('operator_id', auth.user.id)
    .maybeSingle()

  if (row) {
    return { supabase, user: auth.user, location: normalizeLocation(row), demo: false }
  }

  // No claimed location yet. Try to load a demo seed for preview.
  const { data: seed } = await supabase
    .from('franchise_locations')
    .select('*')
    .eq('org_code', 'LIQ-NYC-01')
    .maybeSingle()

  const location = seed ? normalizeLocation(seed) : DEMO_LOCATION
  return { supabase, user: auth.user, location, demo: true }
}

export function platformFeeRate() {
  return 0.15
}
