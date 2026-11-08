const STORAGE_KEY = "wtd-player-id";

/** Stable per-browser save id (survives refresh; unique across devices). */
export function getOrCreatePlayerId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length > 0 && existing.length <= 64) return existing;
  } catch {
    // Private mode / blocked storage — fall through to ephemeral id.
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `device-${crypto.randomUUID()}`
      : `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Ephemeral for this tab only.
  }
  return id;
}
