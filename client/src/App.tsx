import { useEffect } from "react";
import { useGameStore } from "./store/gameStore";
import { Background } from "./components/Background";
import { CharacterStage } from "./components/CharacterStage";
import { DialogueBox } from "./components/DialogueBox";
import { ChoiceMenu } from "./components/ChoiceMenu";
import { StageChrome } from "./components/LoveMeters";
import { EndingScreen, StatusScreen } from "./components/EndingScreen";
import { MinigameOverlay } from "./minigames/MinigameOverlay";
import { TitleScreen } from "./components/TitleScreen";
import { IntroVideo } from "./components/IntroVideo";
import { BackgroundMusic } from "./components/BackgroundMusic";
import { ducksOnStage } from "./stage/ducksOnStage";
import { layoutStage } from "./stage/layoutStage";

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const bundle = useGameStore((s) => s.bundle);
  const error = useGameStore((s) => s.error);
  const canContinue = useGameStore((s) => s.canContinue);
  const titleBusy = useGameStore((s) => s.titleBusy);
  const prepareTitle = useGameStore((s) => s.prepareTitle);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const finishIntro = useGameStore((s) => s.finishIntro);
  const load = useGameStore((s) => s.load);
  const goToTitle = useGameStore((s) => s.goToTitle);
  const saveAndQuitToTitle = useGameStore((s) => s.saveAndQuitToTitle);

  useEffect(() => {
    void prepareTitle();
  }, [prepareTitle]);

  const music = <BackgroundMusic phase={phase} />;

  if (phase === "title") {
    return (
      <>
        {music}
        <TitleScreen
          canContinue={canContinue}
          busy={titleBusy}
          onNewGame={() => void startNewGame()}
          onContinue={() => void continueGame()}
        />
      </>
    );
  }

  if (phase === "intro") {
    return (
      <>
        {music}
        <IntroVideo onFinished={() => void finishIntro()} />
      </>
    );
  }

  if (phase === "loading") {
    return (
      <>
        {music}
        <StatusScreen title="Loading pond…" />
      </>
    );
  }

  if (phase === "error" || !bundle) {
    return (
      <>
        {music}
        <StatusScreen
          title="Could not reach the pond"
          body={error ?? "Unknown error"}
          actions={
            <>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-full bg-ui-cream px-8 py-3 font-display text-lg text-ui-brown transition-[filter] duration-200 hover:brightness-110"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => void goToTitle()}
                className="rounded-full bg-ui-cream px-8 py-3 font-display text-lg text-ui-brown transition-[filter] duration-200 hover:brightness-110"
              >
                Title
              </button>
            </>
          }
        />
      </>
    );
  }

  const showDucks = !bundle.node.isEnding || Boolean(bundle.node.endingType);
  const layout = layoutStage(ducksOnStage(bundle, showDucks));

  return (
    <>
      {music}
      <div className="relative h-full min-h-[100dvh] overflow-hidden">
        <Background backgroundKey={bundle.node.backgroundKey} />

        {/* Characters stay fixed behind UI; kept low in the frame. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[26%] z-10 pb-36 sm:top-[28%] sm:pb-44 lg:top-[24%] lg:pb-52 xl:pb-60">
          <CharacterStage layout={layout} showDucks={showDucks} />
        </div>

        <StageChrome
          layout={layout}
          meters={bundle.loveMeters}
          onSaveAndQuit={() => void saveAndQuitToTitle()}
        />

        {phase === "dialogue" && (
          <div className="absolute inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 pb-5 pr-20 sm:gap-4 sm:px-8 sm:pb-7 sm:pr-28 lg:max-w-6xl lg:gap-5 lg:px-10 lg:pb-9 lg:pr-32 xl:max-w-7xl xl:gap-6 xl:px-12 xl:pb-11 xl:pr-36">
            <DialogueBox
              key={bundle.node.id}
              speaker={bundle.node.speaker}
              text={bundle.node.text}
            />
            <ChoiceMenu key={`${bundle.node.id}-choices`} options={bundle.options} />
          </div>
        )}

        {phase === "ending" && <EndingScreen />}
        {phase === "minigame" && <MinigameOverlay />}

        {error && phase === "dialogue" && (
          <p className="absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-xl bg-ui-brown/90 px-3 py-1 font-display text-sm text-ui-cream">
            {error}
          </p>
        )}
      </div>
    </>
  );
}
