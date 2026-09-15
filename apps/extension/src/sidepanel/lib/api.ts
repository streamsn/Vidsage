import type {
  AnalyzeResponse,
  AskResponse,
  CreditPackageId,
  CreditsResponse,
  WrapUpResponse,
} from "@video-grabber/shared";

const APP_URL = import.meta.env.VITE_APP_URL;

async function authedFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${APP_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body?.error ?? `Request to ${path} failed with ${response.status}`);
  }

  return body as T;
}

export function analyzeVideo(accessToken: string, videoId: string) {
  return authedFetch<AnalyzeResponse>("/api/analyze", accessToken, {
    method: "POST",
    body: JSON.stringify({ videoId }),
  });
}

export function askQuestion(accessToken: string, videoId: string, question: string) {
  return authedFetch<AskResponse>("/api/ask", accessToken, {
    method: "POST",
    body: JSON.stringify({ videoId, question }),
  });
}

export function getWrapUp(accessToken: string, videoId: string) {
  return authedFetch<WrapUpResponse>(`/api/wrapup?videoId=${encodeURIComponent(videoId)}`, accessToken);
}

export function getCredits(accessToken: string) {
  return authedFetch<CreditsResponse>("/api/credits", accessToken);
}

export async function openCheckout(accessToken: string, packageId: CreditPackageId) {
  const { url } = await authedFetch<{ url: string }>("/api/stripe/checkout", accessToken, {
    method: "POST",
    body: JSON.stringify({ packageId }),
  });

  await chrome.tabs.create({ url });
}
