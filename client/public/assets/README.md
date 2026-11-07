# Art slots (drop PNGs here)

Vite serves this folder at `/assets/...`. Filenames must match exactly.

## Backgrounds → `backgrounds/`

| File | Used when |
|------|-----------|
| `pond.png` | Opening pond scenes |
| `island.png` | After lily-pad hop |
| `pond_sunset.png` | Endings |

Wired in: `client/src/assets/manifest.ts` → `backgroundSrc()` → `Background.tsx`

## Player (you, left side) → `player/`

| File | Notes |
|------|--------|
| `neutral.png` | Default |
| `happy.png` | Optional |
| `embarrassed.png` | Optional |
| `determined.png` | Optional |

Wired in: `playerSrc()` → `CharacterStage.tsx`

## Ducks (right side) → `ducks/{id}/`

Four duck folders:

```
ducks/willow/   ducks/maple/   ducks/coral/   ducks/ash/
```

Per duck, add expression PNGs:

| File | Sample story uses |
|------|-------------------|
| `neutral.png` | Yes |
| `shy.png` | Yes (Willow) |
| `hopeful.png` | Yes (Willow) |
| `happy.png` | Yes |
| `sad.png` | Yes |
| `love.png` | Yes (romance ending) |

Wired in: `duckSrc(spriteKey, expression)` → `CharacterStage.tsx`  
Love-bar portraits: `duckPortraitSrc()` → `LoveMeters.tsx`

Missing PNGs show a labeled placeholder so the game still runs.
