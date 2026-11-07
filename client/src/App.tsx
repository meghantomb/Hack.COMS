import { useEffect } from "react";
import { useGameStore } from "./store/gameStore";
import { Background } from "./components/Background";
import { CharacterStage } from "./components/CharacterStage";
import { DialogueBox } from "./components/DialogueBox";
import { ChoiceMenu } from "./components/ChoiceMenu";
import { LoveMeters } from "./components/LoveMeters";
import { EndingScreen } from "./components/EndingScreen";
import { MinigameOverlay } from "./minigames/MinigameOverlay";

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

  return (
    <div className="relative h-full min-h-[100dvh] overflow-hidden">
      <Background backgroundKey={bundle.node.backgroundKey} />

      <header className="absolute right-4 top-4 z-20 text-right">
        <h1 className="font-display text-2xl text-pond-foam drop-shadow sm:text-3xl">
          Pond Hearts
        </h1>
        <button
          type="button"
          onClick={() => void restart()}
          className="mt-1 text-xs text-pond-light/70 underline hover:text-pond-foam"
        >
          Reset save
        </button>
      </header>

      <LoveMeters
        meters={bundle.loveMeters}
        activeCharacterId={bundle.character.id}
      />

      {(phase === "dialogue" || phase === "ending") && (
        <CharacterStage
          duckName={bundle.character.name}
          duckSpriteKey={bundle.character.spriteKey}
          duckExpression={bundle.node.spriteExpression}
          showDuck={!bundle.node.isEnding || Boolean(bundle.node.endingType)}
        />
      )}

      {phase === "dialogue" && (
        <>
          <DialogueBox speaker={bundle.node.speaker} text={bundle.node.text} />
          <ChoiceMenu options={bundle.options} />
        </>
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
