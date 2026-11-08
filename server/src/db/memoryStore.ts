import {
  DEFAULT_PLAYER_ID,
  DUCK_CHARACTER_IDS,
  SAMPLE_CHARACTER_ID,
  START_NODE_ID,
  advanceConversation,
  getFriendlinessTier,
  minigameFlag,
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
import {
  sampleCharacters,
  sampleConversations,
  sampleMinigame,
  sampleNodes,
  sampleOptions,
} from "../data/sampleContent";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
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
    updatedAt: new Date().toISOString(),
  };
}

export class MemoryStore {
  characters = new Map<string, Character>(
    sampleCharacters.map((c) => [c.id, clone(c)])
  );
  conversations = new Map<string, Conversation>(
    sampleConversations.map((c) => [c.id, clone(c)])
  );
  nodes = new Map<string, DialogueNode>(sampleNodes.map((n) => [n.id, clone(n)]));
  options = new Map<string, DialogueOption>(sampleOptions.map((o) => [o.id, clone(o)]));
  minigames = new Map<string, Minigame>([[sampleMinigame.id, clone(sampleMinigame)]]);
  relationships = new Map<string, number>();
  progress = new Map<string, PlayerProgress>();

  private relKey(playerId: string, characterId: string) {
    return `${playerId}::${characterId}`;
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
    const node = this.nodes.get(nodeId);
    if (!node) return null;
    const character = this.characters.get(node.characterId);
    if (!character) return null;

    const friendliness = this.getFriendliness(playerId, node.characterId);
    const tier = getFriendlinessTier(friendliness);
    const progress = this.progress.get(playerId) ?? freshProgress(playerId);
    const maxExchanges =
      (node.conversationId && this.conversations.get(node.conversationId)?.maxExchanges) || 20;

    const options = [...this.options.values()]
      .filter((o) => o.nodeId === nodeId)
      .filter((o) => {
        const next = this.nodes.get(o.nextNodeId);
        return optionIsAvailable({
          minFriendliness: o.minFriendliness,
          requiredTier: o.requiredTier,
          continuesConversation: o.continuesConversation,
          nextMinFriendliness: next?.minFriendliness ?? 0,
          friendliness,
          tier,
          staysInConversation: (next?.conversationId ?? null) === node.conversationId,
          exchangeCount: progress.exchangeCount,
          maxExchanges,
          consecutiveConversations: progress.consecutiveConversations,
        });
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      node,
      options,
      character,
      friendliness,
      tier,
      loveMeters: this.getLoveMeters(playerId),
      onStage: this.stageFor(node),
    };
  }

  getLoveMeters(playerId: string): LoveMeter[] {
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
    minigameWon?: boolean
  ): Promise<ChoiceResult> {
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

    const next = Math.max(0, Math.min(100, friendliness + option.friendlinessDelta));
    this.setFriendliness(playerId, node.characterId, next);

    const moved = advanceConversation({
      exchangeCount: progress.exchangeCount,
      consecutiveConversations: progress.consecutiveConversations,
      endingType: progress.endingType,
      currentConversationId: node.conversationId,
      currentCharacterId: node.characterId,
      nextConversationId: nextNode.conversationId,
      nextCharacterId: nextNode.characterId,
      nextIsEnding: nextNode.isEnding,
      nextEndingType: nextNode.endingType,
    });

    const flags = { ...progress.flags };
    if (option.minigameId && minigameWon) flags[minigameFlag(option.minigameId)] = true;

    this.progress.set(playerId, {
      playerId,
      currentNodeId: option.nextNodeId,
      characterId: nextNode.characterId,
      conversationId: moved.conversationId,
      exchangeCount: moved.exchangeCount,
      consecutiveConversations: moved.consecutiveConversations,
      endingType: moved.endingType,
      flags,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      friendliness: next,
      tier: getFriendlinessTier(next),
      nextNodeId: option.nextNodeId,
      unlocked: true,
    };
  }

  async saveProgress(
    playerId: string,
    currentNodeId: string,
    characterId: string,
    flags: Record<string, boolean> = {}
  ): Promise<PlayerProgress> {
    const existing = this.progress.get(playerId) ?? freshProgress(playerId);
    const node = this.nodes.get(currentNodeId);
    const progress: PlayerProgress = {
      ...existing,
      playerId,
      currentNodeId,
      characterId,
      conversationId: node?.conversationId ?? existing.conversationId,
      endingType: node?.isEnding ? node.endingType : existing.endingType,
      flags,
      updatedAt: new Date().toISOString(),
    };
    this.progress.set(playerId, progress);
    return progress;
  }

  async getProgress(playerId: string): Promise<PlayerProgress | null> {
    return this.progress.get(playerId) ?? null;
  }

  async ensurePlayer(playerId = DEFAULT_PLAYER_ID) {
    for (const id of DUCK_CHARACTER_IDS) {
      if (!this.relationships.has(this.relKey(playerId, id))) {
        this.setFriendliness(playerId, id, 0);
      }
    }
    if (!this.progress.has(playerId)) {
      this.progress.set(playerId, freshProgress(playerId));
    }
  }

  async resetPlayer(playerId = DEFAULT_PLAYER_ID) {
    for (const id of DUCK_CHARACTER_IDS) {
      this.setFriendliness(playerId, id, 0);
    }
    this.progress.set(playerId, freshProgress(playerId));
  }

  async insertAiOptions(
    nodeId: string,
    texts: { text: string; friendlinessDelta: number }[]
  ): Promise<DialogueOption[]> {
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
        continuesConversation: false,
        sortOrder: sort++,
      };
      this.options.set(id, opt);
      created.push(opt);
    }
    return created;
  }

  getCharacter(id: string) {
    return this.characters.get(id) ?? null;
  }

  getMinigame(id: string) {
    return this.minigames.get(id) ?? null;
  }
}

export const memoryStore = new MemoryStore();
