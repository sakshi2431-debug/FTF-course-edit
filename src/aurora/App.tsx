import { useEffect, useRef } from "react";
import { Announcer, Dialogs, Toast } from "./components/Feedback";
import { ReviewDialog } from "./components/Review";
import { Navigation, PageHeader } from "./components/Shell";
import { persistIfNeeded, saveTick, setConnection } from "./mock/engine";
import { initScenarioFromUrl } from "./scenarios/load";
import { PlanScreen } from "./screens/PlanScreen";
import { PublishScreen } from "./screens/PublishScreen";
import { ValidateScreen } from "./screens/ValidateScreen";
import { store, useAppState } from "./state/store";
import { ScenarioSwitcher } from "./switcher/ScenarioSwitcher";

const SAVE_DELAY_MS = 600;

function useBackgroundEffects() {
  const state = useAppState();
  const channelId = useRef(Math.random().toString(36).slice(2));

  useEffect(() => {
    if (state.save.status !== "saving") return;
    const timer = setTimeout(saveTick, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state.save.status, state.course]);

  useEffect(() => {
    const online = () => setConnection("online");
    const offline = () => setConnection("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  /* Warn before leaving only when work really could be lost. */
  const atRisk = state.save.status === "failed" || state.save.status === "unsaved";
  useEffect(() => {
    if (!atRisk) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [atRisk]);

  useEffect(() => store.subscribe(persistIfNeeded), []);

  /* PERM-03: really detects the same course open in another tab. */
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("aurora-course");
    channel.onmessage = (event: MessageEvent<{ type: string; from: string }>) => {
      if (event.data.from === channelId.current) return;
      store.set((s) => ({ ...s, collab: { ...s.collab, otherTab: true } }));
      if (event.data.type === "hello") {
        channel.postMessage({ type: "here", from: channelId.current });
      }
    };
    channel.postMessage({ type: "hello", from: channelId.current });
    return () => channel.close();
  }, []);
}

function Screens() {
  useBackgroundEffects();
  const { step } = useAppState().ui;
  return (
    <div className="app au-app">
      <Navigation />
      <div className="page">
        <PageHeader />
        {step === "plan" && <PlanScreen />}
        {step === "validate" && <ValidateScreen />}
        {step === "publish" && <PublishScreen />}
      </div>
      <ReviewDialog />
      <Dialogs />
      <Toast />
      <Announcer />
      <ScenarioSwitcher />
    </div>
  );
}

initScenarioFromUrl();

export default function AuroraApp() {
  return <Screens />;
}
