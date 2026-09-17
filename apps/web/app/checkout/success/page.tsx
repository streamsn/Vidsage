import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 sm:py-24">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Thanks — credits are on the way</h1>
      <p className="text-stone-600">Your balance updates automatically — head back and keep asking.</p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 sm:py-2"
      >
        Back to VidSage
      </Link>
    </main>
  );
}
