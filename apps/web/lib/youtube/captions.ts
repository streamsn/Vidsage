// Isolated on purpose: YouTube gives no official API for caption text, so
// this scrapes the watch page's embedded player-response JSON. If YouTube
// changes that page's structure, or Vercel's egress IPs get rate-limited,
// this is the one file to swap — for a maintained npm package (e.g.
// `youtube-transcript`) or a paid transcript API (Supadata, SearchAPI.io) —
// without touching anything in /api/analyze.

export interface TranscriptResult {
  text: string;
  language: string;
  title: string | null;
  channelTitle: string | null;
  durationSeconds: number | null;
}

export type GetTranscriptResult =
  | ({ ok: true } & TranscriptResult)
  | { ok: false; reason: string };

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // "asr" = auto-generated
  vssId?: string;
}

interface PlayerResponse {
  videoDetails?: {
    title?: string;
    author?: string;
    lengthSeconds?: string;
  };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
  playabilityStatus?: {
    status?: string;
    reason?: string;
  };
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function extractPlayerResponse(html: string): PlayerResponse | null {
  const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;\s*(?:var |<\/script>)/s);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as PlayerResponse;
  } catch {
    return null;
  }
}

function pickBestTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;

  const manualEnglish = tracks.find((t) => t.languageCode.startsWith("en") && t.kind !== "asr");
  if (manualEnglish) return manualEnglish;

  const autoEnglish = tracks.find((t) => t.languageCode.startsWith("en"));
  if (autoEnglish) return autoEnglish;

  const anyManual = tracks.find((t) => t.kind !== "asr");
  return anyManual ?? tracks[0];
}

interface TimedTextJson3 {
  events?: { segs?: { utf8?: string }[] }[];
}

function parseJson3(json: TimedTextJson3): string {
  const parts: string[] = [];
  for (const event of json.events ?? []) {
    for (const seg of event.segs ?? []) {
      if (seg.utf8) parts.push(seg.utf8);
    }
  }
  return parts.join("").replace(/\n{2,}/g, "\n").trim();
}

export async function getTranscript(videoId: string): Promise<GetTranscriptResult> {
  try {
    const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9" },
    });

    if (!pageResponse.ok) {
      return { ok: false, reason: `watch page fetch failed: ${pageResponse.status}` };
    }

    const html = await pageResponse.text();
    const playerResponse = extractPlayerResponse(html);

    if (!playerResponse) {
      return { ok: false, reason: "could not locate ytInitialPlayerResponse in page" };
    }

    if (playerResponse.playabilityStatus?.status && playerResponse.playabilityStatus.status !== "OK") {
      return {
        ok: false,
        reason: `video not playable: ${playerResponse.playabilityStatus.status} ${playerResponse.playabilityStatus.reason ?? ""}`.trim(),
      };
    }

    const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    const track = pickBestTrack(tracks);

    if (!track) {
      return { ok: false, reason: "no caption tracks available" };
    }

    const timedTextResponse = await fetch(`${track.baseUrl}&fmt=json3`, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!timedTextResponse.ok) {
      return { ok: false, reason: `timedtext fetch failed: ${timedTextResponse.status}` };
    }

    const timedTextJson = (await timedTextResponse.json()) as TimedTextJson3;
    const text = parseJson3(timedTextJson);

    if (!text) {
      return { ok: false, reason: "caption track was empty after parsing" };
    }

    const lengthSecondsRaw = playerResponse.videoDetails?.lengthSeconds;

    return {
      ok: true,
      text,
      language: track.languageCode,
      title: playerResponse.videoDetails?.title ?? null,
      channelTitle: playerResponse.videoDetails?.author ?? null,
      durationSeconds: lengthSecondsRaw ? Number(lengthSecondsRaw) : null,
    };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "unknown error" };
  }
}
