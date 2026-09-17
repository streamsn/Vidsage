"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { CreditsResponse } from "@video-grabber/shared";

export function useCredits(session: Session | null) {
  const [credits, setCredits] = useState<CreditsResponse | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setCredits(null);
      return;
    }
    const res = await fetch("/api/credits", { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (res.ok) setCredits((await res.json()) as CreditsResponse);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { credits, setCredits, refresh };
}
