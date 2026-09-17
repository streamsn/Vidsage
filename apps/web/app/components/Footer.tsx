import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-8 text-center text-sm text-slate-500 sm:flex-row sm:justify-between sm:px-6">
        <p>&copy; {new Date().getFullYear()} VidSage. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link href="/privacy" className="hover:text-slate-900">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-slate-900">
            Terms
          </Link>
          <a href="mailto:kaabeerjr2@gmail.com" className="hover:text-slate-900">
            Support
          </a>
        </nav>
      </div>
    </footer>
  );
}
