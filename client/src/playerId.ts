const STORAGE_KEY = "wtd-player-id";
/** Legacy shared id — never reuse; force a new device signature. */
const LEGACY_IDS = new Set(["local-player", "local_player", "default"]);

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `device-${crypto.randomUUID()}`;
  }
  return `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function persist(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Ephemeral for this tab only.
  }
}

/** Stable per-browser save id (survives refresh; unique across devices). */
export function getOrCreatePlayerId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (
      existing &&
      existing.length > 0 &&
      existing.length <= 64 &&
      !LEGACY_IDS.has(existing) &&
      existing.startsWith("device-")
    ) {
      return existing;
    }
  } catch {
    // Private mode / blocked storage.
  }

  const id = createId();
  persist(id);
  return id;
}
