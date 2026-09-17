import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  const trimmed = email?.trim().toLowerCase();

  if (!trimmed || !EMAIL_RE.test(trimmed)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("waitlist_signups").upsert({ email: trimmed }, { onConflict: "email" });

  if (error) {
    return NextResponse.json({ error: "Something went wrong, try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
