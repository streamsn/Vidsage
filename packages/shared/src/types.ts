export type VideoStatus = "pending" | "ready" | "failed";

export interface CurrentVideo {
  videoId: string;
  title: string;
}

export interface RelatedVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
}

export interface VideoRecord {
  id: string;
  title: string | null;
  channelTitle: string | null;
  durationSeconds: number | null;
  summary: string | null;
  topics: string[] | null;
  relatedVideos: RelatedVideo[] | null;
  status: VideoStatus;
  transcriptUnavailable: boolean;
}

export interface QuestionRecord {
  id: number;
  videoId: string;
  question: string;
  answer: string | null;
  wasBlurred: boolean;
  isTeaser: boolean;
  unlocked: boolean;
  createdAt: string;
}

export interface AnalyzeRequest {
  videoId: string;
}

export interface AnalyzeResponse {
  video: VideoRecord;
}

export type AskDecision = "charge" | "teaser" | "blocked";

export interface AskRequest {
  videoId: string;
  question: string;
}

export interface AskResponse {
  answer: string | null;
  blurred: boolean;
  blocked: boolean;
  creditBalance: number;
}

export interface WrapUpResponse {
  video: VideoRecord;
  questions: QuestionRecord[];
}

export interface CreditsResponse {
  creditBalance: number;
  hasUnresolvedTeaser: boolean;
}

export interface HistoryEntry {
  video: VideoRecord;
  questions: QuestionRecord[];
}

export interface HistoryResponse {
  entries: HistoryEntry[];
}

// Messages passed between the content script, background service worker,
// and side panel inside the extension.
export type ExtensionMessage =
  // tabId is omitted by the content script (background fills it in from
  // the message sender) and only needed when sent some other way.
  | { type: "VIDEO_CHANGED"; videoId: string; title: string; tabId?: number }
  | { type: "GET_CURRENT_VIDEO"; tabId: number }
  | { type: "GET_SESSION" }
  | { type: "SIGN_IN" }
  | { type: "SIGN_OUT" };
