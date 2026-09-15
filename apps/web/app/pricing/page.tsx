import { CREDIT_PACKAGES } from "@video-grabber/shared";

export default function PricingPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">Buy credits</h1>
      <div className="grid w-full gap-4 sm:grid-cols-2">
        {Object.values(CREDIT_PACKAGES).map((pkg) => (
          <div key={pkg.id} className="rounded-xl border border-slate-200 p-6">
            <p className="text-2xl font-semibold">{pkg.credits} credits</p>
            <p className="text-slate-500">${pkg.priceUsd}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-400">
        Checkout wiring (session handoff from the extension + Stripe redirect) lands in build
        milestone M5.
      </p>
    </main>
  );
}
