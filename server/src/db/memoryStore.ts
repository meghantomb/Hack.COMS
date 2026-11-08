import {
  DEFAULT_PLAYER_ID,
  DUCK_CHARACTER_IDS,
  SAMPLE_CHARACTER_ID,
  START_NODE_ID,
  applyChoiceProgress,
  bookmarkGraph,
  getFriendlinessTier,
  readBookmarks,
  rememberDuckPlace,
  minigameFlag,
  recordMinigameWinFlags,
  clearMinigameCooldown,
  hasClearedMinigame,
  hasMinigameCooldown,
  optionIsAvailable,
  type Character,
  type ChoiceResult,
  type Conversation,
  type DialogueBundle,
  type DialogueNode,
  type DialogueOption,
  type LoveMeter,
  type Minigame,
  type PlayerProgress,
  type StagePresence,
} from "@duck-dating/shared";
import * as content from "../data/sampleContent";
import * as scripts from "../data/duckScripts";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Show the closest wording of this beat that the player's closeness has earned. */
function selectVariantNode(
  current: DialogueNode,
  candidates: DialogueNode[],
  friendliness: number
): DialogueNode {
  if (!current.variantGroup) return current;
  let best: DialogueNode | null = null;
  for (const node of candidates) {
    if (node.conversationId !== current.conversationId) continue;
    if (node.variantGroup !== current.variantGroup) continue;
    if (friendliness < node.minFriendliness) continue;
    if (!best || node.minFriendliness > best.minFriendliness) best = node;
  }
  return best ?? current;
}

function freshProgress(playerId: string, flags: Record<string, boolean> = {}): PlayerProgress {
  return {
    playerId,
    currentNodeId: START_NODE_ID,
    characterId: SAMPLE_CHARACTER_ID,
    conversationId: null,
    exchangeCount: 0,
    consecutiveConversations: 0,
    endingType: "bad",
    flags,
    bookmarks: {},
    updatedAt: new Date().toISOString(),
  };
}

export class MemoryStore {
  characters = new Map<string, Character>();
  conversations = new Map<string, Conversation>();
  nodes = new Map<string, DialogueNode>();
  options = new Map<string, DialogueOption>();
  minigames = new Map<string, Minigame>();
  relationships = new Map<string, number>();
  progress = new Map<string, PlayerProgress>();
  private hydrated = false;

  /** Read dialogue after every module has finished loading. A hot reload can construct this store mid-import. */
  private hydrate() {
    if (this.hydrated) return;
    const characters = content.sampleCharacters;
    const conversations = scripts.sampleConversations;
    const nodes = scripts.sampleNodes;
    const options = scripts.sampleOptions;
    const minigames = scripts.sampleMinigames;
    if (!characters || !conversations || !nodes || !options || !minigames) return;
    this.hydrated = true;
    for (const character of characters) this.characters.set(character.id, clone(character));
    for (const conversation of conversations) this.conversations.set(conversation.id, clone(conversation));
    for (const node of nodes) this.nodes.set(node.id, clone(node));
    for (const option of options) this.options.set(option.id, clone(option));
    for (const game of minigames) this.minigames.set(game.id, clone(game));
  }

  private relKey(playerId: string, characterId: string) {
    return `${playerId}::${characterId}`;
  }

  private placeGraph() {
    this.hydrate();
    return bookmarkGraph([...this.nodes.values()], [...this.options.values()]);
  }

  getFriendliness(playerId: string, characterId: string): number {
    return this.relationships.get(this.relKey(playerId, characterId)) ?? 0;
  }

  setFriendliness(playerId: string, characterId: string, value: number) {
    this.relationships.set(
      this.relKey(playerId, characterId),
      Math.max(0, Math.min(100, value))
    );
  }

  private stageFor(node: DialogueNode): StagePresence[] | undefined {
    if (node.id === START_NODE_ID) {
      return [
        { characterId: "badboy", side: "left" },
        { characterId: "jock", side: "left" },
        { characterId: "breadluvr", side: "right" },
        { characterId: "artist", side: "right" },
      ];
    }
    if (!node.guestCharacterId) return undefined;
    return [
      { characterId: node.guestCharacterId, side: "left" },
      { characterId: node.characterId, side: "right" },
    ];
  }

