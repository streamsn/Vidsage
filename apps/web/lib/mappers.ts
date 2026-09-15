import type { QuestionRecord, VideoRecord } from "@video-grabber/shared";

// Row shapes as returned by Supabase (snake_case columns) -> shared camelCase types.

export interface VideoRow {
  id: string;
  title: string | null;
  channel_title: string | null;
  duration_seconds: number | null;
  summary: string | null;
  topics: string[] | null;
  related_videos: VideoRecord["relatedVideos"];
  status: VideoRecord["status"];
  transcript_unavailable: boolean;
}

export function toVideoRecord(row: VideoRow): VideoRecord {
  return {
    id: row.id,
    title: row.title,
    channelTitle: row.channel_title,
    durationSeconds: row.duration_seconds,
    summary: row.summary,
    topics: row.topics,
    relatedVideos: row.related_videos,
    status: row.status,
    transcriptUnavailable: row.transcript_unavailable,
  };
}

export interface QuestionRow {
  id: number;
  video_id: string;
  question: string;
  answer: string | null;
  was_blurred: boolean;
  is_teaser: boolean;
  unlocked: boolean;
  created_at: string;
}

export function toQuestionRecord(row: QuestionRow): QuestionRecord {
  return {
    id: row.id,
    videoId: row.video_id,
    question: row.question,
    answer: row.answer,
    wasBlurred: row.was_blurred,
    isTeaser: row.is_teaser,
    unlocked: row.unlocked,
    createdAt: row.created_at,
  };
}
