import type { Minigame } from "./types";
import { DUCK_CHARACTER_IDS } from "./types";

/** Signature minigame for each dateable duck. */
export const SIGNATURE_BY_CHARACTER = {
  artist: "pixel_paint",
  jock: "slide_puzzle",
  breadluvr: "bread_snake",
  badboy: "bullet_hell",
} as const;

export type SignatureMinigameId =
  (typeof SIGNATURE_BY_CHARACTER)[keyof typeof SIGNATURE_BY_CHARACTER];

/** Unlocked after that duck's signature is cleared on this save. */
export const RANDOM_MINIGAME_IDS = [
  "rhythm_lanes",
  "frogger_duck",
  "flappy_duck",
  "simon_ducks",
] as const;

export type RandomMinigameId = (typeof RANDOM_MINIGAME_IDS)[number];
export type PlayableMinigameId = SignatureMinigameId | RandomMinigameId;

export const MINIGAME_META: Record<
  PlayableMinigameId,
  { name: string; description: string }
> = {
  pixel_paint: {
    name: "Pond Pixel",
    description: "Memorize Jeremy's painting, then recreate the 3×3 grid.",
  },
  slide_puzzle: {
    name: "Jock Slide",
    description: "Slide the cars and get the duck-mobile out of the garage.",
  },
  bread_snake: {
    name: "Bread Snake",
    description: "Nibble bread crumbs — don't hit the walls or yourself.",
  },
  bullet_hell: {
    name: "Badboy Barrage",
    description: "Dodge the easy bullet patterns and survive the wave.",
  },
  rhythm_lanes: {
    name: "Pond Beat",
    description: "Hit D F J K as notes fall — catch enough to clear.",
  },
  frogger_duck: {
    name: "Duckling Dash",
    description: "Guide the duckling across traffic before time is up.",
  },
  flappy_duck: {
    name: "Reed Flyer",
    description: "Flap through the reed gaps without crashing.",
  },
  simon_ducks: {
    name: "Simon Quacks",
    description: "Repeat the flashing duck sequence with the keys.",
  },
};

export function signatureClearedFlag(characterId: string) {
  return `signature:${characterId}`;
}

export function minigameClearedFlag(minigameId: string) {
  return `minigame:${minigameId}`;
}

export function isDuckCharacterId(
  id: string
): id is (typeof DUCK_CHARACTER_IDS)[number] {
  return (DUCK_CHARACTER_IDS as readonly string[]).includes(id);
}

export function signatureMinigameFor(characterId: string): SignatureMinigameId | null {
  if (!isDuckCharacterId(characterId)) return null;
  return SIGNATURE_BY_CHARACTER[characterId];
}

/** Pick signature until cleared on this save, then a random pool game. */
export function resolvePlayableMinigame(
  characterId: string,
  flags: Record<string, boolean> | null | undefined,
  rng: () => number = Math.random
): PlayableMinigameId {
  const sig = signatureMinigameFor(characterId);
  if (sig && !flags?.[signatureClearedFlag(characterId)]) return sig;
  const i = Math.floor(rng() * RANDOM_MINIGAME_IDS.length);
  return RANDOM_MINIGAME_IDS[i] ?? "rhythm_lanes";
}

export function allMinigameRecords(): Minigame[] {
  return (Object.keys(MINIGAME_META) as PlayableMinigameId[]).map((id) => ({
    id,
    name: MINIGAME_META[id].name,
    description: MINIGAME_META[id].description,
  }));
}

export function recordMinigameWinFlags(
  flags: Record<string, boolean>,
  input: { playedMinigameId: string; characterId: string }
): Record<string, boolean> {
  const next = { ...flags };
  next[minigameClearedFlag(input.playedMinigameId)] = true;
  const sig = signatureMinigameFor(input.characterId);
  if (sig && input.playedMinigameId === sig) {
    next[signatureClearedFlag(input.characterId)] = true;
  }
  // Keep legacy "any minigame cleared" checks working.
  next[`minigame:${input.playedMinigameId}`] = true;
  return next;
}
