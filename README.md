# What the Duck?

Minimal browser duck dating sim (DDLC-inspired vertical slice). Four ducks (`jock`, `breadluvr`, `badboy`, `artist`) with left/right PNG slots; per-duck signature minigames plus a random pool; love meters; friendship / romance endings.

## Art (PNG slots)

Drop PNGs into `client/public/assets/` — see that folder’s `README.md`. Path wiring lives in `client/src/assets/manifest.ts` (no code edits needed if filenames match).

## Stack

- **client/** — React, TypeScript, Vite, Tailwind, Zustand (canvas minigames)
- **server/** — Node, Express, TypeScript, Drizzle ORM (TigerData / PostgreSQL)
- **shared/** — Shared types and friendliness helpers

## Quick start (no DB / no API keys)

```bash
cp .env.example .env
npm install
npm run build --workspace=shared
npm run dev:server   # memory mode when DATABASE_URL is unset
npm run dev:client   # http://localhost:5173 (proxies /api → :3001)
```

Optional root script: `npm run dev` starts both (backgrounds the server).

## With PostgreSQL (TigerData-compatible)

1. Set `DATABASE_URL` in `.env`.
2. `npm run db:migrate`
3. `npm run db:seed`
4. Restart the server (uses Postgres instead of memory).

## Grok (xAI) batch dialogue

Set `XAI_API_KEY` (optional `XAI_API_BASE`, `XAI_MODEL`). Without a key, `POST /api/generate/dialogue` uses a mock generator.

AI is **batch-only** (admin-style endpoint). Gameplay never calls Grok.

Example:

```bash
curl -s http://localhost:3001/api/generate/dialogue \
  -H 'Content-Type: application/json' \
  -d '{"characterId":"breadluvr","sceneContext":"Morning at the pond","tier":"friend","count":3}'
```

Pass `"persist":true,"nodeId":"small_talk"` to insert validated options as flavor variations (same next-node as existing branches).

Duck art filenames: `jock_left.png` / `jock_right.png` (same pattern for `breadluvr`, `badboy`, `artist`) in `client/public/assets/ducks/`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:client` / `dev:server` | Local Vite / API |
| `npm run build` / `build:vercel` | Build shared → server → client |
| `npm run typecheck` | TypeScript across workspaces |
| `npm run db:migrate` / `db:seed` | Schema + sample story (needs `DATABASE_URL`) |

Secrets stay server-side. The client only uses `VITE_API_URL` (optional; leave unset for Vite proxy locally and for same-origin production).

## Deploy on Vercel (single project)

One Vercel project serves the Vite static build and routes `/api/*` to Express (`api/index.js` → `server/dist/app.js`). Same origin — no CORS or `VITE_API_URL` needed in production.

### 1. Push this repo to GitHub

### 2. Import the repo on Vercel

- [vercel.com/new](https://vercel.com/new) → import `Hack.COMS`
- **Root Directory:** repository root (`.`), not `client/`
- Leave Framework / Build / Output alone if `vercel.json` is detected; it already sets:
  - Install: `npm install`
  - Build: `npm run build:vercel`
  - Output: `client/dist`

### 3. Environment variables (Project → Settings → Environment Variables)

| Name | Required | Notes |
|------|----------|--------|
| `DATABASE_URL` | Strongly recommended | Without it, progress uses memory and resets on cold starts |
| `XAI_API_KEY` | Optional | Only for `POST /api/generate/dialogue`; gameplay works without it |
| `XAI_API_BASE` / `XAI_MODEL` | Optional | Defaults match `.env.example` |
| `VITE_API_URL` | **Leave unset** | Same-origin `/api` on the deployed host |

Apply to Production (and Preview if you use DB there too).

### 4. Database (if using Postgres)

Migrate/seed against the same `DATABASE_URL` before or right after the first deploy:

```bash
# with DATABASE_URL in your local .env (or exported)
npm run db:migrate
npm run db:seed
```

### 5. Deploy

Click **Deploy** (or push to the connected branch). After it succeeds:

- Game: `https://<project>.vercel.app`
- Health: `https://<project>.vercel.app/api/health`

Local workflow stays the same (`dev:server` + `dev:client`). Do not run `app.listen` on Vercel — the serverless entry only exports the Express app.
