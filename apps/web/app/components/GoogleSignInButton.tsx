"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function GoogleSignInButton() {
  const [gsiReady, setGsiReady] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gsiReady || !buttonRef.current || !window.google) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) return;

    let cancelled = false;
    const container = buttonRef.current;

    // Binds this specific login attempt's ID token to a one-time nonce so a
    // token obtained some other way (leaked, replayed) can't be reused here.
    (async () => {
      const rawNonce = generateNonce();
      const hashedNonce = await sha256Hex(rawNonce);
      if (cancelled || !window.google) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        callback: async (response) => {
          await supabaseBrowser.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
            nonce: rawNonce,
          });
        },
      });

      window.google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [gsiReady]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiReady(true)}
      />
      <div ref={buttonRef} />
    </>
  );
}
