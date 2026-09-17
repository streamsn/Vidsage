import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-10 text-center text-sm text-stone-500 sm:flex-row sm:justify-between sm:px-6">
        <p>&copy; {new Date().getFullYear()} VidSage. All rights reserved.</p>
        <nav className="flex gap-5">
          <Link href="/privacy" className="hover:text-stone-900">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-stone-900">
            Terms
          </Link>
          <a href="mailto:kaabeerjr2@gmail.com" className="hover:text-stone-900">
            Support
          </a>
        </nav>
      </div>
    </footer>
  );
}
