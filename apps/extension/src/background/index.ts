import type { ExtensionMessage } from "@video-grabber/shared";
import { getSession, signInWithGoogle, signOut } from "./auth";
import { getTabVideo, setTabVideo } from "./tabState";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // keep the message channel open for the async sendResponse
});

async function handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    case "VIDEO_CHANGED": {
      const tabId = sender.tab?.id ?? message.tabId;
      if (tabId == null) return { ok: false };
      setTabVideo(tabId, { videoId: message.videoId, title: message.title });
      return { ok: true };
    }

    case "GET_CURRENT_VIDEO": {
      return { video: getTabVideo(message.tabId) };
    }

    case "GET_SESSION": {
      const session = await getSession();
      return { session };
    }

    case "SIGN_IN": {
      try {
        const session = await signInWithGoogle();
        return { session };
      } catch (error) {
        return { error: error instanceof Error ? error.message : "Sign-in failed" };
      }
    }

    case "SIGN_OUT": {
      await signOut();
      return { ok: true };
    }

    default:
      return { error: "Unknown message type" };
  }
}
