-- Postgres grants EXECUTE to PUBLIC by default on function creation, so
-- 0006's `grant ... to authenticated` alone left this callable by anon too
-- (harmless here since it just raises "not authenticated", but inconsistent
-- with the explicit revoke pattern used elsewhere in this schema).
revoke execute on function public.rpc_check_analyze_rate_limit() from public, anon;
