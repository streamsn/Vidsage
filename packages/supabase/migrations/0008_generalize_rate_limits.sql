-- Generalizes 0006's analyze-only rate limit into one mechanism covering
-- every user-triggered action that costs real third-party API money
-- (Anthropic for both /api/analyze's summary and /api/ask's answer,
-- Supadata, YouTube Data API). Credits already bound /api/ask's cost to
-- what a user has paid for, but nothing stopped someone from buying a
-- cheap credit pack and then bursting through it with back-to-back
-- maximally expensive requests -- this adds that backstop.

create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_events_user_action_created_idx
  on public.rate_limit_events (user_id, action, created_at);

alter table public.rate_limit_events enable row level security;
-- No policies: only the SECURITY DEFINER RPC below writes here.

-- p_action selects a hardcoded limit/window below -- never caller-supplied
-- -- so a client calling this RPC directly via supabase-js can't raise its
-- own cap the way passing a limit/window as parameters would allow.
create or replace function public.rpc_check_rate_limit(p_action text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
  v_limit integer;
  v_window_seconds integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  case p_action
    when 'analyze' then
      v_limit := 20;
      v_window_seconds := 3600;
    when 'ask' then
      v_limit := 60;
      v_window_seconds := 3600;
    else
      raise exception 'unknown rate-limited action: %', p_action;
  end case;

  -- Serializes concurrent calls from the same user+action so the
  -- count-then-insert below can't race past the limit.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_action, 0));

  select count(*) into v_count
  from public.rate_limit_events
  where user_id = v_user_id
    and action = p_action
    and created_at > now() - make_interval(secs => v_window_seconds);

  if v_count >= v_limit then
    return false;
  end if;

  insert into public.rate_limit_events (user_id, action) values (v_user_id, p_action);
  return true;
end;
$$;

revoke execute on function public.rpc_check_rate_limit(text) from public, anon;
grant execute on function public.rpc_check_rate_limit(text) to authenticated;

-- Superseded by rate_limit_events / rpc_check_rate_limit above.
drop function if exists public.rpc_check_analyze_rate_limit();
drop table if exists public.analyze_events;
