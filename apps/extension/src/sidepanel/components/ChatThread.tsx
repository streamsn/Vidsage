import { useState } from "react";
import { useAppStore } from "../state/store";
import { askQuestion } from "../lib/api";
import { BlurredAnswer } from "./BlurredAnswer";
import { BuyCreditsModal } from "./BuyCreditsModal";

export function ChatThread() {
  const session = useAppStore((s) => s.session);
  const video = useAppStore((s) => s.video);
  const questions = useAppStore((s) => s.questions);
  const addQuestion = useAppStore((s) => s.addQuestion);
  const setCredits = useAppStore((s) => s.setCredits);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);

  async function handleAsk() {
    if (!session || !video || !input.trim() || sending) return;
    const question = input.trim();
    setInput("");
    setSending(true);

    try {
      const response = await askQuestion(session.access_token, video.id, question);

      if (response.blocked) {
        setCredits(response.creditBalance, true);
        setBlockedModalOpen(true);
        return;
      }

      addQuestion({
        id: Date.now(),
        videoId: video.id,
        question,
        answer: response.answer,
        wasBlurred: response.blurred,
        isTeaser: response.blurred,
        unlocked: false,
        createdAt: new Date().toISOString(),
      });
      setCredits(response.creditBalance, response.blurred);
    } catch {
      // Answer generation failed server-side and was refunded automatically
      // (see rpc_refund_question); just let the user retry.
      setInput(question);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {questions.map((q) => (
        <div key={q.id} className="flex flex-col gap-1">
          <p className="text-sm font-medium text-slate-800">{q.question}</p>
          {q.answer &&
            (q.wasBlurred && !q.unlocked ? (
              <BlurredAnswer answer={q.answer} />
            ) : (
              <p className="text-sm text-slate-600">{q.answer}</p>
            ))}
        </div>
      ))}

      <div className="mt-auto flex gap-2 pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Ask about this video…"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          onClick={handleAsk}
          disabled={sending || !input.trim()}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          Ask
        </button>
      </div>

      {blockedModalOpen && <BuyCreditsModal onClose={() => setBlockedModalOpen(false)} />}
    </div>
  );
}
