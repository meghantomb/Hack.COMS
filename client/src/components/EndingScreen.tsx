import type { ReactNode } from "react";
import { useGameStore } from "../store/gameStore";
import { Background } from "./Background";

export function EndingScreen() {
  const bundle = useGameStore((s) => s.bundle);
  const restart = useGameStore((s) => s.restart);
  const saveAndQuitToTitle = useGameStore((s) => s.saveAndQuitToTitle);
  if (!bundle) return null;

  const good = bundle.node.endingType === "good";

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6 text-center">
      <div className="absolute inset-0 bg-ui-brown/70" />
      <div className="relative z-10 flex max-w-lg flex-col items-center rounded-2xl bg-ui-brown/80 px-8 py-8 text-white">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-ui-cream">
          {good ? "Good Ending" : "Bad Ending"}
        </p>
        <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
          {good ? "Eaten, With Love" : "Just Dinner"}
        </h2>
        <p className="mt-4 font-story text-lg text-white/90">{bundle.node.text}</p>
        <p className="mt-2 font-display text-sm text-ui-cream">
          Final friendship: {bundle.friendliness}/100
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={() => void restart()}
            className="rounded-full bg-ui-cream px-8 py-3 font-display text-lg text-ui-brown transition-[filter] duration-200 hover:brightness-110"
          >
            Play again
          </button>
          <button
            type="button"
            onClick={() => void saveAndQuitToTitle()}
            className="rounded-full bg-ui-cream px-8 py-3 font-display text-lg text-ui-brown transition-[filter] duration-200 hover:brightness-110"
          >
            Save &amp; Title
          </button>
        </div>
      </div>
    </div>
  );
}

/** Shared full-screen status panel (loading / error). */
export function StatusScreen({
  title,
  body,
  actions,
}: {
  title: string;
  body?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="relative flex h-full min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <Background />
      <div className="absolute inset-0 bg-ui-brown/55" />
      <div className="relative z-10 flex max-w-md flex-col items-center rounded-2xl bg-ui-brown/80 px-8 py-8 text-white">
        <h1 className="font-display text-2xl text-ui-cream sm:text-3xl">{title}</h1>
        {body ? <p className="mt-3 font-story text-white/90">{body}</p> : null}
        {actions ? <div className="mt-8 flex w-full max-w-xs flex-col gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
