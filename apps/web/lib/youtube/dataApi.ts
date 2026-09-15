import type { RelatedVideo } from "@video-grabber/shared";

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

/** Cached alongside the summary — called once per video, not per user. */
export async function findRelatedVideos(topics: string[], excludeVideoId: string): Promise<RelatedVideo[]> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) throw new Error("Missing YOUTUBE_DATA_API_KEY");

  const query = topics.slice(0, 5).join(" ");
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("q", query);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`YouTube Data API search failed: ${response.status}`);
  }

  const json = (await response.json()) as YouTubeSearchResponse;

  return (json.items ?? [])
    .filter((item) => item.id?.videoId && item.id.videoId !== excludeVideoId)
    .map((item) => ({
      videoId: item.id!.videoId!,
      title: item.snippet?.title ?? "",
      channelTitle: item.snippet?.channelTitle ?? "",
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? "",
    }))
    .slice(0, 6);
}
