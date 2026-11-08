import { useEffect, useState } from "react";
import {
  resolvePlayableMinigame,
  type PlayableMinigameId,
} from "@duck-dating/shared";
import { useGameStore } from "../store/gameStore";
import { fetchProgress } from "../api/client";
import { getMinigameComponent } from "./registry";

export function MinigameOverlay() {
  const completeMinigame = useGameStore((s) => s.completeMinigame);
  const bundle = useGameStore((s) => s.bundle);
  const playerId = useGameStore((s) => s.playerId);
  const localFlags = useGameStore((s) => s.flags);

  const [gameId, setGameId] = useState<PlayableMinigameId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const characterId =
          bundle?.node.characterId ?? bundle?.character.id ?? "breadluvr";
        let flags = localFlags;
        try {
          const progress = await fetchProgress(playerId);
          flags = { ...localFlags, ...(progress.flags ?? {}) };
          if (!cancelled && progress.flags) {
            useGameStore.setState({
              flags: { ...useGameStore.getState().flags, ...progress.flags },
            });
          }
        } catch {
          // Keep mirrored local flags — enough to unlock the random pool after a signature win.
        }
        const id = resolvePlayableMinigame(characterId, flags);
        if (!cancelled) setGameId(id);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not start minigame");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // localFlags intentionally read once on mount for this launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle?.node.characterId, bundle?.character.id, playerId]);

  if (error) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ui-brown/85 px-4">
        <p className="font-display text-ui-cream">{error}</p>
        <p className="mt-2 font-story text-sm text-ui-cream/70">Finish or fail to return.</p>
      </div>
    );
  }

  if (!gameId) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-ui-brown/85 font-display text-ui-cream">
        Shuffling pond games…
      </div>
    );
  }

  const Game = getMinigameComponent(gameId);
  if (!Game) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ui-brown/85">
        <p className="font-display text-ui-cream">Missing game: {gameId}</p>
      </div>
    );
  }

  return <Game onComplete={(won) => void completeMinigame(won, gameId)} />;
}
