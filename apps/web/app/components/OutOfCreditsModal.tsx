"use client";

import Link from "next/link";

export function OutOfCreditsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-lg">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
            <path
              d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm2-11V7a4 4 0 118 0v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h2 className="mt-3 text-lg font-semibold">You're out of credits</h2>
        <p className="mt-1 text-sm text-slate-500">
          Buy more credits to keep asking questions about this video.
        </p>
        <Link
          href="/pricing"
          className="mt-4 block rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 sm:py-2"
        >
          Buy credits
        </Link>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
