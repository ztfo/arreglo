# Arreglo Backend Refactor Plan

## Goal
Refactor Arreglo to use a standalone API backend (Node.js + Express) deployable on Vercel. The backend will own AI calls (OpenAI/Anthropic), authentication (Supabase Auth), subscriptions (Stripe), usage limits, and data storage (Supabase). The plugin will become a thin client calling the API. This enables multiple clients (Figma plugin now; web app/VST later).

## Current State (Summary)
- Figma plugin directly calls OpenAI/Anthropic using user-provided keys (`figma.clientStorage`).
- Vision extraction of DAW screenshots is implemented and working inside the plugin (`src/code.ts` → `analyzeImage`).
- Duplicate AI pathways exist: `src/core/api/*` and `src/services/AIService.ts`.
- Supabase client file (`src/core/supabase.ts`) has hardcoded placeholders and isn’t integrated into flows.
- Exports (JSON/CSV/MIDI) are functional and self-contained.

## Target Architecture
```
Clients (Plugin, Web, VST)
   │
   ▼
Arreglo API (Express on Vercel serverless)
   ├─ Auth: Supabase (verify access tokens)
   ├─ Billing: Stripe (subscriptions)
   ├─ AI: OpenAI/Anthropic via backend env keys
   ├─ Usage limits + logging: Supabase
   └─ Data: Supabase (users, arrangements, subscriptions)
```

## Backend Project Structure (New)
```
apps/backend/
├── api/                          # Vercel serverless entrypoints (Express adapter)
│   └── index.ts                  # Exposes Express app
├── src/
│   ├── app.ts                    # Express app setup
│   ├── config/env.ts             # Env loading/validation
│   ├── middleware/auth.ts        # Supabase JWT verification
│   ├── routes/
│   │   ├── health.ts
│   │   ├── arrangements.ts       # generate/list/get/save
│   │   ├── vision.ts             # extract track names from image
│   │   ├── usage.ts              # usage counters
│   │   ├── billing.ts            # Stripe checkout portal
│   │   └── webhooks.ts           # Stripe webhooks
│   ├── services/
│   │   ├── ai.ts                 # OpenAI/Anthropic clients
│   │   ├── prompts.ts            # Prompt builders
│   │   ├── rateLimit.ts          # Usage limits
│   │   ├── usage.ts              # Usage logging
│   │   └── storage.ts            # Supabase queries
│   ├── types/
│   │   └── index.ts
│   └── utils/http.ts             # Response helpers
├── package.json
├── tsconfig.json
├── vercel.json
└── .env.local (gitignored)
```

## API Endpoints (v1)
- POST `/v1/arrangements/generate`
  - Auth: required (Supabase access token)
  - Body: `{ songData: {...}, model?: 'openai'|'anthropic' }`
  - Response: `{ arrangement: ArrangementData, tokens?: {...}, costCents?: number, id?: string }`

- POST `/v1/vision/extract-tracks`
  - Auth: required
  - Body: `{ base64Image: string }`
  - Response: `{ trackNames: string[] }`

- GET `/v1/arrangements`
  - Auth: required
  - Query: pagination
  - Response: `{ items: ArrangementSummary[], nextCursor?: string }`

- GET `/v1/arrangements/:id`
  - Auth: required
  - Response: `{ arrangement: ArrangementData }`

- POST `/v1/arrangements`
  - Auth: required
  - Body: `{ arrangement: ArrangementData }` (save client-produced arr.)
  - Response: `{ id: string }`

- GET `/v1/usage`
  - Auth: required
  - Response: `{ today: {...}, plan: 'free'|'pro', limits: {...} }`

- POST `/v1/billing/checkout`
  - Auth: required
  - Body: `{ priceId: string }`
  - Response: `{ checkoutUrl: string }`

- GET `/v1/billing/portal`
  - Auth: required
  - Response: `{ portalUrl: string }`

- POST `/v1/webhooks/stripe`
  - Auth: Stripe signature header
  - Body: Stripe event
  - Effect: Update subscription status in Supabase

## Auth Strategy (Supabase)
- Clients obtain Supabase session (plugin/web/VST) and include `Authorization: Bearer <access_token>` header.
- Backend Express middleware verifies token by using Supabase Admin client (`auth.getUser()`), or by verifying JWT via JWKS.
- On success, attach `req.user = { id, email, ... }` and proceed.

