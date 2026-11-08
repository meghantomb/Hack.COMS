import {
  and,
  eq,
  inArray,
} from "drizzle-orm";
import {
  DEFAULT_PLAYER_ID,
  DUCK_CHARACTER_IDS,
  SAMPLE_CHARACTER_ID,
  START_NODE_ID,
  advanceConversation,
  getFriendlinessTier,
  hasClearedMinigame,
  minigameFlag,
  optionIsAvailable,
  type AiDialogueOption,
  type ChoiceResult,
  type DialogueBundle,
  type DialogueNode,
  type DialogueOption,
  type EndingType,
  type FriendlinessTier,
  type LoveMeter,
  type PlayerProgress,
  type StagePresence,
} from "@duck-dating/shared";
import { getDb, isUsingDatabase, memoryStore, schema } from "../db";


function asEnding(value: string | null | undefined): EndingType {
  return value === "good" ? "good" : "bad";
}

function toNode(row: typeof schema.dialogueNodes.$inferSelect): DialogueNode {
  return {
    id: row.id,
    characterId: row.characterId,
    conversationId: row.conversationId ?? null,
    speaker: row.speaker,
    text: row.text,
    backgroundKey: row.backgroundKey,
    spriteExpression: row.spriteExpression,
    isEnding: row.isEnding,
    endingType: asEnding(row.endingType),
    minFriendliness: row.minFriendliness ?? 0,
    guestCharacterId: row.guestCharacterId ?? null,
    variantGroup: row.variantGroup ?? null,
  };
}

function stageFor(node: DialogueNode): StagePresence[] | undefined {
  if (!node.guestCharacterId) return undefined;
  return [
    { characterId: node.guestCharacterId, side: "left" },
    { characterId: node.characterId, side: "right" },
  ];
}

const emptyProgress = {
  conversationId: null as string | null,
  exchangeCount: 0,
  consecutiveConversations: 0,
  endingType: "bad" as EndingType,
  flags: {} as Record<string, boolean>,
};

export async function ensurePlayer(playerId = DEFAULT_PLAYER_ID) {
  if (!isUsingDatabase()) {
    await memoryStore.ensurePlayer(playerId);
    return;
  }
  const db = getDb()!;
  for (const characterId of DUCK_CHARACTER_IDS) {
    await db
      .insert(schema.relationships)
      .values({ playerId, characterId, friendliness: 0 })
      .onConflictDoNothing();
  }

  const existingProg = await db
    .select()
    .from(schema.playerProgress)
    .where(eq(schema.playerProgress.playerId, playerId))
    .limit(1);

  if (existingProg.length === 0) {
    await db.insert(schema.playerProgress).values({
      playerId,
      currentNodeId: START_NODE_ID,
      characterId: SAMPLE_CHARACTER_ID,
      conversationId: emptyProgress.conversationId,
      exchangeCount: 0,
      consecutiveConversations: 0,
      endingType: "bad",
      flags: {},
    });
  }
}

export async function resetPlayer(playerId = DEFAULT_PLAYER_ID) {
  if (!isUsingDatabase()) {
    await memoryStore.resetPlayer(playerId);
    return;
  }
  const db = getDb()!;
  for (const characterId of DUCK_CHARACTER_IDS) {
    await db
      .insert(schema.relationships)
      .values({ playerId, characterId, friendliness: 0 })
      .onConflictDoUpdate({
        target: [schema.relationships.playerId, schema.relationships.characterId],
        set: { friendliness: 0 },
      });
  }
  await db
    .insert(schema.playerProgress)
    .values({
      playerId,
      currentNodeId: START_NODE_ID,
      characterId: SAMPLE_CHARACTER_ID,
      conversationId: emptyProgress.conversationId,
      exchangeCount: 0,
      consecutiveConversations: 0,
      endingType: "bad",
      flags: {},
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.playerProgress.playerId,
      set: {
        currentNodeId: START_NODE_ID,
        characterId: SAMPLE_CHARACTER_ID,
        conversationId: emptyProgress.conversationId,
        exchangeCount: 0,
        consecutiveConversations: 0,
        endingType: "bad",
        flags: {},
        updatedAt: new Date(),
      },
    });
}

