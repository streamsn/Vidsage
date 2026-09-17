"use client";

import type { Session } from "@supabase/supabase-js";
import type { CreditsResponse } from "@video-grabber/shared";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export function AccountBar({ session, credits }: { session: Session; credits: CreditsResponse | null }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-sm text-stone-500">
      <span className="break-all">Signed in as {session.user.email}</span>
      {credits && <span>· {credits.creditBalance} credits remaining</span>}
      <span>
        ·{" "}
        <button onClick={() => supabaseBrowser.auth.signOut()} className="underline hover:text-stone-700">
          Sign out
        </button>
      </span>
    </div>
  );
}
