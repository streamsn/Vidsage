"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export function GoogleSignInButton() {
  const [gsiReady, setGsiReady] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gsiReady || !buttonRef.current || !window.google) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        await supabaseBrowser.auth.signInWithIdToken({ provider: "google", token: response.credential });
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
    });
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
