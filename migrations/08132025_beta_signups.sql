-- Beta signups table for VST plugin waitlist
create table if not exists public.beta_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text default 'website', -- 'website', 'plugin', etc.
  status text default 'pending', -- 'pending', 'invited', 'converted'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for email lookups
create index if not exists idx_beta_signups_email on public.beta_signups(email);
create index if not exists idx_beta_signups_status on public.beta_signups(status);
create index if not exists idx_beta_signups_created_at on public.beta_signups(created_at);

-- Function to update updated_at timestamp
create or replace function update_beta_signups_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
drop trigger if exists update_beta_signups_updated_at on public.beta_signups;
create trigger update_beta_signups_updated_at
  before update on public.beta_signups
  for each row
  execute function update_beta_signups_updated_at();

-- RLS: Allow public inserts (for signup form), but restrict reads
alter table public.beta_signups enable row level security;

-- Policy: Anyone can insert (sign up)
drop policy if exists beta_signups_public_insert on public.beta_signups;
create policy beta_signups_public_insert
  on public.beta_signups for insert
  with check (true);

-- Note: Reads are restricted to service role only (handled by backend)

