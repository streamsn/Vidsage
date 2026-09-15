import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseUserClient, getBearerToken } from "./supabaseUser";

export interface AuthedRequest {
  supabase: SupabaseClient;
  userId: string;
}

/**
 * Verifies the request's bearer token against Supabase and returns a
 * JWT-bound client + the caller's user id. Every route handler should start
 * with this and return immediately if it gets a NextResponse back:
 *
 *   const auth = await requireUser(request);
 *   if (auth instanceof NextResponse) return auth;
 *   const { supabase, userId } = auth;
 */
export async function requireUser(request: Request): Promise<AuthedRequest | NextResponse> {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const supabase = createSupabaseUserClient(token);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  return { supabase, userId: data.user.id };
}
