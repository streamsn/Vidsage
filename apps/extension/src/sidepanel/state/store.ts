import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { CurrentVideo, QuestionRecord, VideoRecord } from "@video-grabber/shared";

export type ViewStatus = "idle" | "loading" | "error";

interface AppState {
  session: Session | null;
  currentVideo: CurrentVideo | null;
  video: VideoRecord | null;
  questions: QuestionRecord[];
  creditBalance: number;
  hasUnresolvedTeaser: boolean;
  status: ViewStatus;
  error: string | null;

  setSession: (session: Session | null) => void;
  setCurrentVideo: (video: CurrentVideo | null) => void;
  setVideo: (video: VideoRecord | null) => void;
  setQuestions: (questions: QuestionRecord[]) => void;
  addQuestion: (question: QuestionRecord) => void;
  setCredits: (balance: number, hasUnresolvedTeaser: boolean) => void;
  setStatus: (status: ViewStatus, error?: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  session: null,
  currentVideo: null,
  video: null,
  questions: [],
  creditBalance: 0,
  hasUnresolvedTeaser: false,
  status: "idle",
  error: null,

  setSession: (session) => set({ session }),
  setCurrentVideo: (currentVideo) => set({ currentVideo, video: null, questions: [] }),
  setVideo: (video) => set({ video }),
  setQuestions: (questions) => set({ questions }),
  addQuestion: (question) => set((state) => ({ questions: [...state.questions, question] })),
  setCredits: (creditBalance, hasUnresolvedTeaser) => set({ creditBalance, hasUnresolvedTeaser }),
  setStatus: (status, error = null) => set({ status, error }),
  reset: () => set({ video: null, questions: [], status: "idle", error: null }),
}));