## Data Model (Supabase)
```sql
-- users are managed by Supabase Auth; use auth.users.id as PK

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  display_name text,
  plan text default 'free'
);

create table public.arrangements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  genre text,
  tempo int,
  length_bars int,
  creativity int,
  sections jsonb not null,
  created_at timestamptz default now()
);

create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null, -- 'arrangement_generation' | 'image_analysis'
  tokens_in int default 0,
  tokens_out int default 0,
  cost_cents int default 0,
  meta jsonb,
  created_at timestamptz default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table public.arrangements enable row level security;
create policy "arrangements_owner"
  on public.arrangements for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.usage_logs enable row level security;
create policy "usage_logs_owner"
  on public.usage_logs for select
  using (auth.uid() = user_id);

alter table public.subscriptions enable row level security;
create policy "subscriptions_owner"
  on public.subscriptions for select
  using (auth.uid() = user_id);
```

## Billing (Stripe)
- Create Products/Prices in Stripe.
- Backend endpoints:
  - `/v1/billing/checkout`: Creates Checkout Session for logged-in user; stores/links `stripe_customer_id`.
  - `/v1/billing/portal`: Creates Billing Portal session.
  - `/v1/webhooks/stripe`: Handles events `checkout.session.completed`, `customer.subscription.updated|deleted` to update `subscriptions` and user plan.
- Supabase stores subscription state; backend enforces plan limits.

## AI Service (Backend)
- OpenAI and Anthropic keys stored as backend env vars.
- Service methods:
  - `generateArrangement(songData, model)` builds prompts (reuse/refactor current `src/core/prompts.ts`).
  - `extractTrackNames(base64Image)` uses OpenAI vision; returns normalized list.
- Return token usage and estimated cost to usage logs.

## Rate Limiting
- Backed by Supabase (daily counters per user) or an in-memory/Redis token bucket (optional) with fallback to DB.
- Free plan example limits: 5 arrangement generations/day, 5 image analyses/day.

## Plugin Refactor (Client)
- Keep current vision working, but migrate to backend endpoint once ready.
- Replace direct AI calls with backend API client (`src/core/api/backend.ts`).
- Remove API key UI and storage.
- Keep consent and model selection; model becomes a hint for backend.
- Add manifest allowed domain for your Vercel API.

## Code Cleanup (This Repo)
- Remove duplicates:
  - Consolidate AI path: delete `src/services/AIService.ts` and keep a single abstraction (temporarily call backend; long-term remove direct OpenAI/Anthropic).
  - Remove `src/core/api/arrangement.ts` if unused (it references Anthropic and appears incomplete).
  - Remove or replace `src/core/supabase.ts` (no client-side Supabase; all DB on backend). If needed for front-end auth only, store only Supabase URL/anon key and use it solely for obtaining access tokens in UI.
- Ensure `src/core/api/index.ts` becomes a thin client to backend endpoints.
- Keep exports (`src/core/exports/*`) unchanged.

## Security
- No secrets in plugin.
- Backend validates Supabase JWT per request.
- Stripe webhook signature verification.
- CORS allow-list for Figma UI origins and future web app origins.

## Environment Variables (Backend)
```
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
APP_BASE_URL= https://<your-vercel-domain>
```

## Vercel Deployment (Backend)
- Use `@vercel/node` to expose Express app from `api/index.ts`.
- `vercel.json` example:
```json
{
  "functions": {
    "api/index.ts": { "maxDuration": 30 }
  },
  "routes": [
    { "src": "/v1/(.*)", "dest": "/api/index.ts" },
    { "src": "/health", "dest": "/api/index.ts" }
  ]
}
```

## Phased Rollout
- Phase 0: Confirm current vision flow works (it does). Add manifest domain for upcoming backend.
- Phase 1: Backend scaffolding (Express, health route, auth middleware). Deploy to Vercel.
- Phase 2: Supabase schema + RLS. Wire storage and usage logging.
- Phase 3: Implement `/v1/arrangements/generate` and `/v1/vision/extract-tracks`.
- Phase 4: Plugin switches to backend for generation; keep vision local as fallback; then switch vision to backend.
- Phase 5: Stripe subscriptions (checkout, portal, webhooks) and plan enforcement.
- Phase 6: Cleanup duplicates in repo and remove direct AI calls.
- Phase 7: Prepare web app client (optional next project).

## Acceptance Criteria
- Plugin generates arrangements via backend with Supabase-authenticated requests.
- Vision extraction available via backend endpoint with equivalent or better quality.
- Arrangements stored per user; usage logged; limits enforced by plan.
- Stripe subscriptions fully operational; plan reflected in Supabase and enforced by API.
- No secrets in plugin; manifest updated; CORS correct.

## Open Decisions
- Exact free tier limits and pricing.
- Whether to keep Anthropic as selectable model in MVP or standardize on one model.
- Caching policy for repeated prompts to reduce cost.
- Persisting token usage and cost granularity (request-level vs aggregated).
