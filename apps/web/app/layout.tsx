import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Footer } from "./components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "VidSage",
  description: "Ask questions about any YouTube video, right from your browser.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900`}>
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur">
          <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="-m-2 flex items-center gap-2 p-2 font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M8 5v14l11-7-11-7z" fill="currentColor" />
                </svg>
              </span>
              VidSage
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/history"
                className="-m-2 rounded-lg p-2 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                History
              </Link>
              <Link
                href="/pricing"
                className="-m-2 rounded-lg p-2 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Pricing
              </Link>
            </div>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
