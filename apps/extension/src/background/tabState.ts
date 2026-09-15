import type { CurrentVideo } from "@video-grabber/shared";

const tabVideos = new Map<number, CurrentVideo>();

export function setTabVideo(tabId: number, video: CurrentVideo) {
  tabVideos.set(tabId, video);
}

export function getTabVideo(tabId: number): CurrentVideo | null {
  return tabVideos.get(tabId) ?? null;
}

chrome.tabs.onRemoved.addListener((tabId) => {
  tabVideos.delete(tabId);
});
