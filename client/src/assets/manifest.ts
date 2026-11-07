/**
 * PNG asset slots — drop files under `client/public/assets/`.
 *
 * Ducks (left/right facing only):
 *   ducks/jock_left.png      ducks/jock_right.png
 *   ducks/breadluvr_left.png ducks/breadluvr_right.png
 *   ducks/badboy_left.png    ducks/badboy_right.png
 *   ducks/artist_left.png    ducks/artist_right.png
 *
 * Player (MC):
 *   player/player_left.png   player/player_right.png
 *
 * Backgrounds:
 *   backgrounds/pond.png | island.png | pond_sunset.png
 *
 * Staging: MC on the left uses *_right (faces center); duck on the right uses *_left.
 */

export const DUCK_IDS = ["jock", "breadluvr", "badboy", "artist"] as const;
export type DuckId = (typeof DUCK_IDS)[number];

export type Facing = "left" | "right";

export const BACKGROUND_KEYS = ["pond", "island", "pond_sunset"] as const;

const asset = (path: string) => `/assets/${path}`;

export function backgroundSrc(key: string): string {
  return asset(`backgrounds/${key}.png`);
}

/** Player on the left side of the screen → usually `right` (faces the duck). */
export function playerSrc(facing: Facing = "right"): string {
  return asset(`player/bread.png`);
}

/** Duck sprite — `spriteKey` is jock | breadluvr | badboy | artist. */
export function duckSrc(spriteKey: string, facing: Facing): string {
  return asset(`ducks/${spriteKey}_${facing}.png`);
}

/** Love-meter portrait (right-facing crop works fine). */
export function duckPortraitSrc(spriteKey: string): string {
  return duckSrc(spriteKey, "right");
}
