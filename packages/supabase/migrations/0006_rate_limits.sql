-- Abuse prevention: /api/analyze can trigger paid third-party calls
-- (Supadata, YouTube Data API, Anthropic) for any unique videoId, with no
-- credit cost. Without a limit, a single free account can script unlimited
-- calls and exhaust shared API quotas / run up an open-ended AI bill.
-- /api/waitlist is public and unauthenticated, so it's rate-limited by IP
-- instead of by user.

create table public.analyze_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index analyze_events_user_created_idx on public.analyze_events (user_id, created_at);

alter table public.analyze_events enable row level security;
-- No select/insert policies: only the SECURITY DEFINER RPC below writes here.

-- Limit and window are hardcoded, not parameters — this RPC is reachable
-- directly by any authenticated client via supabase-js, so a caller-supplied
-- limit would let them raise their own cap.
create or replace function public.rpc_check_analyze_rate_limit()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
  v_limit constant integer := 20;
  v_window_seconds constant integer := 3600;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  -- Serializes concurrent calls from the same user so the count-then-insert
  -- below can't race past the limit.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select count(*) into v_count
  from public.analyze_events
  where user_id = v_user_id
    and created_at > now() - make_interval(secs => v_window_seconds);

  if v_count >= v_limit then
    return false;
  end if;

  insert into public.analyze_events (user_id) values (v_user_id);
  return true;
end;
$$;

grant execute on function public.rpc_check_analyze_rate_limit() to authenticated;

create table public.waitlist_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  created_at timestamptz not null default now()
);

create index waitlist_attempts_ip_created_idx on public.waitlist_attempts (ip, created_at);

alter table public.waitlist_attempts enable row level security;
-- No policies: only the service-role client in /api/waitlist touches this.
