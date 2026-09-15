import { signIn } from "../lib/messaging";
import { useAppStore } from "../state/store";

export function LoginScreen() {
  const setSession = useAppStore((s) => s.setSession);
  const setStatus = useAppStore((s) => s.setStatus);
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);

  async function handleSignIn() {
    setStatus("loading");
    const { session, error } = await signIn();
    if (error) {
      setStatus("error", error);
      return;
    }
    setSession(session ?? null);
    setStatus("idle");
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">VidSage</h1>
      <p className="text-sm text-slate-500">Sign in to analyze this video and ask questions.</p>
      <button
        onClick={handleSignIn}
        disabled={status === "loading"}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {status === "loading" ? "Signing in…" : "Sign in with Google"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
