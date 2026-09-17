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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
        🚀 Coming next
      </span>
      <h2 className="mt-3 text-lg font-semibold tracking-tight sm:text-xl">
        We're building something new in this space
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Leave your email and we'll let you know when it's ready.
      </p>

      {status === "done" ? (
        <p className="mt-4 text-sm font-medium text-indigo-600">You're on the list — thanks!</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-base focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:w-64 sm:py-2 sm:text-sm"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-40 sm:py-2"
          >
            {status === "loading" ? "Submitting…" : "Notify me"}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
