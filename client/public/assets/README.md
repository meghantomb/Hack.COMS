# Art slots (drop PNGs here)

Vite serves this folder at `/assets/...`. Filenames must match exactly.

## Background → `backgrounds/`

- `pond.png` — only background (full-bleed for every scene)

## Intro → `client/public/intro/` (not under `assets/`)

- `bread_intro_video.mp4` — plays after **New Game**, before dialogue (Skip available)
  Served at `/intro/bread_intro_video.mp4`

## Player (you, left side of screen) → `player/`

- `player_right.png` — used on stage (faces the duck)
- `player_left.png` — optional spare facing

## Ducks (right side of screen) → `ducks/`

Each duck has **only** left + right facing (no expression folders):

| Files |
|-------|
| `jock_left.png` / `jock_right.png` |
| `breadluvr_left.png` / `breadluvr_right.png` |
| `badboy_left.png` / `badboy_right.png` |
| `artist_left.png` / `artist_right.png` |

On stage the duck uses `*_left.png` (faces the player). Love-bar portraits use `*_right.png`.

Path wiring: `client/src/assets/manifest.ts`
