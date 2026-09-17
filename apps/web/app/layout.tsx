import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Footer } from "./components/Footer";
import { Logo } from "./components/Logo";
import { NavLinks } from "./components/NavLinks";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const description = "Paste a YouTube link, get an instant AI summary, and ask follow-up questions about the video.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "VidSage",
  description,
  openGraph: {
    title: "VidSage — ask any YouTube video a question",
    description,
    siteName: "VidSage",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VidSage — ask any YouTube video a question",
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} flex min-h-screen flex-col bg-stone-50 font-sans text-stone-900`}>
        <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-white/80 backdrop-blur">
          <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5 sm:px-6">
            <Link href="/" className="-m-2 flex items-center gap-2.5 p-2 font-semibold tracking-tight">
              <Logo className="h-7 w-7" />
              VidSage
            </Link>
            <NavLinks />
          </nav>
        </header>
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
