import { create } from "zustand";
import type {
  DialogueBundle,
  DialogueOption,
  FriendlinessTier,
} from "@duck-dating/shared";
import { START_NODE_ID, getFriendlinessLabel } from "@duck-dating/shared";
import {
  fetchProgress,
  fetchStart,
  postChoice,
  resetProgress,
  saveProgress,
} from "../api/client";
import { getOrCreatePlayerId } from "../playerId";


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
  /** Minigame choices failed this visit — stay greyed until the node changes. */
  lockedMinigameOptionIds: string[];
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
  completeMinigame: (won: boolean, playedMinigameId?: string) => Promise<void>;
  cancelMinigame: () => void;
  setTypedLength: (n: number) => void;
  restart: () => Promise<void>;
  goToTitle: () => Promise<void>;
  saveAndQuitToTitle: () => Promise<void>;
  friendlinessLabel: () => string;
}

function phaseForBundle(bundle: DialogueBundle): GamePhase {
  return bundle.node.isEnding ? "ending" : "dialogue";
}

export const useGameStore = create<GameState>((set, get) => ({
  playerId: getOrCreatePlayerId(),
  phase: "title",
  bundle: null,
  pendingOption: null,
  lockedMinigameOptionIds: [],
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
      const canContinue = Boolean(
        progress &&
          (progress.flags?.hasSave === true ||
            progress.currentNodeId !== START_NODE_ID)
      );
      set({ canContinue });
    } catch {
      // 404 / no save for this device
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
        lockedMinigameOptionIds: [],
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
    if (option.minigameId && get().lockedMinigameOptionIds.includes(option.id)) {
      return;
    }
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
        lockedMinigameOptionIds: [],
        error: null,
        canContinue: true,
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Choice failed" });
    }
  },

  completeMinigame: async (won, playedMinigameId) => {
    const option = get().pendingOption;
    if (!option) {
      set({ phase: "dialogue" });
      return;
    }
    if (!won) {
      const locked = get().lockedMinigameOptionIds;
      const textLen = get().bundle?.node.text.length ?? 0;
      set({
        pendingOption: null,
        phase: "dialogue",
        typedLength: textLen,
        lockedMinigameOptionIds: locked.includes(option.id)
          ? locked
          : [...locked, option.id],
      });
      return;
    }
    try {
      const result = await postChoice(
        option.id,
        true,
        get().playerId,
        playedMinigameId
      );
      if (!result.success || !result.bundle) {
        const textLen = get().bundle?.node.text.length ?? 0;
        set({
          pendingOption: null,
          phase: "dialogue",
          typedLength: textLen,
          error: result.reason ?? "Could not unlock response",
        });
        return;
      }
      // Always advance to the post-choice line — never remount the launcher.
      set({
        bundle: result.bundle,
        phase: phaseForBundle(result.bundle),
        typedLength: 0,
        pendingOption: null,
        lockedMinigameOptionIds: [],
        error: null,
        canContinue: true,
      });
    } catch (e) {
      const textLen = get().bundle?.node.text.length ?? 0;
      set({
        pendingOption: null,
        phase: "dialogue",
        typedLength: textLen,
        error: e instanceof Error ? e.message : "Minigame unlock failed",
      });
    }
  },

  cancelMinigame: () => {
    const option = get().pendingOption;
    const locked = get().lockedMinigameOptionIds;
    set({
      pendingOption: null,
      phase: "dialogue",
      lockedMinigameOptionIds:
        option && !locked.includes(option.id) ? [...locked, option.id] : locked,
    });
  },

  setTypedLength: (n) => set({ typedLength: n }),

  goToTitle: async () => {
    await get().prepareTitle();
  },

  saveAndQuitToTitle: async () => {
    const { bundle, playerId } = get();
    if (!bundle) {
      await get().prepareTitle();
      return;
    }
    try {
      await saveProgress({
        playerId,
        currentNodeId: bundle.node.id,
        characterId: bundle.character.id,
        flags: { hasSave: true },
      });
      set({
        phase: "title",
        bundle: null,
        pendingOption: null,
        error: null,
        canContinue: true,
        typedLength: 0,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Could not save progress",
      });
    }
  },

  restart: async () => {
    // New game from ending / reset → intro again
    await get().startNewGame();
  },
}));

export type { FriendlinessTier };
