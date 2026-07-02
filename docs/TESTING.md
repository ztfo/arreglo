# Local E2E Testing Guide

## One-time setup (before first test)

1. **Run migrations** in Supabase SQL editor (in order):
   `migrations/005_starter_credits.sql`, `006_credit_grants.sql`, `007_beta_signup_protection.sql`
2. **Supabase dashboard** → Auth → Email Templates → Magic Link: make sure the
   template includes the 6-digit code `{{ .Token }}` (the plugin uses code entry, not the link).
3. **`apps/backend/.env`**: fill `STRIPE_SECRET_KEY` (test-mode `sk_test_...`) and
   `TURNSTILE_SECRET_KEY`. `STRIPE_WEBHOOK_SECRET` comes from `stripe listen` (below).
4. **`index.html`** (landing): replace `YOUR_TURNSTILE_SITEKEY` with the real sitekey.
5. Root `.env` already points the plugin at `http://localhost:3000`
   (values bake in at build time — rebuild after changing).

## Run everything

```bash
# terminal 1 — plugin watch build
pnpm dev

# terminal 2 — backend (mirrors Vercel prod routing)
cd apps/backend && pnpm dlx vercel dev --listen 3000

# terminal 3 — Stripe webhook forwarding (copy the printed whsec_... into apps/backend/.env, restart backend)
stripe listen --forward-to localhost:3000/v1/billing/webhook
```

In Figma desktop: Plugins → Development → Import plugin from manifest → select `manifest.json`.
(`devAllowedDomains` permits localhost only for the dev build.)

## Checklist

1. **Sign in** — enter email → Send Code → type the 6-digit code from the email → Verify.
   Status shows your email; balance shows **25 credits** (new-user trigger).
2. **Generate arrangement** — frames render, balance drops to 24, a `usage_logs` row exists.
3. **Screenshot analysis** — upload a DAW screenshot; track names extracted (no credit used).
4. **Out of credits** — set balance to 0 in SQL:
   `update user_profiles set credit_balance = 0 where user_id = '<id>';`
   Generate → "Insufficient credits" → buy-credits modal opens.
5. **Buy pack** — pick a pack → browser opens Stripe Checkout → pay with
   `4242 4242 4242 4242` (any future expiry/CVC) → success page → `stripe listen`
   logs `checkout.session.completed` → plugin balance updates within ~10s
   (it polls every 5s); one row in `credit_grants`.
6. **Idempotency** — `stripe events resend <evt_id>` → webhook returns 200,
   balance does NOT increase again.
7. **Landing form** — open `index.html` via a local server; Turnstile pass → success;
   4th submit from the same IP within an hour → 429; fill the hidden "company"
   field via devtools → fake success, no DB row.
8. **Session persistence** — close and reopen the plugin: still signed in
   (token restore via clientStorage, auto-refresh if expired).

## Before publishing

- Root `.env`: `API_BASE_URL=https://arreglo.vercel.app` → `pnpm build`
- Vercel env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (from the dashboard
  webhook endpoint pointing at `https://arreglo.vercel.app/v1/billing/webhook`,
  event `checkout.session.completed`), `TURNSTILE_SECRET_KEY`; `DEV_AUTH_BYPASS` unset.
- Push landing page (index.html + checkout-success.html + checkout-cancel.html) to GitHub Pages.
