# Pond Hearts

Minimal browser duck dating sim (DDLC-inspired vertical slice). Four duck slots (Willow playable; Maple, Coral, Ash ready), love meters, branching dialogue, Lily Pad Hop gate, friendship / romance endings.

## Art (PNG slots)

Drop PNGs into `client/public/assets/` — see that folder’s `README.md`. Path wiring lives in `client/src/assets/manifest.ts` (no code edits needed if filenames match).

## Stack

- **client/** — React, TypeScript, Vite, Tailwind, Zustand, Phaser 3
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
  -d '{"characterId":"willow","sceneContext":"Morning at the pond","tier":"friend","count":3}'
```

Pass `"persist":true,"nodeId":"small_talk"` to insert validated options as flavor variations (same next-node as existing branches).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:client` / `dev:server` | Local Vite / API |
| `npm run build` | Build shared → server → client |
| `npm run typecheck` | TypeScript across workspaces |
| `npm run db:migrate` / `db:seed` | Schema + sample story (needs `DATABASE_URL`) |

Secrets stay server-side. The client only uses `VITE_API_URL` (optional; Vite proxy works without it).
