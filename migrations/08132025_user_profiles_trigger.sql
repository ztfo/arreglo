-- 08132025_user_profiles_trigger.sql
-- Auto-create user_profiles row when a new user signs up

-- Function to handle new user creation
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
    0
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Trigger to call the function when a new user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

