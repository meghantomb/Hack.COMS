import { useEffect, useRef } from "react";
import {
  gameplayMusicSrc,
  introMusicSrc,
  minigameMusicSrc,
} from "../assets/manifest";
import type { GamePhase } from "../store/gameStore";

type Track = "gameplay" | "intro" | "minigame";

function trackForPhase(phase: GamePhase): Track | null {
  if (phase === "intro") return "intro";
  if (phase === "minigame") return "minigame";
  if (
    phase === "title" ||
    phase === "loading" ||
    phase === "dialogue" ||
    phase === "ending" ||
    phase === "error"
  ) {
    return "gameplay";
  }
  return null;
}

function pauseReset(audio: HTMLAudioElement) {
  if (!audio.paused) audio.pause();
  audio.currentTime = 0;
}

/**
 * Kawai Kitsune on title/gameplay, Cyborg Ninja on intro,
 * Voxel Revolution during minigames.
 * Resumes after the first click/key if the browser blocks autoplay.
 */
export function BackgroundMusic({ phase }: { phase: GamePhase }) {
  const gameplayRef = useRef<HTMLAudioElement | null>(null);
  const introRef = useRef<HTMLAudioElement | null>(null);
  const minigameRef = useRef<HTMLAudioElement | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const make = (src: string) => {
      const a = new Audio(src);
      a.loop = true;
      a.preload = "auto";
      a.volume = 0.55;
      return a;
    };

    const gameplay = make(gameplayMusicSrc());
    const intro = make(introMusicSrc());
    const minigame = make(minigameMusicSrc());

    gameplayRef.current = gameplay;
    introRef.current = intro;
    minigameRef.current = minigame;

    const apply = async () => {
      const wanted = trackForPhase(phaseRef.current);
      try {
        if (wanted === "intro") {
          pauseReset(gameplay);
          pauseReset(minigame);
          if (intro.paused) await intro.play();
        } else if (wanted === "minigame") {
          pauseReset(gameplay);
          pauseReset(intro);
          if (minigame.paused) await minigame.play();
        } else if (wanted === "gameplay") {
          pauseReset(intro);
          pauseReset(minigame);
          if (gameplay.paused) await gameplay.play();
        } else {
          gameplay.pause();
          intro.pause();
          minigame.pause();
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
      minigame.pause();
      gameplayRef.current = null;
      introRef.current = null;
      minigameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const gameplay = gameplayRef.current;
    const intro = introRef.current;
    const minigame = minigameRef.current;
    if (!gameplay || !intro || !minigame) return;

    const wanted = trackForPhase(phase);
    void (async () => {
      try {
        if (wanted === "intro") {
          pauseReset(gameplay);
          pauseReset(minigame);
          if (intro.paused) await intro.play();
        } else if (wanted === "minigame") {
          pauseReset(gameplay);
          pauseReset(intro);
          if (minigame.paused) await minigame.play();
        } else if (wanted === "gameplay") {
          pauseReset(intro);
          pauseReset(minigame);
          if (gameplay.paused) await gameplay.play();
        }
      } catch {
        // Gesture unlock listeners will retry.
      }
    })();
  }, [phase]);

  return null;
}
