-- 005_starter_credits.sql
-- Grant new users 25 starter credits on signup (was 0, which made
-- arrangement generation return 402 for every fresh account)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert user profile if it doesn't already exist (idempotent)
  insert into public.user_profiles (user_id, display_name, plan, credit_balance)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    'free',
    25
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Trigger on_auth_user_created already points at this function (004);
-- replacing the function body is sufficient.
