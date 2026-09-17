# ADR-0001: Remove the Chrome extension, ship VidSage as a web app only

- **Status:** Accepted
- **Date:** 2026-09-16

## Context

VidSage originally shipped as a Chrome extension (side panel UI) backed by a
Next.js API + Supabase. The extension owned auth handoff, the chat UI, and the
buy-credits modal; the web app was mostly API routes plus a placeholder
pricing page.

## Decision

Delete `apps/extension/` entirely (manifest, background scripts, side panel
UI, its own Supabase client and Vite build) and move all of its
responsibilities into the Next.js web app:

- Google Sign-In via Google Identity Services + `supabase.auth.signInWithIdToken`
  (`apps/web/app/components/GoogleSignInButton.tsx`)
- A browser-side Supabase client for session state (`apps/web/lib/supabaseBrowser.ts`,
  `useSupabaseSession.ts`, `useCredits.ts`)
- The full analyze → summarize → ask flow, previously in the side panel, now
  on `apps/web/app/page.tsx`
- Stripe checkout wired directly into `/pricing`, calling the existing
  `/api/stripe/checkout` route with a bearer token

Root `package.json` drops the `dev:extension`/`build:extension` scripts and
the `playwright` devDependency that existed to drive the extension.

## Consequences

- One deployable surface instead of two (extension review/signing process is
  no longer a release dependency).
- `.env.example` no longer needs the `chromiumapp.org` OAuth redirect URI or
  per-install extension ID; it gains `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` for
  the client-side sign-in button instead.
- Losing the extension means losing "analyze the video I'm currently
  watching" convenience (no `content script` / active-tab access) — users now
  paste a URL instead. Acceptable tradeoff for shipping one surface faster.
- If an extension is reconsidered later, it can be re-added as a thin client
  against the same API routes rather than duplicating auth/state logic.
