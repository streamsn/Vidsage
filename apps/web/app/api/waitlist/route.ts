import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  const trimmed = email?.trim().toLowerCase();

  if (!trimmed || !EMAIL_RE.test(trimmed)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const ip = getClientIp(request);

  const { count } = await admin
    .from("waitlist_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gt("created_at", new Date(Date.now() - RATE_WINDOW_MS).toISOString());

  if ((count ?? 0) >= RATE_LIMIT) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }

  await admin.from("waitlist_attempts").insert({ ip });

  const { error } = await admin.from("waitlist_signups").upsert({ email: trimmed }, { onConflict: "email" });

  if (error) {
    return NextResponse.json({ error: "Something went wrong, try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
