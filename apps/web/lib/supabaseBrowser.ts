import { createClient } from "@supabase/supabase-js";

// Browser-side client for the web app's own sign-in (e.g. the /pricing page).
// Persists the session in localStorage so a page refresh keeps you signed in.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  },
);
