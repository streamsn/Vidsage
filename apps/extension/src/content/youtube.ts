import type { ExtensionMessage } from "@video-grabber/shared";

function getVideoIdFromUrl(): string | null {
  return new URL(location.href).searchParams.get("v");
}

function getVideoTitle(): string {
  return document.title.replace(/ - YouTube$/, "");
}

let lastVideoId: string | null = null;

function notifyIfChanged() {
  const videoId = getVideoIdFromUrl();
  if (!videoId || videoId === lastVideoId) return;

  lastVideoId = videoId;

  const message: ExtensionMessage = {
    type: "VIDEO_CHANGED",
    videoId,
    title: getVideoTitle(),
  };

  chrome.runtime.sendMessage(message).catch(() => {
    // Background may not be ready yet (e.g. right after install/reload);
    // the next navigation or the poll fallback below will retry.
  });
}

// YouTube is a single-page app — it swaps the player in place instead of a
// full page navigation, and fires this custom event when it does.
document.addEventListener("yt-navigate-finish", notifyIfChanged);

// Safety net in case YouTube ever stops firing that event for some
// navigation path.
setInterval(notifyIfChanged, 750);

notifyIfChanged();
