-- 007_beta_signup_protection.sql
-- Support durable rate limiting on the public beta signup endpoint:
-- store the client IP in its own indexed column so the backend can
-- count recent signups per IP (in-memory rate limiters don't survive
-- across Vercel serverless instances)

alter table public.beta_signups add column if not exists ip text;

create index if not exists idx_beta_signups_ip_created
  on public.beta_signups(ip, created_at);

create index if not exists idx_beta_signups_created
  on public.beta_signups(created_at);
