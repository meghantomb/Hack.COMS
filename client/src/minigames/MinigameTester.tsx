import { useEffect, useMemo, useState } from "react";
import type { PlayableMinigameId } from "@duck-dating/shared";
import { MINIGAME_META } from "@duck-dating/shared";
import { minigameMusicSrc } from "../assets/manifest";
import { getMinigameComponent } from "./registry";
import { MG } from "./style";

const QUEUE = Object.keys(MINIGAME_META) as PlayableMinigameId[];

export function MinigameTester() {
  useEffect(() => {
    const audio = new Audio(minigameMusicSrc());
    audio.loop = true;
    audio.volume = 0.55;
    const unlock = () => {
      void audio.play().catch(() => undefined);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    void audio.play().catch(() => undefined);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      audio.pause();
    };
  }, []);

  const [index, setIndex] = useState(0);
  const [last, setLast] = useState<"win" | "lose" | "skip" | null>(null);
  const [finished, setFinished] = useState(false);

  const id = QUEUE[index]!;
  const Game = useMemo(() => getMinigameComponent(id), [id]);
  const meta = MINIGAME_META[id];

  const advance = (result: "win" | "lose" | "skip") => {
    setLast(result);
    if (index >= QUEUE.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  if (finished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ui-brown px-4">
        <p className="font-display text-2xl text-ui-cream">All {QUEUE.length} minigames done</p>
        <p className="font-story text-ui-cream/80">Last result: {last ?? "—"}</p>
        <button
          type="button"
          className="rounded-xl border-[3px] px-6 py-2 font-display"
          style={{ background: MG.cream, borderColor: MG.ink, color: MG.ink }}
          onClick={() => {
            setIndex(0);
            setLast(null);
            setFinished(false);
          }}
        >
          Play again
        </button>
        <a href="/" className="font-display text-sm text-ui-cream underline">
          Back to title
        </a>
      </div>
    );
  }

  if (!Game) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ui-brown font-display text-ui-cream">
        Missing {id}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div
        className="absolute left-3 top-3 z-[60] rounded-lg border-[3px] px-3 py-1.5 font-display text-sm"
        style={{ background: MG.cream, borderColor: MG.ink, color: MG.ink }}
      >
        {index + 1}/{QUEUE.length} · {meta.name}
        {last ? ` · last: ${last}` : ""}
      </div>
      <button
        type="button"
        className="absolute right-3 top-3 z-[60] rounded-lg border-[3px] px-3 py-1.5 font-display text-sm"
        style={{ background: MG.pink, borderColor: MG.ink, color: MG.ink }}
        onClick={() => advance("skip")}
      >
        Skip →
      </button>
      <Game
        key={id}
        onComplete={(won) => advance(won ? "win" : "lose")}
        onCancel={() => advance("skip")}
      />
    </div>
  );
}
