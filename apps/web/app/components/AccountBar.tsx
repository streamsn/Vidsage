"use client";

import type { Session } from "@supabase/supabase-js";
import type { CreditsResponse } from "@video-grabber/shared";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export function AccountBar({
  session,
  credits,
  light = false,
}: {
  session: Session;
  credits: CreditsResponse | null;
  light?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-sm " +
        (light ? "text-white/80" : "text-stone-500")
      }
    >
      <span className="break-all">Signed in as {session.user.email}</span>
      {credits && <span>· {credits.creditBalance} credits remaining</span>}
      <span>
        ·{" "}
        <button
          onClick={() => supabaseBrowser.auth.signOut()}
          className={"underline " + (light ? "hover:text-white" : "hover:text-stone-700")}
        >
          Sign out
        </button>
      </span>
    </div>
  );
}
