/**
 * Seeds three demo accounts so each portal can be smoke-tested.
 * Run with:
 *   export NEXT_PUBLIC_SUPABASE_URL=...
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   npx tsx scripts/seed-demo-users.ts
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const accounts = [
  {
    email: 'demo-consumer@longevityiq.com',
    role: 'consumer' as const,
    full_name: 'Sovereign Demo',
  },
  {
    email: 'demo-operator@longevityiq.com',
    role: 'franchise_operator' as const,
    full_name: 'Manhattan Operator',
  },
  {
    email: 'demo-clinical@longevityiq.com',
    role: 'clinical_partner' as const,
    full_name: 'Dr. Cypress Wren',
  },
]

async function ensureUser(email: string) {
  const { data: list, error } = await admin.auth.admin.listUsers()
  if (error) throw error
  const existing = list.users.find((u) => u.email === email)
  if (existing) return existing
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (createErr || !created.user) throw createErr ?? new Error('user creation failed')
  return created.user
}

async function seedConsumer(userId: string, email: string, fullName: string) {
  await admin
    .from('consumer_profiles')
    .upsert(
      {
        user_id: userId,
        email,
        full_name: fullName,
        chronological_age: 41,
        tier: 'optimizer',
        bio_age: 36,
        assessment_scores: { sleep: 4, cardio: 5, strength: 4, nutrition: 4, stress: 4 },
      },
      { onConflict: 'user_id' },
    )
}

async function seedOperator(userId: string) {
  await admin
    .from('franchise_locations')
    .update({ operator_id: userId })
    .eq('org_code', 'LIQ-NYC-01')
}

async function seedClinical(userId: string, fullName: string) {
  const expiry = new Date()
  expiry.setMonth(expiry.getMonth() + 9)
  const { data: partner } = await admin
    .from('clinical_partners')
    .upsert(
      {
        partner_id: userId,
        name: fullName,
        license_type: 'MD',
        license_number_masked: 'NY-XXX-2491',
        state: 'NY',
        dea_masked: 'BW-XXX-5544',
        malpractice_expiry: expiry.toISOString().slice(0, 10),
        revenue_share_pct: 35,
        active_protocols: [
          { id: 'iv-nad', name: 'NAD+ IV Therapy', price: 595, notes: '250 mg standard' },
          { id: 'iv-myers', name: 'Myers Cocktail IV', price: 225, notes: '2 g magnesium' },
          {
            id: 'peptide-consult',
            name: 'Peptide Therapy Consult',
            price: 295,
            notes: '45 minute intake',
          },
        ],
      },
      { onConflict: 'partner_id' },
    )
    .select('id')
    .single()

  if (!partner) return
  const now = Date.now()
  await admin.from('clinical_orders').insert([
    {
      partner_id: partner.id,
      patient_id_masked: 'PT-7F3A21',
      protocol: 'NAD+ IV Therapy',
      status: 'pending',
      ordered_at: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      revenue: 595,
      partner_share: 208.25,
    },
    {
      partner_id: partner.id,
      patient_id_masked: 'PT-A19F44',
      protocol: 'Myers Cocktail IV',
      status: 'completed',
      ordered_at: new Date(now - 1000 * 60 * 60 * 24 * 4).toISOString(),
      completed_at: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
      revenue: 225,
      partner_share: 78.75,
    },
  ])
}

async function main() {
  for (const account of accounts) {
    const user = await ensureUser(account.email)
    if (account.role === 'consumer') {
      await seedConsumer(user.id, account.email, account.full_name)
    } else if (account.role === 'franchise_operator') {
      await seedOperator(user.id)
    } else {
      await seedClinical(user.id, account.full_name)
    }
    await admin
      .from('portal_roles')
      .upsert({ user_id: user.id, role: account.role }, { onConflict: 'user_id' })
    console.log(`Seeded ${account.role}: ${account.email}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
