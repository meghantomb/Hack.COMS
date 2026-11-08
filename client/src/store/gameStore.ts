import { create } from "zustand";
import type {
  DialogueBundle,
  DialogueOption,
  FriendlinessTier,
} from "@duck-dating/shared";
import {
  DEFAULT_PLAYER_ID,
  START_NODE_ID,
  getFriendlinessLabel,
} from "@duck-dating/shared";
import {
  fetchProgress,
  fetchStart,
  postChoice,
  resetProgress,
} from "../api/client";

export type GamePhase =
  | "title"
  | "intro"
  | "loading"
  | "dialogue"
  | "minigame"
  | "ending"
  | "error";

interface GameState {
  playerId: string;
  phase: GamePhase;
  bundle: DialogueBundle | null;
  pendingOption: DialogueOption | null;
  typedLength: number;
  error: string | null;
  canContinue: boolean;
  titleBusy: boolean;
  prepareTitle: () => Promise<void>;
  startNewGame: () => Promise<void>;
  continueGame: () => Promise<void>;
  finishIntro: () => Promise<void>;
  load: () => Promise<void>;
  selectOption: (option: DialogueOption) => Promise<void>;
  completeMinigame: (won: boolean) => Promise<void>;
  cancelMinigame: () => void;
  setTypedLength: (n: number) => void;
  restart: () => Promise<void>;
  goToTitle: () => Promise<void>;
  friendlinessLabel: () => string;
}

function phaseForBundle(bundle: DialogueBundle): GamePhase {
  return bundle.node.isEnding ? "ending" : "dialogue";
}

export const useGameStore = create<GameState>((set, get) => ({
  playerId: DEFAULT_PLAYER_ID,
  phase: "title",
  bundle: null,
  pendingOption: null,
  typedLength: 0,
  error: null,
  canContinue: false,
  titleBusy: false,

  friendlinessLabel: () => {
    const b = get().bundle;
    if (!b) return "Stranger";
    return getFriendlinessLabel(b.friendliness);
  },

  prepareTitle: async () => {
    set({ phase: "title", error: null, bundle: null, pendingOption: null });
    try {
      const progress = await fetchProgress(get().playerId);
      const canContinue = progress.currentNodeId !== START_NODE_ID;
      set({ canContinue });
    } catch {
      set({ canContinue: false });
    }
  },

  startNewGame: async () => {
    // Enter intro immediately from the click so the video can autoplay.
    set({
      titleBusy: true,
      error: null,
      canContinue: false,
      phase: "intro",
      bundle: null,
      pendingOption: null,
    });
    try {
      await resetProgress(get().playerId);
      set({ titleBusy: false });
    } catch (e) {
      set({
        titleBusy: false,
        phase: "error",
        error: e instanceof Error ? e.message : "Could not start new game",
      });
    }
  },


  continueGame: async () => {
    set({ titleBusy: true, error: null });
    try {
      await get().load();
    } finally {
      set({ titleBusy: false });
    }
  },

  finishIntro: async () => {
    await get().load();
  },

  load: async () => {
    set({ phase: "loading", error: null });
    try {
      const bundle = await fetchStart(get().playerId);
      set({
        bundle,
        phase: phaseForBundle(bundle),
        typedLength: 0,
        pendingOption: null,
        canContinue: bundle.node.id !== START_NODE_ID || bundle.node.isEnding,
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
        phase: phaseForBundle(result.bundle),
        typedLength: 0,
        pendingOption: null,
        error: null,
        canContinue: true,
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
        phase: phaseForBundle(result.bundle),
        typedLength: 0,
        pendingOption: null,
        error: null,
        canContinue: true,
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

  goToTitle: async () => {
    await get().prepareTitle();
  },

  restart: async () => {
    // New game from ending / reset → intro again
    await get().startNewGame();
  },
}));

export type { FriendlinessTier };
