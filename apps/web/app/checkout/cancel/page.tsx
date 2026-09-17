import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 sm:py-24">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Checkout canceled</h1>
      <p className="text-slate-600">No charge was made. You can buy credits any time from the pricing page.</p>
      <Link
        href="/pricing"
        className="mt-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 sm:py-2"
      >
        Back to pricing
      </Link>
    </main>
  );
}
