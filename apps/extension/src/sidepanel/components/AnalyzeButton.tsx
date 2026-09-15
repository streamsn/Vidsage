import { useAppStore } from "../state/store";
import { analyzeVideo, getWrapUp } from "../lib/api";

export function AnalyzeButton() {
  const session = useAppStore((s) => s.session);
  const currentVideo = useAppStore((s) => s.currentVideo);
  const setVideo = useAppStore((s) => s.setVideo);
  const setQuestions = useAppStore((s) => s.setQuestions);
  const setStatus = useAppStore((s) => s.setStatus);
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);

  if (!currentVideo) {
    return <p className="p-4 text-sm text-slate-500">Open a YouTube video to get started.</p>;
  }

  async function handleAnalyze() {
    if (!session || !currentVideo) return;
    setStatus("loading");
    try {
      const { video } = await analyzeVideo(session.access_token, currentVideo.videoId);
      setVideo(video);

      // Restore any prior chat history for this user + video (e.g. reopening
      // the panel or switching back to a tab).
      const wrapUp = await getWrapUp(session.access_token, video.id);
      setQuestions(wrapUp.questions);

      setStatus("idle");
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Failed to analyze video");
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="truncate text-sm text-slate-500">Currently watching: {currentVideo.title}</p>
      <button
        onClick={handleAnalyze}
        disabled={status === "loading"}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {status === "loading" ? "Analyzing…" : "Analyze this video"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
