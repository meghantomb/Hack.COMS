import { create } from "zustand";
import type {
  DialogueBundle,
  DialogueOption,
  FriendlinessTier,
} from "@duck-dating/shared";
import { DEFAULT_PLAYER_ID, getFriendlinessLabel } from "@duck-dating/shared";
import { fetchStart, postChoice, resetProgress } from "../api/client";

export type GamePhase = "loading" | "dialogue" | "minigame" | "ending" | "error";

interface GameState {
  playerId: string;
  phase: GamePhase;
  bundle: DialogueBundle | null;
  pendingOption: DialogueOption | null;
  typedLength: number;
  error: string | null;
  load: () => Promise<void>;
  selectOption: (option: DialogueOption) => Promise<void>;
  completeMinigame: (won: boolean) => Promise<void>;
  cancelMinigame: () => void;
  setTypedLength: (n: number) => void;
  restart: () => Promise<void>;
  friendlinessLabel: () => string;
}

export const useGameStore = create<GameState>((set, get) => ({
  playerId: DEFAULT_PLAYER_ID,
  phase: "loading",
  bundle: null,
  pendingOption: null,
  typedLength: 0,
  error: null,

  friendlinessLabel: () => {
    const b = get().bundle;
    if (!b) return "Stranger";
    return getFriendlinessLabel(b.friendliness);
  },

  load: async () => {
    set({ phase: "loading", error: null });
    try {
      const bundle = await fetchStart(get().playerId);
      set({
        bundle,
        phase: bundle.node.isEnding ? "ending" : "dialogue",
        typedLength: 0,
        pendingOption: null,
      });
    } catch (e) {
      set({
        phase: "error",
        error: e instanceof Error ? e.message : "Failed to load",
      });
    }
  },

  selectOption: async (option) => {
    if (option.minigameId) {
      set({ pendingOption: option, phase: "minigame" });
      return;
    }
    try {
      const result = await postChoice(option.id, undefined, get().playerId);
      if (!result.success || !result.bundle) {
        set({ error: result.reason ?? "Choice failed" });
        return;
      }
      set({
        bundle: result.bundle,
        phase: result.bundle.node.isEnding ? "ending" : "dialogue",
        typedLength: 0,
        pendingOption: null,
        error: null,
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Choice failed" });
    }
  },

  completeMinigame: async (won) => {
    const option = get().pendingOption;
    if (!option) {
      set({ phase: "dialogue" });
      return;
    }
    if (!won) {
      set({ pendingOption: null, phase: "dialogue" });
      return;
    }
    try {
      const result = await postChoice(option.id, true, get().playerId);
      if (!result.success || !result.bundle) {
        set({
          pendingOption: null,
          phase: "dialogue",
          error: result.reason ?? "Could not unlock response",
        });
        return;
      }
      set({
        bundle: result.bundle,
        phase: result.bundle.node.isEnding ? "ending" : "dialogue",
        typedLength: 0,
        pendingOption: null,
        error: null,
      });
    } catch (e) {
      set({
        pendingOption: null,
        phase: "dialogue",
        error: e instanceof Error ? e.message : "Minigame unlock failed",
      });
    }
  },

  cancelMinigame: () => {
    set({ pendingOption: null, phase: "dialogue" });
  },

  setTypedLength: (n) => set({ typedLength: n }),

  restart: async () => {
    set({ phase: "loading" });
    try {
      await resetProgress(get().playerId);
      await get().load();
    } catch (e) {
      set({
        phase: "error",
        error: e instanceof Error ? e.message : "Restart failed",
      });
    }
  },
}));

export type { FriendlinessTier };
