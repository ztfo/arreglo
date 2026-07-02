-- 006_credit_grants.sql
-- Ledger of purchased credit grants + idempotent grant RPC for the
-- Stripe checkout.session.completed webhook (retry-safe: the unique
-- constraint on stripe_session_id makes duplicate deliveries no-ops)

create table if not exists public.credit_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credits int not null,
  amount_cents int,
  stripe_session_id text not null unique,
  stripe_event_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_grants_user_id on public.credit_grants(user_id);

alter table public.credit_grants enable row level security;

drop policy if exists credit_grants_select on public.credit_grants;
create policy credit_grants_select
  on public.credit_grants for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies: writes happen only via the RPC below
-- (service role from the backend webhook handler).

create or replace function public.grant_credits_idempotent(
  p_user_id uuid,
  p_amount int,
  p_stripe_session_id text,
  p_stripe_event_id text default null,
  p_amount_cents int default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.credit_grants (user_id, credits, amount_cents, stripe_session_id, stripe_event_id)
  values (p_user_id, p_amount, p_amount_cents, p_stripe_session_id, p_stripe_event_id)
  on conflict (stripe_session_id) do nothing;

  if not found then
    -- Already granted for this checkout session (webhook retry)
    return false;
  end if;

  update public.user_profiles
  set credit_balance = credit_balance + p_amount
  where user_id = p_user_id;

  return true;
end;
$$;
