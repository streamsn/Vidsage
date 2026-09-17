"use client";

import { useState } from "react";
import type { AnalyzeResponse, AskResponse, VideoRecord } from "@video-grabber/shared";
import { useSupabaseSession } from "@/lib/useSupabaseSession";
import { useCredits } from "@/lib/useCredits";
import { GoogleSignInButton } from "./components/GoogleSignInButton";
import { AccountBar } from "./components/AccountBar";
import { OutOfCreditsModal } from "./components/OutOfCreditsModal";
import { WaitlistSection } from "./components/WaitlistSection";

const OUT_OF_CREDITS_PLACEHOLDER =
  "Your answer is ready — buy more credits to reveal it and keep asking questions about this video.";

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname === "youtu.be") return url.pathname.slice(1) || null;
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

export default function HomePage() {
  const { session, loaded: sessionLoaded } = useSupabaseSession();
  const { credits, setCredits } = useCredits(session);

  const [urlInput, setUrlInput] = useState("");
  const [video, setVideo] = useState<VideoRecord | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [thread, setThread] = useState<{ question: string; answer: string; blurred: boolean }[]>([]);
  const [showOutOfCredits, setShowOutOfCredits] = useState(false);

  async function handleAnalyze() {
    if (!session) return;
    const videoId = extractVideoId(urlInput);
    if (!videoId) {
      setAnalyzeError("Couldn't find a video ID in that link.");
      return;
    }

    setAnalyzing(true);
    setAnalyzeError(null);
    setVideo(null);
    setThread([]);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ videoId }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? `Analyze failed (${response.status})`);

      setVideo((body as AnalyzeResponse).video);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analyze failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAsk() {
    if (!session || !video || !question.trim()) return;

    setAsking(true);
    setAskError(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ videoId: video.id, question }),
      });

      const body = (await response.json()) as AskResponse & { error?: string };
      if (!response.ok) throw new Error(body?.error ?? `Ask failed (${response.status})`);

      if (body.blocked) {
        setThread((t) => [...t, { question, answer: OUT_OF_CREDITS_PLACEHOLDER, blurred: true }]);
        setQuestion("");
        setShowOutOfCredits(true);
      } else {
        setThread((t) => [...t, { question, answer: body.answer ?? "", blurred: body.blurred }]);
        setQuestion("");
      }

      setCredits((c) => (c ? { ...c, creditBalance: body.creditBalance } : c));
    } catch (err) {
      setAskError(err instanceof Error ? err.message : "Ask failed.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-9rem] h-[26rem] w-[38rem] -translate-x-1/2 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute right-[-6rem] top-10 h-64 w-64 rounded-full bg-brand-300/30 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
            ✨ 3 free credits when you sign up
          </span>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl sm:leading-tight">
            Ask any <span className="text-brand-600">YouTube video</span> a question
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-stone-500 sm:text-base">
            Paste a link, get a summary, and chat with the video itself.
          </p>
          {session && <div className="mt-4"><AccountBar session={session} credits={credits} /></div>}
        </div>

        {sessionLoaded && !session && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-stone-500">Sign in to get started.</p>
            <GoogleSignInButton />
          </div>
        )}

        {session && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
              <label className="text-sm font-medium text-stone-700">YouTube URL or video ID</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                  >
                    <path
                      d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    inputMode="url"
                    className="w-full rounded-xl border border-stone-200 py-3 pl-9 pr-3 text-base focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:py-2 sm:text-sm"
                  />
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || !urlInput.trim()}
                  className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-40 sm:py-2"
                >
                  {analyzing ? "Analyzing…" : "Analyze"}
                </button>
              </div>
              {analyzeError && <p className="text-sm text-red-600">{analyzeError}</p>}
            </div>

            {video && (
              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">{video.title ?? video.id}</h2>
                {video.channelTitle && <p className="text-sm text-stone-500">{video.channelTitle}</p>}
                {video.summary && <p className="mt-3 text-sm leading-relaxed text-stone-700">{video.summary}</p>}
                {video.topics && video.topics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {video.topics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  {thread.map((entry, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2 text-sm text-white">
                        {entry.question}
                      </p>
                      <p
                        className={
                          "max-w-[85%] rounded-2xl rounded-bl-sm border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm " +
                          (entry.blurred ? "text-stone-400 blur-sm" : "text-stone-700")
                        }
                      >
                        {entry.answer}
                      </p>
                    </div>
                  ))}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask something about this video…"
                      onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                      className="flex-1 rounded-xl border border-stone-200 px-3.5 py-3 text-base focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:py-2 sm:text-sm"
                    />
                    <button
                      onClick={handleAsk}
                      disabled={asking || !question.trim()}
                      className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-40 sm:py-2"
                    >
                      {asking ? "Asking…" : "Ask"}
                    </button>
                  </div>
                  {askError && <p className="text-sm text-red-600">{askError}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-2 pt-6 sm:mt-10 sm:pt-10">
          <div className="h-px w-16 bg-stone-200" />
          <div className="w-full">
            <WaitlistSection />
          </div>
        </div>

        {showOutOfCredits && <OutOfCreditsModal onClose={() => setShowOutOfCredits(false)} />}
      </div>
    </main>
  );
}
