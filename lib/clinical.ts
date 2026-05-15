import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type ClinicalProtocol = {
  id: string
  name: string
  price: number
  notes: string
}

export type ClinicalPartner = {
  id: string
  partner_id: string | null
  name: string
  license_type: string | null
  license_number_masked: string | null
  state: string | null
  dea_masked: string | null
  malpractice_expiry: string | null
  active_protocols: ClinicalProtocol[]
  revenue_share_pct: number
  location_id: string | null
  is_demo: boolean
  created_at: string
}

const STARTER_PROTOCOLS: ClinicalProtocol[] = [
  {
    id: 'iv-nad',
    name: 'NAD+ IV Therapy',
    price: 595,
    notes: '250 mg infusion across 90 minutes. Monitor for flushing.',
  },
  {
    id: 'iv-myers',
    name: 'Myers Cocktail IV',
    price: 225,
    notes: 'Standard Myers, 2 g magnesium, supplemental glutathione push at end.',
  },
  {
    id: 'peptide-consult',
    name: 'Peptide Therapy Consult',
    price: 295,
    notes: '45 minute intake. Document weight-based dosing for BPC-157 and TB-500.',
  },
]

function normalizePartner(row: Record<string, unknown>): ClinicalPartner {
  return {
    id: row.id as string,
    partner_id: (row.partner_id as string | null) ?? null,
    name: (row.name as string) ?? 'Clinical Partner',
    license_type: (row.license_type as string | null) ?? null,
    license_number_masked: (row.license_number_masked as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    dea_masked: (row.dea_masked as string | null) ?? null,
    malpractice_expiry: (row.malpractice_expiry as string | null) ?? null,
    active_protocols: Array.isArray(row.active_protocols)
      ? (row.active_protocols as ClinicalProtocol[])
      : [],
    revenue_share_pct: Number(row.revenue_share_pct ?? 35),
    location_id: (row.location_id as string | null) ?? null,
    is_demo: Boolean(row.is_demo ?? false),
    created_at: (row.created_at as string) ?? new Date().toISOString(),
  }
}

function maskedPatientId() {
  const bytes = new Uint8Array(3)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  return (
    'PT-' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join('')
  )
}

export async function requireClinicalPartner() {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    redirect('/clinical')
  }
  const user = auth.user

  const { data: existing } = await supabase
    .from('clinical_partners')
    .select('*')
    .eq('partner_id', user.id)
    .maybeSingle()

  if (existing) {
    return { supabase, user, partner: normalizePartner(existing) }
  }

  const expiry = new Date()
  expiry.setMonth(expiry.getMonth() + 9)

  const { data: created } = await supabase
    .from('clinical_partners')
    .insert({
      partner_id: user.id,
      name: user.email?.split('@')[0] ?? 'Clinical Partner',
      license_type: 'MD',
      license_number_masked: 'XX-1234',
      state: 'NY',
      dea_masked: 'XX-XXX-1234',
      malpractice_expiry: expiry.toISOString().slice(0, 10),
      active_protocols: STARTER_PROTOCOLS,
      revenue_share_pct: 35,
    })
    .select('*')
    .single()

  if (!created) {
    // RLS edge: synthesize a partner record so the dashboard still renders.
    return {
      supabase,
      user,
      partner: normalizePartner({
        id: user.id,
        partner_id: user.id,
        name: user.email?.split('@')[0] ?? 'Clinical Partner',
        license_type: 'MD',
        license_number_masked: 'XX-1234',
        state: 'NY',
        dea_masked: 'XX-XXX-1234',
        malpractice_expiry: expiry.toISOString().slice(0, 10),
        active_protocols: STARTER_PROTOCOLS,
        revenue_share_pct: 35,
        is_demo: true,
        created_at: new Date().toISOString(),
      }),
    }
  }

  // Seed a handful of demo orders so the dashboard renders on first login.
  const now = Date.now()
  const partnerRecord = normalizePartner(created)
  const demoOrders = [
    {
      partner_id: partnerRecord.id,
      patient_id_masked: maskedPatientId(),
      protocol: 'NAD+ IV Therapy',
      status: 'pending',
      ordered_at: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      revenue: 595,
      partner_share: Math.round(595 * 0.35 * 100) / 100,
    },
    {
      partner_id: partnerRecord.id,
      patient_id_masked: maskedPatientId(),
      protocol: 'Myers Cocktail IV',
      status: 'approved',
      ordered_at: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      revenue: 225,
      partner_share: Math.round(225 * 0.35 * 100) / 100,
    },
    {
      partner_id: partnerRecord.id,
      patient_id_masked: maskedPatientId(),
      protocol: 'Peptide Therapy Consult',
      status: 'completed',
      ordered_at: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
      completed_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      revenue: 295,
      partner_share: Math.round(295 * 0.35 * 100) / 100,
      clinical_notes: 'Cleared for BPC-157 trial, 250 mcg subcutaneous twice daily.',
    },
    {
      partner_id: partnerRecord.id,
      patient_id_masked: maskedPatientId(),
      protocol: 'NAD+ IV Therapy',
      status: 'completed',
      ordered_at: new Date(now - 1000 * 60 * 60 * 24 * 9).toISOString(),
      completed_at: new Date(now - 1000 * 60 * 60 * 24 * 8).toISOString(),
      revenue: 595,
      partner_share: Math.round(595 * 0.35 * 100) / 100,
    },
  ]

  await supabase.from('clinical_orders').insert(demoOrders)
  return { supabase, user, partner: partnerRecord }
}

export function maskPatient() {
  return maskedPatientId()
}
