import { createClient, type Session } from "@supabase/supabase-js";
import { chromeStorageAdapter } from "./chromeStorageAdapter";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: chromeStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

function randomNonce(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Google OAuth via chrome.identity.launchWebAuthFlow, exchanged for a
 * Supabase session. The redirect URI (https://<extension-id>.chromiumapp.org/)
 * must be registered as an authorized redirect URI on the Google OAuth
 * client — see .env.example for where that client ID comes from.
 */
export async function signInWithGoogle(): Promise<Session | null> {
  const redirectUri = chrome.identity.getRedirectURL();
  const nonce = randomNonce();

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID);
  authUrl.searchParams.set("response_type", "id_token");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("nonce", nonce);

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });

  if (!responseUrl) {
    throw new Error("Google sign-in was canceled");
  }

  const fragment = new URL(responseUrl).hash.substring(1);
  const idToken = new URLSearchParams(fragment).get("id_token");

  if (!idToken) {
    throw new Error("Google sign-in did not return an id_token");
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    nonce,
  });

  if (error) throw error;
  return data.session;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
