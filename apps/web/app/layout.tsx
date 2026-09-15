import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VidSage",
  description: "Ask questions about any YouTube video, right from your browser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900">{children}</body>
    </html>
  );
}
