import { NextResponse } from "next/server";
import type { AskRequest, AskResponse } from "@video-grabber/shared";
import { requireUser } from "@/lib/auth";
import { answerQuestion } from "@/lib/anthropic";

export const runtime = "nodejs";

interface BeginQuestionRow {
  question_id: number | null;
  decision: "charge" | "teaser" | "blocked";
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  const { supabase, userId } = auth;

  const { videoId, question } = (await request.json()) as AskRequest;
  if (!videoId || !question?.trim()) {
    return NextResponse.json({ error: "videoId and question are required" }, { status: 400 });
  }

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("transcript, summary, status")
    .eq("id", videoId)
    .single();

  if (videoError || !video || video.status !== "ready") {
    return NextResponse.json({ error: "Analyze this video before asking questions." }, { status: 400 });
  }

  const { data: beginRows, error: beginError } = await supabase.rpc("rpc_begin_question", {
    p_video_id: videoId,
    p_question: question,
  });

  if (beginError) {
    return NextResponse.json({ error: beginError.message }, { status: 500 });
  }

  const { question_id: questionId, decision } = (beginRows as BeginQuestionRow[])[0];

  if (decision === "blocked") {
    const { data: profile } = await supabase.from("profiles").select("credit_balance").eq("id", userId).single();

    return NextResponse.json<AskResponse>({
      answer: null,
      blurred: false,
      blocked: true,
      creditBalance: profile?.credit_balance ?? 0,
    });
  }

  const { data: priorQuestions } = await supabase
    .from("questions")
    .select("question, answer")
    .eq("video_id", videoId)
    .not("answer", "is", null)
    .order("created_at", { ascending: true });

  try {
    const answer = await answerQuestion({
      transcript: video.transcript ?? "",
      summary: video.summary ?? "",
      priorQuestions: priorQuestions ?? [],
      question,
    });

    const { error: finalizeError } = await supabase.rpc("rpc_finalize_question", {
      p_question_id: questionId,
      p_answer: answer,
    });

    if (finalizeError) throw finalizeError;

    const { data: profile } = await supabase.from("profiles").select("credit_balance").eq("id", userId).single();

    return NextResponse.json<AskResponse>({
      answer,
      blurred: decision === "teaser",
      blocked: false,
      creditBalance: profile?.credit_balance ?? 0,
    });
  } catch (error) {
    await supabase.rpc("rpc_refund_question", { p_question_id: questionId });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate an answer, try again." },
      { status: 500 },
    );
  }
}
