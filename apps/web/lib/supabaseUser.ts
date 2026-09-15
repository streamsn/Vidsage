import { createClient } from "@supabase/supabase-js";

// Per-request client bound to the caller's own JWT, so auth.uid() and RLS
// resolve to the actual signed-in user. Used by every route that reads or
// writes user-owned data (rpc_begin_question, rpc_finalize_question,
// rpc_refund_question, /api/wrapup, /api/credits).
export function createSupabaseUserClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

/** Pulls "Bearer <token>" out of a Request's Authorization header, or null. */
export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  return header?.match(/^Bearer (.+)$/)?.[1] ?? null;
}
