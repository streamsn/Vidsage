import { useState } from "react";
import { BuyCreditsModal } from "./BuyCreditsModal";

export function BlurredAnswer({ answer }: { answer: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-lg bg-slate-50 p-3">
      <p className="select-none text-sm text-slate-600 blur-sm">{answer}</p>
      <div className="absolute inset-0 flex items-center justify-center bg-white/40">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          Unlock this answer
        </button>
      </div>
      {showModal && <BuyCreditsModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
