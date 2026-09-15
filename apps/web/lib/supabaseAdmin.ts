import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. Only ever used server-side, and only
// for the two things that legitimately need it — caching video analysis
// (videos table has no client write policy) and the Stripe webhook
// (rpc_grant_purchase_credits is revoked from authenticated/anon).
// Never import this into anything reachable from the per-request /api/ask
// or /api/wrapup paths — those must use supabaseUser.ts so RLS + auth.uid()
// stay correct.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