async function loadLoveMeters(playerId: string): Promise<LoveMeter[]> {
  if (!isUsingDatabase()) {
    return memoryStore.getLoveMeters(playerId);
  }
  const db = getDb()!;
  const chars = await db.select().from(schema.characters);
  const byId = new Map(chars.map((c) => [c.id, c]));
  const rels = await db
    .select()
    .from(schema.relationships)
    .where(eq(schema.relationships.playerId, playerId));
  const loveById = new Map(rels.map((r) => [r.characterId, r.friendliness]));

  return DUCK_CHARACTER_IDS.map((id) => {
    const c = byId.get(id);
    return {
      characterId: id,
      name: c?.name ?? id,
      spriteKey: c?.spriteKey ?? id,
      friendliness: loveById.get(id) ?? 0,
    };
  });
}


export async function getDialogueBundle(
  nodeId: string,
  playerId = DEFAULT_PLAYER_ID
): Promise<DialogueBundle | null> {
  await ensurePlayer(playerId);
  if (!isUsingDatabase()) {
    return memoryStore.getDialogueBundle(nodeId, playerId);
  }

  const db = getDb()!;
  const [node] = await db
    .select()
    .from(schema.dialogueNodes)
    .where(eq(schema.dialogueNodes.id, nodeId))
    .limit(1);
  if (!node) return null;

  const [character] = await db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, node.characterId))
    .limit(1);
  if (!character) return null;

  const [rel] = await db
    .select()
    .from(schema.relationships)
    .where(
      and(
        eq(schema.relationships.playerId, playerId),
        eq(schema.relationships.characterId, node.characterId)
      )
    )
    .limit(1);

  const friendliness = rel?.friendliness ?? 0;
  const tier = getFriendlinessTier(friendliness);
  const spoken = toNode(node);

  const [progressRow] = await db
    .select()
    .from(schema.playerProgress)
    .where(eq(schema.playerProgress.playerId, playerId))
    .limit(1);

  const [conversation] = spoken.conversationId
    ? await db
        .select()
        .from(schema.conversations)
        .where(eq(schema.conversations.id, spoken.conversationId))
        .limit(1)
    : [];

  const allOptions = await db
    .select()
    .from(schema.dialogueOptions)
    .where(eq(schema.dialogueOptions.nodeId, nodeId));

  const nextIds = [...new Set(allOptions.map((o) => o.nextNodeId))];
  const nextRows = nextIds.length
    ? await db
        .select()
        .from(schema.dialogueNodes)
        .where(inArray(schema.dialogueNodes.id, nextIds))
    : [];
  const nextById = new Map(nextRows.map((row) => [row.id, toNode(row)]));

  const exchangeCount = progressRow?.exchangeCount ?? 0;
  const consecutiveConversations = progressRow?.consecutiveConversations ?? 0;
  const maxExchanges = conversation?.maxExchanges ?? 20;

  const options: DialogueOption[] = allOptions
    .filter((o) => {
      const next = nextById.get(o.nextNodeId);
      return optionIsAvailable({
        minFriendliness: o.minFriendliness ?? 0,
        requiredTier: (o.requiredTier as FriendlinessTier | null) ?? null,
        continuesConversation: o.continuesConversation ?? false,
        requiresMinigameWin: o.requiresMinigameWin ?? false,
        minigameCleared: hasClearedMinigame(progressRow?.flags as Record<string, boolean> | null),
        nextMinFriendliness: next?.minFriendliness ?? 0,
        friendliness,
        tier,
        staysInConversation: (next?.conversationId ?? null) === spoken.conversationId,
        exchangeCount,
        maxExchanges,
        consecutiveConversations,
      });
    })
    .map((o) => ({
      id: o.id,
      nodeId: o.nodeId,
      text: o.text,
      nextNodeId: o.nextNodeId,
      friendlinessDelta: o.friendlinessDelta,
      requiredTier: (o.requiredTier as FriendlinessTier | null) ?? null,
      minFriendliness: o.minFriendliness ?? 0,
      minigameId: o.minigameId,
      requiresMinigameWin: o.requiresMinigameWin ?? false,
      continuesConversation: o.continuesConversation ?? false,
      sortOrder: o.sortOrder,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    node: spoken,
    options,
    character: {
      id: character.id,
      name: character.name,
      personality: character.personality,
      spriteKey: character.spriteKey,
      description: character.description,
    },
    friendliness,
    tier,
    loveMeters: await loadLoveMeters(playerId),
    onStage: stageFor(spoken),
  };
}

export async function applyChoice(
  playerId: string,
  optionId: string,
  minigameWon?: boolean
): Promise<ChoiceResult> {
  await ensurePlayer(playerId);
  if (!isUsingDatabase()) {
    return memoryStore.applyChoice(playerId, optionId, minigameWon);
  }

  const db = getDb()!;
  const [option] = await db
    .select()
    .from(schema.dialogueOptions)
    .where(eq(schema.dialogueOptions.id, optionId))
    .limit(1);

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

  const [nodeRow] = await db
    .select()
    .from(schema.dialogueNodes)
    .where(eq(schema.dialogueNodes.id, option.nodeId))
    .limit(1);
  const [nextRow] = await db
    .select()
    .from(schema.dialogueNodes)
    .where(eq(schema.dialogueNodes.id, option.nextNodeId))
    .limit(1);

  if (!nodeRow || !nextRow) {
    return {
      success: false,
      reason: "Unknown node",
      friendliness: 0,
      tier: "stranger",
      nextNodeId: null,
      unlocked: false,
    };
  }

  const node = toNode(nodeRow);
  const nextNode = toNode(nextRow);

  const [rel] = await db
    .select()
    .from(schema.relationships)
    .where(
      and(
        eq(schema.relationships.playerId, playerId),
        eq(schema.relationships.characterId, node.characterId)
      )
    )
    .limit(1);

  const [progressRow] = await db
    .select()
    .from(schema.playerProgress)
    .where(eq(schema.playerProgress.playerId, playerId))
    .limit(1);

  const friendliness = rel?.friendliness ?? 0;
  const tier = getFriendlinessTier(friendliness);
  const [conversation] = node.conversationId
    ? await db
        .select()
        .from(schema.conversations)
        .where(eq(schema.conversations.id, node.conversationId))
        .limit(1)
    : [];

  const available = optionIsAvailable({
    minFriendliness: option.minFriendliness ?? 0,
    requiredTier: (option.requiredTier as FriendlinessTier | null) ?? null,
    continuesConversation: option.continuesConversation ?? false,
    requiresMinigameWin: option.requiresMinigameWin ?? false,
    minigameCleared: hasClearedMinigame(progressRow?.flags as Record<string, boolean> | null),
    nextMinFriendliness: nextNode.minFriendliness,
    friendliness,
    tier,
    staysInConversation: nextNode.conversationId === node.conversationId,
    exchangeCount: progressRow?.exchangeCount ?? 0,
    maxExchanges: conversation?.maxExchanges ?? 20,
    consecutiveConversations: progressRow?.consecutiveConversations ?? 0,
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

  await db
    .insert(schema.relationships)
    .values({
      playerId,
      characterId: node.characterId,
      friendliness: next,
    })
    .onConflictDoUpdate({
      target: [schema.relationships.playerId, schema.relationships.characterId],
      set: { friendliness: next },
    });

  const moved = advanceConversation({
    exchangeCount: progressRow?.exchangeCount ?? 0,
    consecutiveConversations: progressRow?.consecutiveConversations ?? 0,
    endingType: asEnding(progressRow?.endingType),
    currentConversationId: node.conversationId,
    currentCharacterId: node.characterId,
    nextConversationId: nextNode.conversationId,
    nextCharacterId: nextNode.characterId,
    nextIsEnding: nextNode.isEnding,
    nextEndingType: nextNode.endingType,
  });

  const flags = { ...((progressRow?.flags as Record<string, boolean> | null) ?? {}) };
  if (option.minigameId && minigameWon) flags[minigameFlag(option.minigameId)] = true;

  await db
    .insert(schema.playerProgress)
    .values({
      playerId,
      currentNodeId: option.nextNodeId,
      characterId: nextNode.characterId,
      conversationId: moved.conversationId,
      exchangeCount: moved.exchangeCount,
      consecutiveConversations: moved.consecutiveConversations,
      endingType: moved.endingType,
      flags,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.playerProgress.playerId,
      set: {
        currentNodeId: option.nextNodeId,
        characterId: nextNode.characterId,
        conversationId: moved.conversationId,
        exchangeCount: moved.exchangeCount,
        consecutiveConversations: moved.consecutiveConversations,
        endingType: moved.endingType,
        flags,
        updatedAt: new Date(),
      },
    });

  return {
    success: true,
    friendliness: next,
    tier: getFriendlinessTier(next),
    nextNodeId: option.nextNodeId,
    unlocked: true,
  };
}

export async function saveProgress(
  playerId: string,
  currentNodeId: string,
  characterId: string,
  flags: Record<string, boolean> = {}
): Promise<PlayerProgress> {
  if (!isUsingDatabase()) {
    return memoryStore.saveProgress(playerId, currentNodeId, characterId, flags);
  }
  const db = getDb()!;
  const [existing] = await db
    .select()
    .from(schema.playerProgress)
    .where(eq(schema.playerProgress.playerId, playerId))
    .limit(1);
  const [nodeRow] = await db
    .select()
    .from(schema.dialogueNodes)
    .where(eq(schema.dialogueNodes.id, currentNodeId))
    .limit(1);
  const node = nodeRow ? toNode(nodeRow) : null;
  const endingType = node?.isEnding ? node.endingType : asEnding(existing?.endingType);
  const conversationId = node?.conversationId ?? existing?.conversationId ?? null;

  await db
    .insert(schema.playerProgress)
    .values({
      playerId,
      currentNodeId,
      characterId,
      conversationId,
      exchangeCount: existing?.exchangeCount ?? 0,
      consecutiveConversations: existing?.consecutiveConversations ?? 0,
      endingType,
      flags,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.playerProgress.playerId,
      set: {
        currentNodeId,
        characterId,
        conversationId,
        endingType,
        flags,
        updatedAt: new Date(),
      },
    });

  return {
    playerId,
    currentNodeId,
    characterId,
    conversationId,
    exchangeCount: existing?.exchangeCount ?? 0,
    consecutiveConversations: existing?.consecutiveConversations ?? 0,
    endingType,
    flags,
    updatedAt: new Date().toISOString(),
  };
}

export async function getProgress(
  playerId: string
): Promise<PlayerProgress | null> {
  await ensurePlayer(playerId);
  if (!isUsingDatabase()) {
    return memoryStore.getProgress(playerId);
  }
  const db = getDb()!;
  const [row] = await db
    .select()
    .from(schema.playerProgress)
    .where(eq(schema.playerProgress.playerId, playerId))
    .limit(1);
  if (!row) return null;
  return {
    playerId: row.playerId,
    currentNodeId: row.currentNodeId,
    characterId: row.characterId,
    conversationId: row.conversationId ?? null,
    exchangeCount: row.exchangeCount ?? 0,
    consecutiveConversations: row.consecutiveConversations ?? 0,
    endingType: asEnding(row.endingType),
    flags: (row.flags as Record<string, boolean>) ?? {},
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function insertAiDialogueOptions(
  nodeId: string,
  options: AiDialogueOption[]
): Promise<DialogueOption[]> {
  if (!isUsingDatabase()) {
    return memoryStore.insertAiOptions(
      nodeId,
      options.map((o) => ({
        text: o.text,
        friendlinessDelta: o.friendlinessDelta,
      }))
    );
  }

  const db = getDb()!;
  const existing = await db
    .select()
    .from(schema.dialogueOptions)
    .where(eq(schema.dialogueOptions.nodeId, nodeId));

  const fallbackNext = existing[0]?.nextNodeId;
  if (!fallbackNext) {
    throw new Error("Cannot attach AI options: node has no existing branches");
  }

  let sort = existing.length;
  const created: DialogueOption[] = [];

  for (const opt of options) {
    const id = `ai_${nodeId}_${Date.now()}_${sort}`;
    await db.insert(schema.dialogueOptions).values({
      id,
      nodeId,
      text: opt.text,
      nextNodeId: fallbackNext,
      friendlinessDelta: opt.friendlinessDelta,
      requiredTier: null,
      minFriendliness: 0,
      minigameId: null,
      requiresMinigameWin: false,
      continuesConversation: false,
      sortOrder: sort,
      isAiGenerated: true,
    });
    created.push({
      id,
      nodeId,
      text: opt.text,
      nextNodeId: fallbackNext,
      friendlinessDelta: opt.friendlinessDelta,
      requiredTier: null,
      minFriendliness: 0,
      minigameId: null,
      requiresMinigameWin: false,
      continuesConversation: false,
      sortOrder: sort,
    });
    sort += 1;
  }

  return created;
}

export async function getCharacter(id: string) {
  if (!isUsingDatabase()) return memoryStore.getCharacter(id);
  const db = getDb()!;
  const [row] = await db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, id))
    .limit(1);
  return row ?? null;
}
