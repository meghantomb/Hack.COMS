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
 * Background:
 *   backgrounds/pond.png
 *   backgrounds/pond_sunset.png
 *
 * Intro (new game only):
 *   public/intro/bread_intro_video.mp4  →  /intro/bread_intro_video.mp4
 *
 * Title screen:
 *   assets/intro/title_background.png
 *   assets/intro/title.png  (logo layered on top)
 *
 * Music:
 *   assets/music/Kawai Kitsune.mp3     — title + gameplay
 *   assets/music/Cyborg Ninja.mp3      — intro video
 *   assets/music/Voxel Revolution.mp3  — minigames
 *
 * Staging: MC left / duck right — duck uses *_left, player faces toward the duck.
 */

export const DUCK_IDS = ["jock", "breadluvr", "badboy", "artist"] as const;
export type DuckId = (typeof DUCK_IDS)[number];

export type Facing = "left" | "right";

const asset = (path: string) => `/assets/${path}`;

/** Dialogue `backgroundKey` → file under `public/assets/`. Unknown keys stay on the day pond. */
const BACKGROUNDS: Record<string, string> = {
  pond: "backgrounds/pond.png",
  pond_sunset: "backgrounds/pond_sunset.png",
};

/** Scene background. `pond_sunset` is the only key that leaves the day pond. */
export function backgroundSrc(backgroundKey?: string): string {
  const file =
    (backgroundKey && BACKGROUNDS[backgroundKey]) || "backgrounds/pond.png";
  return asset(file);
}

/** New-game intro cutscene (lives in public/intro/, not public/assets/). */
export function introVideoSrc(): string {
  return "/intro/bread_intro_video.mp4";
}

/** Title screen full-bleed background. */
export function titleBackgroundSrc(): string {
  return asset("intro/title_background.png");
}

/** Title / logo PNG layered over the title background. */
export function titleLogoSrc(): string {
  return asset("intro/title.png");
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

/** Title screen + main gameplay loop. */
export function gameplayMusicSrc(): string {
  return asset(`music/${encodeURIComponent("Kawai Kitsune.mp3")}`);
}

/** Intro cutscene loop. */
export function introMusicSrc(): string {
  return asset(`music/${encodeURIComponent("Cyborg Ninja.mp3")}`);
}

/** Minigame loop. */
export function minigameMusicSrc(): string {
  return asset(`music/${encodeURIComponent("Voxel Revolution.mp3")}`);
}

