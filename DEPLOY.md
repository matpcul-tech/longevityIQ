# LongevityIQ OS Deployment Runbook

This document walks through provisioning the three-portal LongevityIQ OS
end to end: Supabase, Resend SMTP, Anthropic, Stripe and Vercel.

## 1. Supabase project

1. Create a new Supabase project at https://supabase.com/dashboard. Note the
   project ref, the project URL (`https://<ref>.supabase.co`), the anon key
   and the service role key.
2. In the SQL editor, run the migrations in this order:
   - `supabase/migrations/00001_init.sql`
   - `supabase/migrations/00002_franchise_extensions.sql`
   - `supabase/migrations/00003_clinical_extensions.sql`
3. Run `supabase/seed.sql` to populate demo franchise locations and revenue.
4. Optional: run `scripts/seed-demo-users.ts` to provision one consumer,
   one franchise operator and one clinical partner with magic-link sign-in.
   See section 6 below.

## 2. Auth configuration

1. Authentication > Providers: enable Email and turn on Magic Link.
2. Authentication > URL Configuration:
   - Site URL: `https://longevityiq.vercel.app`
   - Additional redirect URLs:
     `https://longevityiq.vercel.app/auth/callback`,
     `http://localhost:3000/auth/callback`
3. Authentication > Email Templates > Magic Link: customize copy. Keep the
   `{{ .ConfirmationURL }}` token intact.

## 3. Resend SMTP

1. Create a Resend account, verify the sending domain
   (`longevityiq.com` or fall back to `sovereignshieldtechnologies.com`).
2. Resend > SMTP settings: copy host (`smtp.resend.com`), port `465`,
   username (`resend`), password (API key beginning with `re_...`).
3. Supabase > Project Settings > Auth > SMTP Settings:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: your Resend API key
   - Sender email: `noreply@longevityiq.com`
   - Sender name: `LongevityIQ`

## 4. Stripe

1. In Stripe Dashboard, create three subscription products:
   - Essential: $99 / month
   - Optimizer: $179 / month
   - Sovereign: $299 / month
2. Copy each Price id (`price_...`). Add them to Vercel env as
   `STRIPE_PRICE_ESSENTIAL`, `STRIPE_PRICE_OPTIMIZER`, `STRIPE_PRICE_SOVEREIGN`.
3. Webhooks > add endpoint `https://longevityiq.vercel.app/api/stripe` and
   subscribe to `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`. Copy
   the signing secret to `STRIPE_WEBHOOK_SECRET`.

## 5. Anthropic

1. Create an Anthropic API key at https://console.anthropic.com.
2. Set `ANTHROPIC_API_KEY` in Vercel.
3. The default model used is `claude-sonnet-4-20250514`.

## 6. Demo user seeding (optional)

`scripts/seed-demo-users.ts` provisions three accounts so the portals can
be smoke-tested without invitations. It needs `NEXT_PUBLIC_SUPABASE_URL`
and `SUPABASE_SERVICE_ROLE_KEY` exported.

```
export NEXT_PUBLIC_SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
npx tsx scripts/seed-demo-users.ts
```

The script creates:
- `demo-consumer@longevityiq.com` -> Optimizer tier with a sample bio age
- `demo-operator@longevityiq.com` -> claims the Manhattan franchise
- `demo-clinical@longevityiq.com` -> starter clinical partner record

Each user gets a magic link email on next sign-in attempt.

## 7. Vercel

1. Import the repo in Vercel. Framework auto-detects as Next.js.
2. Environment variables (Production + Preview):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   STRIPE_PRICE_ESSENTIAL
   STRIPE_PRICE_OPTIMIZER
   STRIPE_PRICE_SOVEREIGN
   ANTHROPIC_API_KEY
   RESEND_API_KEY
   NEXT_PUBLIC_SITE_URL=https://longevityiq.vercel.app
   ```
3. Deploy. The build runs `next build`; no extra steps needed.

## 8. Smoke test

After deployment:
1. Visit `/`. Three portal cards should render with the bio age preview.
2. Visit `/consumer`. Submit a magic link to a real inbox, follow the
   email, land on `/consumer/dashboard`. Complete the bio age assessment
   and confirm a daily insight is generated.
3. Visit `/franchise`. Sign in. The dashboard should load with the demo
   Manhattan location (or your assigned location) and show revenue tiles.
4. Visit `/clinical`. Sign in. The auto-provisioning flow should create
   the partner record plus four demo orders so the Overview tab is
   immediately populated.

## 9. Production hardening checklist

- [ ] Rotate the Supabase service role key after first seed
- [ ] Lock down RLS on `auth.users` to prevent the magic-link enumeration
- [ ] Configure Resend domain DKIM and SPF
- [ ] Add custom domain in Vercel and update Supabase Site URL
- [ ] Set up Stripe webhook idempotency and signature verification in
      `app/api/stripe/route.ts`
- [ ] Enable Vercel Analytics and log drains if required for compliance
- [ ] Confirm `NEXT_PUBLIC_SITE_URL` matches the production hostname
