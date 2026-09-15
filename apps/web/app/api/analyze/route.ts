import { NextResponse } from "next/server";
import type { AnalyzeRequest, AnalyzeResponse } from "@video-grabber/shared";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { toVideoRecord, type VideoRow } from "@/lib/mappers";
import { getTranscript } from "@/lib/youtube/captions";
import { summarizeTranscript } from "@/lib/anthropic";
import { findRelatedVideos } from "@/lib/youtube/dataApi";

export const runtime = "nodejs";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 20_000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Waits for a concurrent /api/analyze call (by another user) to finish caching this video. */
async function pollUntilReady(admin: ReturnType<typeof createSupabaseAdminClient>, videoId: string) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { data } = await admin.from("videos").select("*").eq("id", videoId).single();

    if (data && (data.status === "ready" || (data.status === "failed" && data.transcript_unavailable))) {
      return data as VideoRow;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  return null;
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const { videoId } = (await request.json()) as AnalyzeRequest;
  if (!videoId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Fast path: already cached from a previous user's Analyze click.
  const { data: existing } = await admin.from("videos").select("*").eq("id", videoId).single();

  if (existing?.status === "ready") {
    return NextResponse.json<AnalyzeResponse>({ video: toVideoRecord(existing as VideoRow) });
  }

  if (existing?.status === "failed" && existing.transcript_unavailable) {
    return NextResponse.json({ error: "Captions unavailable for this video." }, { status: 422 });
  }

  if (existing?.status === "pending") {
    const ready = await pollUntilReady(admin, videoId);
    if (!ready) {
      return NextResponse.json({ error: "Still analyzing this video, try again shortly." }, { status: 202 });
    }
    if (ready.status === "failed") {
      return NextResponse.json({ error: "Captions unavailable for this video." }, { status: 422 });
    }
    return NextResponse.json<AnalyzeResponse>({ video: toVideoRecord(ready) });
  }

  // Claim this video: whoever's insert succeeds does the work, everyone else polls.
  const { error: insertError } = await admin.from("videos").insert({ id: videoId, status: "pending" });

  if (insertError) {
    const ready = await pollUntilReady(admin, videoId);
    if (!ready) {
      return NextResponse.json({ error: "Still analyzing this video, try again shortly." }, { status: 202 });
    }
    if (ready.status === "failed") {
      return NextResponse.json({ error: "Captions unavailable for this video." }, { status: 422 });
    }
    return NextResponse.json<AnalyzeResponse>({ video: toVideoRecord(ready) });
  }

  const transcriptResult = await getTranscript(videoId);

  if (!transcriptResult.ok) {
    await admin
      .from("videos")
      .update({ status: "failed", transcript_unavailable: true, error_message: transcriptResult.reason })
      .eq("id", videoId);

    return NextResponse.json({ error: "Captions unavailable for this video." }, { status: 422 });
  }

  try {
    const { summary, topics } = await summarizeTranscript(transcriptResult.text);
    const relatedVideos = await findRelatedVideos(topics, videoId);

    const { data: updated, error: updateError } = await admin
      .from("videos")
      .update({
        title: transcriptResult.title,
        channel_title: transcriptResult.channelTitle,
        duration_seconds: transcriptResult.durationSeconds,
        transcript: transcriptResult.text,
        transcript_language: transcriptResult.language,
        summary,
        topics,
        related_videos: relatedVideos,
        status: "ready",
        cached_at: new Date().toISOString(),
      })
      .eq("id", videoId)
      .select()
      .single();

    if (updateError || !updated) {
      throw updateError ?? new Error("Failed to persist video analysis");
    }

    return NextResponse.json<AnalyzeResponse>({ video: toVideoRecord(updated as VideoRow) });
  } catch (error) {
    await admin
      .from("videos")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error during analysis",
      })
      .eq("id", videoId);

    return NextResponse.json({ error: "Failed to analyze this video." }, { status: 500 });
  }
}
