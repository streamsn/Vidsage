"use client";

import { useState } from "react";
import { CREDIT_PACKAGES, type CreditPackageId } from "@video-grabber/shared";
import { useSupabaseSession } from "@/lib/useSupabaseSession";
import { useCredits } from "@/lib/useCredits";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { AccountBar } from "../components/AccountBar";

const PACKAGE_BLURB: Record<CreditPackageId, string> = {
  small: "Perfect for trying it out or one deep dive into a video.",
  large: "Half the price per question — best if you use VidSage regularly.",
};

export default function PricingPage() {
  const { session, loaded: sessionLoaded } = useSupabaseSession();
  const { credits } = useCredits(session);
  const [pendingPackage, setPendingPackage] = useState<CreditPackageId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(packageId: CreditPackageId) {
    if (!session) return;
    setError(null);
    setPendingPackage(packageId);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packageId }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Checkout failed to start.");

      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed to start.");
      setPendingPackage(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-10 px-4 py-12 text-center sm:px-6 sm:py-24">
      <div>
        <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
          Pay as you go
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Buy credits</h1>
        <p className="mt-1.5 text-sm text-stone-500">
          1 credit = 1 question answered. No subscription — credits never expire.
        </p>
        {session && <div className="mt-4"><AccountBar session={session} credits={credits} /></div>}
      </div>

      {error && (
        <p className="w-full rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {sessionLoaded && !session && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-stone-500">Sign in to buy credits.</p>
          <GoogleSignInButton />
        </div>
      )}

      <div className="grid w-full gap-4 sm:grid-cols-2">
        {Object.values(CREDIT_PACKAGES).map((pkg, i) => {
          const featured = i === 0;
          return (
            <div
              key={pkg.id}
              className={
                "relative rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md " +
                (featured ? "border-brand-300 ring-1 ring-brand-100" : "border-stone-200")
              }
            >
              <span
                className={
                  "inline-block rounded-full px-2.5 py-1 text-xs font-medium " +
                  (featured ? "bg-brand-100 text-brand-700" : "bg-stone-100 text-stone-500")
                }
              >
                {featured ? "Popular" : "Best value"}
              </span>
              <p className="mt-3 text-2xl font-semibold">{pkg.credits} credits</p>
              <p className="text-stone-500">
                ${pkg.priceUsd} <span className="text-xs text-stone-500">(${(pkg.priceUsd / pkg.credits).toFixed(2)}/question)</span>
              </p>
              <p className="mt-2 text-sm text-stone-500">{PACKAGE_BLURB[pkg.id as CreditPackageId]}</p>
              <button
                onClick={() => handleBuy(pkg.id as CreditPackageId)}
                disabled={!session || pendingPackage !== null}
                className={
                  "mt-4 w-full rounded-xl px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:py-2 " +
                  (featured ? "bg-brand-600 hover:bg-brand-700" : "bg-stone-900 hover:bg-stone-800")
                }
              >
                {pendingPackage === pkg.id ? "Redirecting…" : session ? "Buy" : "Sign in to buy"}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
