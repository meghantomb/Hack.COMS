import type { ComponentType } from "react";
import type { PlayableMinigameId } from "@duck-dating/shared";
import { MINIGAME_META } from "@duck-dating/shared";
import { PixelPaint } from "./games/PixelPaint";
import { SlidePuzzle } from "./games/SlidePuzzle";
import { BreadSnake } from "./games/BreadSnake";
import { BulletHell } from "./games/BulletHell";
import { RhythmLanes } from "./games/RhythmLanes";
import { FroggerDuck } from "./games/FroggerDuck";
import { FlappyDuck } from "./games/FlappyDuck";
import { SimonDucks } from "./games/SimonDucks";

export type MinigameProps = {
  onComplete: (won: boolean) => void;
  onCancel?: () => void;
};

const REGISTRY: Record<PlayableMinigameId, ComponentType<MinigameProps>> = {
  pixel_paint: PixelPaint,
  slide_puzzle: SlidePuzzle,
  bread_snake: BreadSnake,
  bullet_hell: BulletHell,
  rhythm_lanes: RhythmLanes,
  frogger_duck: FroggerDuck,
  flappy_duck: FlappyDuck,
  simon_ducks: SimonDucks,
};

export function getMinigameComponent(id: string): ComponentType<MinigameProps> | null {
  return (REGISTRY as Record<string, ComponentType<MinigameProps>>)[id] ?? null;
}

export function getMinigameTitle(id: string): string {
  return (MINIGAME_META as Record<string, { name: string }>)[id]?.name ?? "Minigame";
}
