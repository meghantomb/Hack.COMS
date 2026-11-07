import {
  DEFAULT_PLAYER_ID,
  DUCK_CHARACTER_IDS,
  SAMPLE_CHARACTER_ID,
  START_NODE_ID,
  getFriendlinessTier,
  type Character,
  type ChoiceResult,
  type DialogueBundle,
  type DialogueNode,
  type DialogueOption,
  type FriendlinessTier,
  type LoveMeter,
  type Minigame,
  type PlayerProgress,
} from "@duck-dating/shared";
import {
  sampleCharacters,
  sampleMinigame,
  sampleNodes,
  sampleOptions,
} from "../data/sampleContent";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export class MemoryStore {
  characters = new Map<string, Character>(
    sampleCharacters.map((c) => [c.id, clone(c)])
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
    const tierOrder: FriendlinessTier[] = [
      "stranger",
      "acquaintance",
      "friend",
      "crush",
      "romance",
    ];
    const playerTierIdx = tierOrder.indexOf(tier);

    const options = [...this.options.values()]
      .filter((o) => o.nodeId === nodeId)
      .filter((o) => {
        if (!o.requiredTier) return true;
        return playerTierIdx >= tierOrder.indexOf(o.requiredTier);
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      node,
      options,
      character,
      friendliness,
      tier,
      loveMeters: this.getLoveMeters(playerId),
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
    if (!node) {
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
    const tierOrder: FriendlinessTier[] = [
      "stranger",
      "acquaintance",
      "friend",
      "crush",
      "romance",
    ];

    if (
      option.requiredTier &&
      tierOrder.indexOf(tier) < tierOrder.indexOf(option.requiredTier)
    ) {
      return {
        success: false,
        reason: `Requires ${option.requiredTier} tier`,
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

    const next = Math.max(
      0,
      Math.min(100, friendliness + option.friendlinessDelta)
    );
    this.setFriendliness(playerId, node.characterId, next);

    const progress: PlayerProgress = {
      playerId,
      currentNodeId: option.nextNodeId,
      characterId: node.characterId,
      flags: this.progress.get(playerId)?.flags ?? {},
      updatedAt: new Date().toISOString(),
    };
    this.progress.set(playerId, progress);

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
    const progress: PlayerProgress = {
      playerId,
      currentNodeId,
      characterId,
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
      await this.saveProgress(playerId, START_NODE_ID, SAMPLE_CHARACTER_ID);
    }
  }

  async resetPlayer(playerId = DEFAULT_PLAYER_ID) {
    for (const id of DUCK_CHARACTER_IDS) {
      this.setFriendliness(playerId, id, 0);
    }
    await this.saveProgress(playerId, START_NODE_ID, SAMPLE_CHARACTER_ID, {});
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
        minigameId: null,
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