  async getDialogueBundle(
    nodeId: string,
    playerId = DEFAULT_PLAYER_ID
  ): Promise<DialogueBundle | null> {
    this.hydrate();
    const node = this.nodes.get(nodeId);
    if (!node) return null;
    const friendliness = this.getFriendliness(playerId, node.characterId);
    const spoken = selectVariantNode(node, [...this.nodes.values()], friendliness);
    const character = this.characters.get(spoken.characterId);
    if (!character) return null;

    const tier = getFriendlinessTier(friendliness);
    const progress = this.progress.get(playerId) ?? freshProgress(playerId);
    const maxExchanges =
      (spoken.conversationId && this.conversations.get(spoken.conversationId)?.maxExchanges) || 20;

    const options = [...this.options.values()]
      .filter((o) => o.nodeId === spoken.id)
      .filter((o) => {
        const next = this.nodes.get(o.nextNodeId);
        return optionIsAvailable({
          minFriendliness: o.minFriendliness,
          requiredTier: o.requiredTier,
          continuesConversation: o.continuesConversation,
          requiresMinigameWin: o.requiresMinigameWin,
          minigameCleared: hasClearedMinigame(progress.flags),
          minigameCooldown: hasMinigameCooldown(progress.flags),
          hasMinigameOffer: Boolean(o.minigameId),
          nextMinFriendliness: next?.minFriendliness ?? 0,
          friendliness,
          tier,
          staysInConversation: (next?.conversationId ?? null) === spoken.conversationId,
          exchangeCount: progress.exchangeCount,
          maxExchanges,
          consecutiveConversations: progress.consecutiveConversations,
        });
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      node: spoken,
      options,
      character,
      friendliness,
      tier,
      loveMeters: this.getLoveMeters(playerId),
      onStage: this.stageFor(spoken),
    };
  }

  getLoveMeters(playerId: string): LoveMeter[] {
    this.hydrate();
    return DUCK_CHARACTER_IDS.map((id) => {
      const c = this.characters.get(id);
      return {
        characterId: id,
        name: c?.name ?? id,
        spriteKey: c?.spriteKey ?? id,
        friendliness: this.getFriendliness(playerId, id),
      };
    });
  }

  async applyChoice(
    playerId: string,
    optionId: string,
    minigameWon?: boolean,
    playedMinigameId?: string
  ): Promise<ChoiceResult> {
    this.hydrate();
    const option = this.options.get(optionId);
    if (!option) {
      return {
        success: false,
        reason: "Unknown option",
        friendliness: 0,
        tier: "stranger",
        nextNodeId: null,
        unlocked: false,
      };
    }

    const node = this.nodes.get(option.nodeId);
    const nextNode = this.nodes.get(option.nextNodeId);
    if (!node || !nextNode) {
      return {
        success: false,
        reason: "Unknown node",
        friendliness: 0,
        tier: "stranger",
        nextNodeId: null,
        unlocked: false,
      };
    }

    const friendliness = this.getFriendliness(playerId, node.characterId);
    const tier = getFriendlinessTier(friendliness);
    const progress = this.progress.get(playerId) ?? freshProgress(playerId);
    const maxExchanges =
      (node.conversationId && this.conversations.get(node.conversationId)?.maxExchanges) || 20;

    const available = optionIsAvailable({
      minFriendliness: option.minFriendliness,
      requiredTier: option.requiredTier,
      continuesConversation: option.continuesConversation,
      requiresMinigameWin: option.requiresMinigameWin,
      minigameCleared: hasClearedMinigame(progress.flags),
      minigameCooldown: hasMinigameCooldown(progress.flags),
      hasMinigameOffer: Boolean(option.minigameId),
      nextMinFriendliness: nextNode.minFriendliness,
      friendliness,
      tier,
      staysInConversation: nextNode.conversationId === node.conversationId,
      exchangeCount: progress.exchangeCount,
      maxExchanges,
      consecutiveConversations: progress.consecutiveConversations,
    });

    if (!available) {
      return {
        success: false,
        reason: "That reply isn't available",
        friendliness,
        tier,
        nextNodeId: null,
        unlocked: false,
      };
    }

    if (option.minigameId && minigameWon !== true) {
      return {
        success: false,
        reason: "Minigame required",
        friendliness,
        tier,
        nextNodeId: null,
        unlocked: false,
      };
    }

    const bookmarks = readBookmarks(progress.bookmarks);
    const saved =
      node.id === START_NODE_ID ? bookmarks[nextNode.characterId] : undefined;
    const resumeNode =
      saved && this.nodes.get(saved.nodeId)
        ? this.nodes.get(saved.nodeId)!
        : null;

    const moved = applyChoiceProgress({
      fromNodeId: node.id,
      fromCharacterId: node.characterId,
      fromConversationId: node.conversationId,
      scriptedNext: nextNode,
      resumeNode,
      bookmarkGraph: this.placeGraph(),
      progress: {
        exchangeCount: progress.exchangeCount,
        consecutiveConversations: progress.consecutiveConversations,
        endingType: progress.endingType,
        bookmarks,
      },
    });

    const nextScore = Math.max(0, Math.min(100, friendliness + option.friendlinessDelta));
    if (!moved.resumed) {
      this.setFriendliness(playerId, node.characterId, nextScore);
    }

    let flags: Record<string, boolean> = { ...progress.flags, hasSave: true };
    if (option.minigameId && minigameWon) {
      const played = playedMinigameId ?? option.minigameId;
      flags = {
        ...recordMinigameWinFlags(flags, {
          playedMinigameId: played,
          characterId: node.characterId,
        }),
        [minigameFlag(option.minigameId)]: true,
        hasSave: true,
      };
    } else if (!option.minigameId) {
      flags = { ...clearMinigameCooldown(flags), hasSave: true };
    }

    this.progress.set(playerId, {
      playerId,
      currentNodeId: moved.currentNodeId,
      characterId: moved.characterId,
      conversationId: moved.conversationId,
      exchangeCount: moved.exchangeCount,
      consecutiveConversations: moved.consecutiveConversations,
      endingType: moved.endingType,
      bookmarks: moved.bookmarks,
      flags,
      updatedAt: new Date().toISOString(),
    });

    const reported = moved.resumed ? friendliness : nextScore;
    return {
      success: true,
      friendliness: reported,
      tier: getFriendlinessTier(reported),
      nextNodeId: moved.currentNodeId,
      unlocked: true,
    };
  }

  async saveProgress(
    playerId: string,
    currentNodeId: string,
    characterId: string,
    flags: Record<string, boolean> = {}
  ): Promise<PlayerProgress> {
    this.hydrate();
    const existing = this.progress.get(playerId) ?? freshProgress(playerId);
    const node = this.nodes.get(currentNodeId);
    let bookmarks = readBookmarks(existing.bookmarks);
    if (node && node.id !== START_NODE_ID) {
      bookmarks = rememberDuckPlace(
        bookmarks,
        {
          nodeId: node.id,
          characterId: node.characterId,
          conversationId: node.conversationId,
          exchangeCount: existing.exchangeCount,
          consecutiveConversations: existing.consecutiveConversations,
        },
        this.placeGraph()
      );
    }
    const progress: PlayerProgress = {
      ...existing,
      playerId,
      currentNodeId,
      characterId,
      conversationId: node?.conversationId ?? existing.conversationId,
      endingType: node?.isEnding ? node.endingType : existing.endingType,
      bookmarks,
      flags: { ...existing.flags, ...flags, hasSave: true },
      updatedAt: new Date().toISOString(),
    };
    this.progress.set(playerId, progress);
    return progress;
  }

  async getProgress(playerId: string): Promise<PlayerProgress | null> {
    return this.progress.get(playerId) ?? null;
  }

  async ensurePlayer(playerId = DEFAULT_PLAYER_ID) {
    this.hydrate();
    for (const id of DUCK_CHARACTER_IDS) {
      if (!this.relationships.has(this.relKey(playerId, id))) {
        this.setFriendliness(playerId, id, 0);
      }
    }
    const existing = this.progress.get(playerId);
    if (!existing) {
      this.progress.set(playerId, freshProgress(playerId));
    } else if (!existing.bookmarks) {
      existing.bookmarks = {};
    }
  }

  async resetPlayer(playerId = DEFAULT_PLAYER_ID) {
    this.hydrate();
    for (const id of DUCK_CHARACTER_IDS) {
      this.setFriendliness(playerId, id, 0);
    }
    this.progress.set(playerId, freshProgress(playerId));
  }

  async insertAiOptions(
    nodeId: string,
    texts: { text: string; friendlinessDelta: number }[]
  ): Promise<DialogueOption[]> {
    this.hydrate();
    const created: DialogueOption[] = [];
    const existing = [...this.options.values()].filter((o) => o.nodeId === nodeId);
    let sort = existing.length;
    const fallbackNext =
      existing[0]?.nextNodeId ??
      [...this.nodes.values()].find((n) => n.id !== nodeId)?.id ??
      nodeId;

    for (const t of texts) {
      const id = `ai_${nodeId}_${Date.now()}_${sort}`;
      const opt: DialogueOption = {
        id,
        nodeId,
        text: t.text,
        nextNodeId: fallbackNext,
        friendlinessDelta: t.friendlinessDelta,
        requiredTier: null,
        minFriendliness: 0,
        minigameId: null,
        requiresMinigameWin: false,
        continuesConversation: false,
        sortOrder: sort++,
      };
      this.options.set(id, opt);
      created.push(opt);
    }
    return created;
  }

  getCharacter(id: string) {
    this.hydrate();
    return this.characters.get(id) ?? null;
  }

  getMinigame(id: string) {
    this.hydrate();
    return this.minigames.get(id) ?? null;
  }
}

export const memoryStore = new MemoryStore();
