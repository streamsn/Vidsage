import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "VidSage — ask any YouTube video a question";

// satori (which ImageResponse uses) needs real font bytes — its generic
// "sans-serif" fallback has imprecise glyph metrics that show up as
// inconsistent-looking word spacing. An old-browser User-Agent makes Google
// Fonts serve .ttf instead of .woff2, which satori can parse.
async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
  const css = await fetch(cssUrl, {
    headers: {
      // An old-browser UA makes Google Fonts serve .woff/.ttf instead of
      // .woff2, which satori can parse (it can't parse .woff2).
      "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
    },
  }).then((res) => res.text());

  // The CSS has one @font-face block per unicode-range subset (cyrillic,
  // greek, etc.) -- grab the one covering basic Latin (our text is English).
  const latinBlock = css.split("@font-face").find((block) => block.includes("U+0000-00FF"));
  const fontUrlMatch = latinBlock?.match(/src: url\((.+?)\)/);
  if (!fontUrlMatch) throw new Error(`Could not find a Latin-subset font URL for ${family} ${weight}`);

  return fetch(fontUrlMatch[1]).then((res) => res.arrayBuffer());
}

export default async function Image() {
  const [interRegular, interBold] = await Promise.all([
    loadGoogleFont("Inter", 400),
    loadGoogleFont("Inter", 700),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg, #C68F4E 0%, #6E4622 100%)",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 28,
              background: "rgba(255,255,255,0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="48" height="60" viewBox="0 0 48 60" style={{ marginLeft: 10 }}>
              <polygon points="0,0 48,30 0,60" fill="#FBF4EC" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#FBF4EC" }}>VidSage</div>
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 36, fontWeight: 400, color: "#F3E4CF" }}>
          Ask any YouTube video a question
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interBold, weight: 700, style: "normal" },
      ],
    },
  );
}
