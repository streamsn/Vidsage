// Manual smoke test for the YouTube transcript + related-video pipeline.
// Hits live APIs using apps/web/.env.local — run before shipping a change to
// captions.ts or dataApi.ts. Not part of `npm test` (needs real credentials/network).
//
// Usage: node scripts/smoke-test.ts [videoId]

import { readFileSync } from "node:fs";

function loadEnvLocal() {
  const raw = readFileSync("apps/web/.env.local", "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim();
  }
}

async function main() {
  loadEnvLocal();

  const { getTranscript } = await import("../apps/web/lib/youtube/captions");
  const { findRelatedVideos } = await import("../apps/web/lib/youtube/dataApi");

  const videoId = process.argv[2] ?? "dQw4w9WgXcQ";

  console.log(`--- getTranscript(${videoId}) ---`);
  const result = await getTranscript(videoId);
  console.log(JSON.stringify(result.ok ? { ...result, text: `(${result.text.length} chars)` } : result, null, 2));

  if (!result.ok) {
    console.error("FAILED: getTranscript did not return ok:true");
    process.exit(1);
  }

  console.log("\n--- findRelatedVideos ---");
  const related = await findRelatedVideos(["Rick Astley", "1980s pop music", "rickroll meme"], videoId);
  console.log(JSON.stringify(related, null, 2));

  console.log("\nSmoke test passed.");
}

main().catch((err) => {
  console.error("FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
