import { createClient } from "@supabase/supabase-js";

// Anon-key client used ONLY for Supabase Realtime subscriptions in the side
// panel (so the blurred-teaser paywall clears the instant the Stripe
// webhook lands). It never persists its own session or performs sign-in —
// the session of record lives in the background service worker; call
// applySessionToken() below whenever GET_SESSION returns a token so Realtime
// can authenticate its channel subscriptions as this user.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  },
);

export function applySessionToken(accessToken: string) {
  supabase.realtime.setAuth(accessToken);
}
