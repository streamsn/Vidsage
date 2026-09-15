-- Addresses two Supabase advisor findings surfaced after 0001/0002:
--
-- 1. set_updated_at had no pinned search_path (function_search_path_mutable).
-- 2. Postgres grants EXECUTE to PUBLIC by default on function creation, so
--    handle_new_user/rpc_begin_question/rpc_finalize_question/
--    rpc_refund_question were unintentionally callable by the anon role
--    even though only `authenticated` was ever meant to reach them.
--    (Functionally harmless — each checks auth.uid() and only touches the
--    caller's own rows — but should be revoked explicitly rather than rely
--    on that internal check.)

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

revoke execute on function public.rpc_begin_question(text, text) from public, anon;
revoke execute on function public.rpc_finalize_question(bigint, text) from public, anon;
revoke execute on function public.rpc_refund_question(bigint) from public, anon;

grant execute on function public.rpc_begin_question(text, text) to authenticated;
grant execute on function public.rpc_finalize_question(bigint, text) to authenticated;
grant execute on function public.rpc_refund_question(bigint) to authenticated;
