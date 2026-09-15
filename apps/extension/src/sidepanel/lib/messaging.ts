import type { ExtensionMessage } from "@video-grabber/shared";
import type { Session } from "@supabase/supabase-js";

async function send<T>(message: ExtensionMessage): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>;
}

export function getSession() {
  return send<{ session: Session | null }>({ type: "GET_SESSION" });
}

export function signIn() {
  return send<{ session: Session | null; error?: string }>({ type: "SIGN_IN" });
}

export function signOut() {
  return send<{ ok: boolean }>({ type: "SIGN_OUT" });
}

export function getCurrentVideo(tabId: number) {
  return send<{ video: { videoId: string; title: string } | null }>({
    type: "GET_CURRENT_VIDEO",
    tabId,
  });
}

/** The active tab in the window the side panel is attached to. */
export async function getActiveTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}
