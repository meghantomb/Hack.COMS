import type {
  ChoiceResult,
  DialogueBundle,
  PlayerProgress,
} from "@duck-dating/shared";
import { DEFAULT_PLAYER_ID } from "@duck-dating/shared";

const BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as { reason?: string; error?: string }).reason
      ?? (data as { error?: string }).error
      ?? `HTTP ${res.status}`) as Error & { status: number; body: unknown };
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data as T;
}

export function fetchStart(playerId = DEFAULT_PLAYER_ID) {
  return request<DialogueBundle>(
    `/api/dialogue/start?playerId=${encodeURIComponent(playerId)}`
  );
}

export function fetchNode(nodeId: string, playerId = DEFAULT_PLAYER_ID) {
  return request<DialogueBundle>(
    `/api/dialogue/node/${encodeURIComponent(nodeId)}?playerId=${encodeURIComponent(playerId)}`
  );
}

export function postChoice(
  optionId: string,
  minigameWon?: boolean,
  playerId = DEFAULT_PLAYER_ID
) {
  return request<ChoiceResult & { bundle: DialogueBundle | null }>(
    "/api/dialogue/choice",
    {
      method: "POST",
      body: JSON.stringify({ playerId, optionId, minigameWon }),
    }
  );
}

export function resetProgress(playerId = DEFAULT_PLAYER_ID) {
  return request<PlayerProgress>("/api/progress/reset", {
    method: "POST",
    body: JSON.stringify({ playerId }),
  });
}

export function fetchProgress(playerId = DEFAULT_PLAYER_ID) {
  return request<PlayerProgress>(
    `/api/progress/${encodeURIComponent(playerId)}`
  );
}

export function saveProgress(body: {
  playerId?: string;
  currentNodeId: string;
  characterId: string;
  flags?: Record<string, boolean>;
}) {
  return request<PlayerProgress>("/api/progress/save", {
    method: "POST",
    body: JSON.stringify({
      playerId: body.playerId ?? DEFAULT_PLAYER_ID,
      currentNodeId: body.currentNodeId,
      characterId: body.characterId,
      flags: body.flags ?? {},
    }),
  });
}
