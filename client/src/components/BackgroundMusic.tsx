import { useEffect, useRef } from "react";
import { gameplayMusicSrc, introMusicSrc } from "../assets/manifest";
import type { GamePhase } from "../store/gameStore";

function trackForPhase(phase: GamePhase): "gameplay" | "intro" | null {
  if (phase === "intro") return "intro";
  if (
    phase === "title" ||
    phase === "loading" ||
    phase === "dialogue" ||
    phase === "minigame" ||
    phase === "ending" ||
    phase === "error"
  ) {
    return "gameplay";
  }
  return null;
}

/**
 * Loops Kawai Kitsune on title/gameplay and Cyborg Ninja during the intro.
 * Resumes after the first click/key if the browser blocks autoplay.
 */
export function BackgroundMusic({ phase }: { phase: GamePhase }) {
  const gameplayRef = useRef<HTMLAudioElement | null>(null);
  const introRef = useRef<HTMLAudioElement | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const gameplay = new Audio(gameplayMusicSrc());
    gameplay.loop = true;
    gameplay.preload = "auto";
    gameplay.volume = 0.55;

    const intro = new Audio(introMusicSrc());
    intro.loop = true;
    intro.preload = "auto";
    intro.volume = 0.55;

    gameplayRef.current = gameplay;
    introRef.current = intro;

    const apply = async () => {
      const wanted = trackForPhase(phaseRef.current);
      try {
        if (wanted === "intro") {
          if (!gameplay.paused) {
            gameplay.pause();
            gameplay.currentTime = 0;
          }
          if (intro.paused) await intro.play();
        } else if (wanted === "gameplay") {
          if (!intro.paused) {
            intro.pause();
            intro.currentTime = 0;
          }
          if (gameplay.paused) await gameplay.play();
        } else {
          gameplay.pause();
          intro.pause();
        }
      } catch {
        // Wait for a user gesture.
      }
    };

    const unlock = () => {
      void apply();
    };

    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    void apply();

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      gameplay.pause();
      intro.pause();
      gameplayRef.current = null;
      introRef.current = null;
    };
  }, []);

  useEffect(() => {
    const gameplay = gameplayRef.current;
    const intro = introRef.current;
    if (!gameplay || !intro) return;

    const wanted = trackForPhase(phase);
    void (async () => {
      try {
        if (wanted === "intro") {
          if (!gameplay.paused) {
            gameplay.pause();
            gameplay.currentTime = 0;
          }
          if (intro.paused) await intro.play();
        } else if (wanted === "gameplay") {
          if (!intro.paused) {
            intro.pause();
            intro.currentTime = 0;
          }
          if (gameplay.paused) await gameplay.play();
        }
      } catch {
        // Gesture unlock listeners will retry.
      }
    })();
  }, [phase]);

  return null;
}
