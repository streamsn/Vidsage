import { useEffect } from "react";
import { useAppStore } from "./state/store";
import { getSession, getActiveTabId, getCurrentVideo } from "./lib/messaging";
import { getCredits, getWrapUp } from "./lib/api";
import { supabase, applySessionToken } from "./lib/supabaseClient";
import { LoginScreen } from "./components/LoginScreen";
import { AnalyzeButton } from "./components/AnalyzeButton";
import { SummaryView } from "./components/SummaryView";
import { ChatThread } from "./components/ChatThread";
import { WrapUpView } from "./components/WrapUpView";

export default function App() {
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const currentVideo = useAppStore((s) => s.currentVideo);
  const setCurrentVideo = useAppStore((s) => s.setCurrentVideo);
  const video = useAppStore((s) => s.video);
  const creditBalance = useAppStore((s) => s.creditBalance);
  const setCredits = useAppStore((s) => s.setCredits);
  const setQuestions = useAppStore((s) => s.setQuestions);

  // Bootstrap: pull whatever session the background worker already has.
  useEffect(() => {
    getSession().then(({ session }) => setSession(session));
  }, [setSession]);

  // Track which video the active tab is on, and keep it current as the
  // user switches tabs or navigates within YouTube's SPA.
  useEffect(() => {
    async function refreshCurrentVideo() {
      const tabId = await getActiveTabId();
      if (tabId == null) return;
      const { video } = await getCurrentVideo(tabId);
      setCurrentVideo(video);
    }

    refreshCurrentVideo();

    const onActivated = () => refreshCurrentVideo();
    const onUpdated = (_tabId: number, info: chrome.tabs.OnUpdatedInfo) => {
      if (info.status === "complete") refreshCurrentVideo();
    };

    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [setCurrentVideo]);

  // Once signed in: fetch the credit balance, and subscribe to Realtime so
  // the blurred-teaser paywall clears itself the instant a Stripe purchase
  // lands, without the user needing to refresh anything.
  useEffect(() => {
    if (!session) return;

    applySessionToken(session.access_token);
    getCredits(session.access_token).then((c) => setCredits(c.creditBalance, c.hasUnresolvedTeaser));

    const channel = supabase
      .channel(`user-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${session.user.id}` },
        async () => {
          const c = await getCredits(session.access_token);
          setCredits(c.creditBalance, c.hasUnresolvedTeaser);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions", filter: `user_id=eq.${session.user.id}` },
        async () => {
          if (!video) return;
          const wrapUp = await getWrapUp(session.access_token, video.id);
          setQuestions(wrapUp.questions);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
        <span className="text-sm font-semibold">VidSage</span>
        <span className="text-xs text-slate-500">{creditBalance} credits</span>
      </header>

      {!currentVideo || !video ? (
        <AnalyzeButton />
      ) : (
        <>
          <SummaryView video={video} />
          <ChatThread />
          <WrapUpView />
        </>
      )}
    </div>
  );
}
