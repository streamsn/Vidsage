// Transcript text comes from Supadata (https://supadata.ai) — YouTube blocks
// direct server-side scraping of its caption/timedtext endpoints (confirmed
// during build: watch-page scraping works, but the timedtext endpoint
// silently returns an empty body for any non-browser request, even with
// session cookies/Referer attached). Supadata handles that complexity for a
// small per-call credit (free tier: 100/month). Video metadata (title,
// channel, duration) isn't part of Supadata's transcript response, so that
// still comes from the official YouTube Data API, which has no such
// blocking. Isolated behind this one file so the transcript source can be
// swapped again without touching /api/analyze.

export interface TranscriptResult {
  text: string;
  language: string;
  title: string | null;
  channelTitle: string | null;
  durationSeconds: number | null;
}

export type GetTranscriptResult = ({ ok: true } & TranscriptResult) | { ok: false; reason: string };

const SUPADATA_BASE_URL = "https://api.supadata.ai/v1/transcript";
const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 30_000;

interface SupadataImmediateResponse {
  content: string;
  lang: string;
  availableLangs: string[];
}

interface SupadataJobAccepted {
  jobId: string;
}

interface SupadataJobStatus {
  status: "queued" | "active" | "completed" | "failed";
  content?: string;
  lang?: string;
  error?: string;
}

function supadataHeaders() {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) throw new Error("Missing SUPADATA_API_KEY");
  return { "x-api-key": apiKey };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTranscriptText(videoId: string): Promise<
  { ok: true; text: string; language: string } | { ok: false; reason: string }
> {
  const url = new URL(SUPADATA_BASE_URL);
  url.searchParams.set("url", `https://www.youtube.com/watch?v=${videoId}`);
  url.searchParams.set("text", "true");

  const response = await fetch(url.toString(), { headers: supadataHeaders() });

  if (response.status === 404) return { ok: false, reason: "video not found or private" };
  if (response.status === 403) return { ok: false, reason: "video restricted (age/region locked)" };
  if (response.status === 206) return { ok: false, reason: "no transcript available for this video" };

  if (response.status === 202) {
    const { jobId } = (await response.json()) as SupadataJobAccepted;
    return pollJob(jobId);
  }

  if (!response.ok) {
    return { ok: false, reason: `Supadata request failed: ${response.status}` };
  }

  const body = (await response.json()) as SupadataImmediateResponse;
  if (!body.content) return { ok: false, reason: "empty transcript returned" };

  return { ok: true, text: body.content, language: body.lang };
}

async function pollJob(jobId: string): Promise<{ ok: true; text: string; language: string } | { ok: false; reason: string }> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const response = await fetch(`${SUPADATA_BASE_URL}/${jobId}`, { headers: supadataHeaders() });
    if (!response.ok) return { ok: false, reason: `job status check failed: ${response.status}` };

    const job = (await response.json()) as SupadataJobStatus;

    if (job.status === "completed") {
      const text = typeof job.content === "string" ? job.content : "";
      if (!text) return { ok: false, reason: "empty transcript returned" };
      return { ok: true, text, language: job.lang ?? "unknown" };
    }

    if (job.status === "failed") {
      return { ok: false, reason: job.error ?? "transcript generation failed" };
    }

    await sleep(POLL_INTERVAL_MS);
  }

  return { ok: false, reason: "timed out waiting for transcript generation" };
}

interface YouTubeVideosListResponse {
  items?: {
    snippet?: { title?: string; channelTitle?: string };
    contentDetails?: { duration?: string };
  }[];
}

/** Parses ISO 8601 durations like "PT4M13S" into whole seconds. */
function parseIso8601Duration(duration: string): number | null {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;

  const [, hours, minutes, seconds] = match;
  return (Number(hours ?? 0) * 3600) + (Number(minutes ?? 0) * 60) + Number(seconds ?? 0);
}

async function fetchVideoMetadata(
  videoId: string,
): Promise<{ title: string | null; channelTitle: string | null; durationSeconds: number | null }> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) throw new Error("Missing YOUTUBE_DATA_API_KEY");

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    // Metadata is a nice-to-have, not required for the summary/chat flow —
    // don't fail the whole analysis just because this lookup failed.
    return { title: null, channelTitle: null, durationSeconds: null };
  }

  const json = (await response.json()) as YouTubeVideosListResponse;
  const item = json.items?.[0];

  return {
    title: item?.snippet?.title ?? null,
    channelTitle: item?.snippet?.channelTitle ?? null,
    durationSeconds: item?.contentDetails?.duration ? parseIso8601Duration(item.contentDetails.duration) : null,
  };
}

export async function getTranscript(videoId: string): Promise<GetTranscriptResult> {
  try {
    const transcript = await fetchTranscriptText(videoId);
    if (!transcript.ok) return transcript;

    const metadata = await fetchVideoMetadata(videoId);

    return {
      ok: true,
      text: transcript.text,
      language: transcript.language,
      ...metadata,
    };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "unknown error" };
  }
}
