-- Email capture for a future, related app — collected from the homepage.
create table public.waitlist_signups (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- No select/insert policies for anon/authenticated — all access goes through
-- the service-role client in /api/waitlist, same pattern as the videos cache.
alter table public.waitlist_signups enable row level security;
