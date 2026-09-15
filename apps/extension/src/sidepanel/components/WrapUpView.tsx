import { useState } from "react";
import type { WrapUpResponse } from "@video-grabber/shared";
import { useAppStore } from "../state/store";
import { getWrapUp } from "../lib/api";

export function WrapUpView() {
  const session = useAppStore((s) => s.session);
  const video = useAppStore((s) => s.video);
  const [wrapUp, setWrapUp] = useState<WrapUpResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLoad() {
    if (!session || !video) return;
    setLoading(true);
    try {
      setWrapUp(await getWrapUp(session.access_token, video.id));
    } finally {
      setLoading(false);
    }
  }

  if (!wrapUp) {
    return (
      <button
        onClick={handleLoad}
        disabled={loading}
        className="border-t border-slate-100 p-4 text-left text-sm text-slate-500 hover:text-slate-700"
      >
        {loading ? "Loading wrap-up…" : "View summary, Q&A recap, and related videos →"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-700">Summary</h3>
        <p className="text-sm text-slate-600">{wrapUp.video.summary}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700">Your questions</h3>
        <ul className="flex flex-col gap-2">
          {wrapUp.questions.map((q) => (
            <li key={q.id} className="text-sm">
              <p className="font-medium text-slate-800">{q.question}</p>
              <p className="text-slate-600">{q.wasBlurred && !q.unlocked ? "🔒 Locked" : q.answer}</p>
            </li>
          ))}
        </ul>
      </div>

      {wrapUp.video.relatedVideos && wrapUp.video.relatedVideos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Related videos</h3>
          <ul className="flex flex-col gap-2">
            {wrapUp.video.relatedVideos.map((rv) => (
              <li key={rv.videoId}>
                <a
                  href={`https://www.youtube.com/watch?v=${rv.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-slate-700 underline hover:text-slate-900"
                >
                  {rv.title}
                </a>
                <p className="text-xs text-slate-400">{rv.channelTitle}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
