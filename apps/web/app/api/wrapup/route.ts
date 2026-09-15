import { NextResponse } from "next/server";
import type { WrapUpResponse } from "@video-grabber/shared";
import { requireUser } from "@/lib/auth";
import { toQuestionRecord, toVideoRecord, type QuestionRow, type VideoRow } from "@/lib/mappers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const videoId = new URL(request.url).searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "videoId query param is required" }, { status: 400 });
  }

  const [{ data: video, error: videoError }, { data: questions, error: questionsError }] = await Promise.all([
    supabase.from("videos").select("*").eq("id", videoId).single(),
    supabase
      .from("questions")
      .select("*")
      .eq("video_id", videoId)
      .order("created_at", { ascending: true }),
  ]);

  if (videoError || !video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  return NextResponse.json<WrapUpResponse>({
    video: toVideoRecord(video as VideoRow),
    questions: (questions as QuestionRow[]).map(toQuestionRecord),
  });
}
