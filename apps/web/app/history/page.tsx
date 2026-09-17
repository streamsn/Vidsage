"use client";

import { useEffect, useState } from "react";
import type { HistoryEntry } from "@video-grabber/shared";
import { useSupabaseSession } from "@/lib/useSupabaseSession";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

export default function HistoryPage() {
  const { session, loaded: sessionLoaded } = useSupabaseSession();
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openVideoId, setOpenVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    fetch("/api/history", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? "Failed to load history.");
        setEntries(body.entries as HistoryEntry[]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history."));
  }, [session]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-20">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">History</h1>
        <p className="mt-1.5 text-sm text-stone-500">Videos you've analyzed and the questions you've asked.</p>
      </div>

      {sessionLoaded && !session && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-stone-500">Sign in to see your history.</p>
          <GoogleSignInButton />
        </div>
      )}

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      {session && entries === null && !error && (
        <p className="text-center text-sm text-stone-500">Loading…</p>
      )}

      {session && entries !== null && entries.length === 0 && (
        <p className="text-center text-sm text-stone-500">
          Nothing here yet — analyze a video from the home page to get started.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {entries?.map(({ video, questions }) => {
          const isOpen = openVideoId === video.id;
          return (
            <div
              key={video.id}
              className="rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <button
                onClick={() => setOpenVideoId(isOpen ? null : video.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{video.title ?? video.id}</p>
                  {video.channelTitle && <p className="text-sm text-stone-500">{video.channelTitle}</p>}
                  <p className="mt-0.5 text-xs text-stone-400">
                    {questions.length} question{questions.length === 1 ? "" : "s"}
                  </p>
                </div>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className={
                    "h-4 w-4 flex-shrink-0 text-stone-400 transition-transform " + (isOpen ? "rotate-180" : "")
                  }
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-stone-200 p-4 sm:p-5">
                  {video.summary && <p className="text-sm leading-relaxed text-stone-700">{video.summary}</p>}
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-brand-700 hover:underline"
                  >
                    Watch on YouTube
                  </a>

                  <div className="mt-4 flex flex-col gap-3">
                    {questions.map((q) => (
                      <div key={q.id} className="flex flex-col gap-1.5">
                        <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2 text-sm text-white">
                          {q.question}
                        </p>
                        <p
                          className={
                            "max-w-[85%] rounded-2xl rounded-bl-sm border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm " +
                            (q.wasBlurred && !q.unlocked ? "text-stone-400 blur-sm" : "text-stone-700")
                          }
                        >
                          {q.answer ?? "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
