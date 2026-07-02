-- 008_user_profiles_trigger_backfill.sql
-- Migration 004's trigger was never applied to the live database (signups
-- created auth users with no profile row → /v1/usage 500). Create it and
-- backfill profiles for users created while it was missing.

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

insert into public.user_profiles (user_id, display_name, plan, credit_balance)
select id, coalesce(raw_user_meta_data->>'display_name', email), 'free', 25
from auth.users
on conflict (user_id) do nothing;
