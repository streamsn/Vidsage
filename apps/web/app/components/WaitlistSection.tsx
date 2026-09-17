"use client";

import { useState } from "react";

export function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Something went wrong, try again.");

      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong, try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-brand-200/70 bg-brand-50/60 p-8 text-center shadow-sm sm:p-10">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm">
        🚀 Coming next
      </span>
      <h2 className="mt-4 text-lg font-semibold tracking-tight text-stone-900 sm:text-xl">
        We're building something new in this space
      </h2>
      <p className="mt-1.5 text-sm text-stone-500">
        Leave your email and we'll let you know when it's ready.
      </p>

      {status === "done" ? (
        <p className="mt-5 text-sm font-medium text-brand-700">You're on the list — thanks!</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-base focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-64 sm:py-2 sm:text-sm"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-40 sm:py-2"
          >
            {status === "loading" ? "Submitting…" : "Notify me"}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
