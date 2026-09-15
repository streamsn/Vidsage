import type { VideoRecord } from "@video-grabber/shared";

export function SummaryView({ video }: { video: VideoRecord }) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 p-4">
      <h2 className="text-sm font-semibold text-slate-700">Summary</h2>
      <p className="text-sm text-slate-600">{video.summary}</p>
    </div>
  );
}
