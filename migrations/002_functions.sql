-- 002_functions.sql
-- Helper functions and views for credits and usage

-- Safely decrement credits for a user; raises exception if insufficient
create or replace function public.decrement_credit_balance(p_user_id uuid, p_amount int)
returns void
language plpgsql
as $$
begin
  update public.user_profiles
  set credit_balance = credit_balance - p_amount
  where user_id = p_user_id
    and credit_balance >= p_amount;

  if not found then
    raise exception 'INSUFFICIENT_CREDITS' using hint = 'Add credits to continue';
  end if;
end;
$$;

-- Grant credits to a user (used by webhooks after purchase)
create or replace function public.grant_credits(p_user_id uuid, p_amount int)
returns void
language sql
as $$
  update public.user_profiles
  set credit_balance = credit_balance + p_amount
  where user_id = p_user_id;
$$;

-- Log usage
create or replace function public.log_usage(
  p_user_id uuid,
  p_action text,
  p_tokens_in int default 0,
  p_tokens_out int default 0,
  p_cost_cents int default 0,
  p_meta jsonb default '{}'::jsonb
) returns void
language sql
as $$
  insert into public.usage_logs(user_id, action_type, tokens_in, tokens_out, cost_cents, meta)
  values (p_user_id, p_action, p_tokens_in, p_tokens_out, p_cost_cents, p_meta);
$$;

-- View: usage summary per user
create or replace view public.v_usage_summary as
select
  u.user_id,
  coalesce(sum(case when action_type = 'arrangement_generation' then 1 else 0 end),0) as total_arrangements,
  coalesce(sum(case when action_type = 'image_analysis' then 1 else 0 end),0) as total_image_analyses,
  coalesce(sum(cost_cents),0) as total_cost_cents,
  min(created_at) as first_use,
  max(created_at) as last_use
from public.usage_logs u
group by u.user_id;
