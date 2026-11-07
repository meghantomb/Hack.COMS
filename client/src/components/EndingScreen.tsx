import { useGameStore } from "../store/gameStore";

export function EndingScreen() {
  const bundle = useGameStore((s) => s.bundle);
  const restart = useGameStore((s) => s.restart);
  if (!bundle) return null;

  const romance = bundle.node.endingType === "romance";

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-pond-ink/80 px-6 text-center backdrop-blur-sm">
      <p className="font-display text-sm uppercase tracking-[0.3em] text-pond-sunset">
        {romance ? "Romance Ending" : "Friendship Ending"}
      </p>
      <h2 className="mt-3 max-w-lg font-display text-3xl text-pond-foam sm:text-4xl">
        {romance ? "Hearts on the Water" : "Pondside Friends"}
      </h2>
      <p className="mt-4 max-w-md font-story text-lg text-pond-foam/85">
        {bundle.node.text}
      </p>
      <p className="mt-2 text-sm text-pond-light">
        Final friendliness: {bundle.friendliness}/100
      </p>
      <button
        type="button"
        onClick={() => void restart()}
        className="mt-8 rounded-full bg-pond-sunset px-8 py-3 font-display text-pond-ink transition hover:brightness-110"
      >
        Play again
      </button>
    </div>
  );
}
