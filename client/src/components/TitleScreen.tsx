import { Background } from "./Background";

export function TitleScreen({
  canContinue,
  busy,
  onNewGame,
  onContinue,
}: {
  canContinue: boolean;
  busy: boolean;
  onNewGame: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="relative flex h-full min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6">
      <Background />
      <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
        <p className="font-display text-sm uppercase tracking-[0.35em] text-pond-sunset">
          A duck dating sim
        </p>
        <h1 className="mt-3 font-display text-5xl text-pond-foam drop-shadow sm:text-6xl">
          Pond Hearts
        </h1>
        <p className="mt-4 font-story text-pond-foam/80">
          Four ducks. One pond. Fill those love bars.
        </p>
        <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onNewGame}
            className="rounded-full bg-pond-sunset px-8 py-3 font-display text-lg text-pond-ink transition hover:brightness-110 disabled:opacity-50"
          >
            New Game
          </button>
          {canContinue && (
            <button
              type="button"
              disabled={busy}
              onClick={onContinue}
              className="rounded-full border border-pond-light/50 bg-pond-ink/70 px-8 py-3 font-display text-lg text-pond-foam backdrop-blur-sm transition hover:border-pond-sunset disabled:opacity-50"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
