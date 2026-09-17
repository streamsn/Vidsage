export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Privacy Policy</h1>
      <p className="mt-1 text-sm text-slate-500">Effective September 16, 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-slate-700">
        <p>
          This policy explains what information VidSage ("we," "us") collects when you use the
          VidSage website and service (the "Service"), and how we use it.
        </p>

        <section>
          <h2 className="text-base font-semibold text-slate-900">Information we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Account information.</strong> When you sign in with Google, we receive your
              name, email address, and profile photo from Google.
            </li>
            <li>
              <strong>Usage data.</strong> The YouTube videos you analyze, the questions you ask,
              and the answers you receive, tied to your account.
            </li>
            <li>
              <strong>Payment information.</strong> When you buy credits, payment is processed
              entirely by Stripe. We never see or store your full card number — only that a
              purchase was made and how many credits it was for.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">How we use this information</h2>
          <p className="mt-2">We use the information above to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Provide the Service — generate summaries and answer your questions.</li>
            <li>
              Cache video summaries and transcripts so other users asking about the same public
              YouTube video don't need to pay the cost of re-analyzing it. This cached data is
              tied to the video, not to you.
            </li>
            <li>Track and apply your credit balance.</li>
            <li>Respond to support requests.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">Third-party services we use</h2>
          <p className="mt-2">
            VidSage is built on top of several third-party services, each of which processes a
            slice of the data described above under its own privacy policy:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Google</strong> — sign-in.
            </li>
            <li>
              <strong>Supabase</strong> — database and authentication infrastructure.
            </li>
            <li>
              <strong>Anthropic (Claude)</strong> — generates video summaries and answers to your
              questions from video transcripts.
            </li>
            <li>
              <strong>Supadata</strong> — retrieves YouTube video transcripts.
            </li>
            <li>
              <strong>YouTube Data API</strong> — video titles, channels, and related videos.
            </li>
            <li>
              <strong>Stripe</strong> — payment processing.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">Data retention</h2>
          <p className="mt-2">
            Cached video summaries and transcripts are retained indefinitely so they can be reused
            across users. Your account, question history, and credit balance are retained until
            you ask us to delete them.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">Your rights</h2>
          <p className="mt-2">
            You can ask us to access, correct, or delete your personal data at any time by
            emailing us — see Contact below.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">Children's privacy</h2>
          <p className="mt-2">
            The Service is not directed to children under 13, and we do not knowingly collect
            personal information from them.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">Changes to this policy</h2>
          <p className="mt-2">
            We may update this policy from time to time. We'll update the effective date above
            when we do.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">Contact</h2>
          <p className="mt-2">
            Questions about this policy?{" "}
            <a href="mailto:kaabeerjr2@gmail.com" className="text-indigo-600 hover:underline">
              kaabeerjr2@gmail.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
