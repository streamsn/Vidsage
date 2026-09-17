import { NextResponse } from "next/server";
import type { HistoryEntry, HistoryResponse } from "@video-grabber/shared";
import { requireUser } from "@/lib/auth";
import { toQuestionRecord, toVideoRecord, type QuestionRow, type VideoRow } from "@/lib/mappers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  // RLS ("questions_select_own") scopes this to the caller's own rows.
  const { data, error } = await supabase
    .from("questions")
    .select("*, video:videos(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const entries: HistoryEntry[] = [];
  const entryIndexByVideoId = new Map<string, number>();

  for (const row of data as (QuestionRow & { video: VideoRow | null })[]) {
    if (!row.video) continue;

    let index = entryIndexByVideoId.get(row.video_id);
    if (index === undefined) {
      index = entries.length;
      entryIndexByVideoId.set(row.video_id, index);
      entries.push({ video: toVideoRecord(row.video), questions: [] });
    }
    entries[index].questions.push(toQuestionRecord(row));
  }

  // Rows arrived newest-first per video; flip each thread back to chronological order.
  for (const entry of entries) entry.questions.reverse();

  return NextResponse.json<HistoryResponse>({ entries });
}
