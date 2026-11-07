import { useEffect, useRef } from "react";
import type Phaser from "phaser";
import { useGameStore } from "../store/gameStore";
import { createLilyPadHopGame } from "./LilyPadHop";

export function MinigameOverlay() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const completeMinigame = useGameStore((s) => s.completeMinigame);
  const cancelMinigame = useGameStore((s) => s.cancelMinigame);
  const pending = useGameStore((s) => s.pendingOption);

  useEffect(() => {
    if (!hostRef.current) return;
    const game = createLilyPadHopGame(hostRef.current, (result) => {
      void completeMinigame(result === "win");
    });
    gameRef.current = game;
    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [completeMinigame]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-pond-ink/90 px-4">
      <p className="mb-3 font-display text-xl text-pond-foam">
        {pending?.text ?? "Lily Pad Hop"}
      </p>
      <div
        ref={hostRef}
        className="w-full max-w-[640px] overflow-hidden rounded-xl border border-pond-light/30 shadow-2xl"
      />
      <button
        type="button"
        onClick={cancelMinigame}
        className="mt-4 text-sm text-pond-light underline hover:text-pond-foam"
      >
        Back to choices
      </button>
    </div>
  );
}
