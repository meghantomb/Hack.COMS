import { useEffect } from "react";
import { useGameStore } from "./store/gameStore";
import { Background } from "./components/Background";
import { CharacterStage } from "./components/CharacterStage";
import { DialogueBox } from "./components/DialogueBox";
import { ChoiceMenu } from "./components/ChoiceMenu";
import { StageChrome } from "./components/LoveMeters";
import { EndingScreen } from "./components/EndingScreen";
import { MinigameOverlay } from "./minigames/MinigameOverlay";
import { ducksOnStage } from "./stage/ducksOnStage";
import { layoutStage } from "./stage/layoutStage";

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const bundle = useGameStore((s) => s.bundle);
  const error = useGameStore((s) => s.error);
  const load = useGameStore((s) => s.load);
  const restart = useGameStore((s) => s.restart);

  useEffect(() => {
    void load();
  }, [load]);

  if (phase === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-pond-ink font-display text-pond-foam">
        Loading pond…
      </div>
    );
  }

  if (phase === "error" || !bundle) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-pond-ink px-6 text-center">
        <p className="font-display text-2xl text-pond-foam">Could not reach the pond</p>
        <p className="max-w-md text-pond-light">{error ?? "Unknown error"}</p>
        <p className="text-sm text-pond-foam/50">
          Start the API with <code className="text-pond-sunset">npm run dev:server</code>
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full bg-pond-sunset px-6 py-2 font-display text-pond-ink"
        >
          Retry
        </button>
      </div>
    );
  }

  const showDucks = !bundle.node.isEnding || Boolean(bundle.node.endingType);
  const layout = layoutStage(ducksOnStage(bundle, showDucks));

  return (
    <div className="relative flex h-full min-h-[100dvh] flex-col overflow-hidden">
      <Background backgroundKey={bundle.node.backgroundKey} />

      <StageChrome
        layout={layout}
        meters={bundle.loveMeters}
        onRestart={() => void restart()}
      />

      {(phase === "dialogue" || phase === "ending") && (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <CharacterStage layout={layout} showDucks={showDucks} />
        </div>
      )}

      {phase === "dialogue" && (
        <div className="relative z-20 mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 pb-4 sm:px-8 sm:pb-6">
          <DialogueBox speaker={bundle.node.speaker} text={bundle.node.text} />
          <ChoiceMenu options={bundle.options} />
        </div>
      )}

      {phase === "ending" && <EndingScreen />}
      {phase === "minigame" && <MinigameOverlay />}

      {error && phase === "dialogue" && (
        <p className="absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded bg-red-900/80 px-3 py-1 text-sm text-white">
          {error}
        </p>
      )}
    </div>
  );
}
