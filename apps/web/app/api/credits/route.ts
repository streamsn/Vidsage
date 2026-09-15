import { NextResponse } from "next/server";
import type { CreditsResponse } from "@video-grabber/shared";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  const { supabase, userId } = auth;

  const [{ data: profile, error: profileError }, { data: teaser }] = await Promise.all([
    supabase.from("profiles").select("credit_balance").eq("id", userId).single(),
    supabase
      .from("questions")
      .select("id")
      .eq("user_id", userId)
      .eq("is_teaser", true)
      .eq("unlocked", false)
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json<CreditsResponse>({
    creditBalance: profile.credit_balance,
    hasUnresolvedTeaser: Boolean(teaser),
  });
}
