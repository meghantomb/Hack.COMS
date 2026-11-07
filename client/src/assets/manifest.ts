/**
 * PNG asset slots — drop files under `client/public/assets/` using these paths.
 * After replacing a PNG, hard-refresh the browser (no code change needed if the filename matches).
 *
 * Folder layout:
 *   public/assets/backgrounds/{key}.png
 *   public/assets/player/{expression}.png
 *   public/assets/ducks/{duckId}/{expression}.png
 *
 * Duck IDs: willow | maple | coral | ash
 * Expressions used in sample story: neutral, shy, hopeful, happy, sad, love
 * Background keys used in sample story: pond, island, pond_sunset
 */

export const DUCK_IDS = ["willow", "maple", "coral", "ash"] as const;
export type DuckId = (typeof DUCK_IDS)[number];

export const DUCK_EXPRESSIONS = [
  "neutral",
  "shy",
  "hopeful",
  "happy",
  "sad",
  "love",
] as const;

export const PLAYER_EXPRESSIONS = ["neutral", "happy", "embarrassed", "determined"] as const;

export const BACKGROUND_KEYS = ["pond", "island", "pond_sunset"] as const;

const asset = (path: string) => `/assets/${path}`;

/** Background PNG path for a dialogue `backgroundKey`. */
export function backgroundSrc(key: string): string {
  return asset(`backgrounds/${key}.png`);
}

/** Player (MC) sprite on the left side. */
export function playerSrc(expression = "neutral"): string {
  return asset(`player/${expression}.png`);
}

/** Duck sprite on the right side — `spriteKey` is the duck folder name / character id. */
export function duckSrc(spriteKey: string, expression = "neutral"): string {
  return asset(`ducks/${spriteKey}/${expression}.png`);
}

/** Small portrait for love-meter HUD (uses neutral pose). */
export function duckPortraitSrc(spriteKey: string): string {
  return duckSrc(spriteKey, "neutral");
}
