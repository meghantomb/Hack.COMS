import {
  and,
  eq,
} from "drizzle-orm";
import {
  DEFAULT_PLAYER_ID,
  DUCK_CHARACTER_IDS,
  SAMPLE_CHARACTER_ID,
  START_NODE_ID,
  getFriendlinessTier,
  type AiDialogueOption,
  type ChoiceResult,
  type DialogueBundle,
  type DialogueOption,
  type FriendlinessTier,
  type LoveMeter,
  type PlayerProgress,
} from "@duck-dating/shared";
import { getDb, isUsingDatabase, memoryStore, schema } from "../db";


const tierOrder: FriendlinessTier[] = [
  "stranger",
  "acquaintance",
  "friend",
  "crush",
  "romance",
];

function meetsTier(current: FriendlinessTier, required: FriendlinessTier | null) {
  if (!required) return true;
  return tierOrder.indexOf(current) >= tierOrder.indexOf(required);
}

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
      flags: {},
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.playerProgress.playerId,
      set: {
        currentNodeId: START_NODE_ID,
        characterId: SAMPLE_CHARACTER_ID,
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

  const allOptions = await db
    .select()
    .from(schema.dialogueOptions)
    .where(eq(schema.dialogueOptions.nodeId, nodeId));

  const options: DialogueOption[] = allOptions
    .filter((o) =>
      meetsTier(tier, (o.requiredTier as FriendlinessTier | null) ?? null)
    )
    .map((o) => ({
      id: o.id,
      nodeId: o.nodeId,
      text: o.text,
      nextNodeId: o.nextNodeId,
      friendlinessDelta: o.friendlinessDelta,
      requiredTier: (o.requiredTier as FriendlinessTier | null) ?? null,
      minigameId: o.minigameId,
      sortOrder: o.sortOrder,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    node: {
      id: node.id,
      characterId: node.characterId,
      speaker: node.speaker,
      text: node.text,
      backgroundKey: node.backgroundKey,
      spriteExpression: node.spriteExpression,
      isEnding: node.isEnding,
      endingType: (node.endingType as "friendship" | "romance" | null) ?? null,
    },
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

  const [node] = await db
    .select()
    .from(schema.dialogueNodes)
    .where(eq(schema.dialogueNodes.id, option.nodeId))
    .limit(1);

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

  if (
    !meetsTier(tier, (option.requiredTier as FriendlinessTier | null) ?? null)
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

  await db
    .insert(schema.playerProgress)
    .values({
      playerId,
      currentNodeId: option.nextNodeId,
      characterId: node.characterId,
      flags: {},
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.playerProgress.playerId,
      set: {
        currentNodeId: option.nextNodeId,
        characterId: node.characterId,
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
  await db
    .insert(schema.playerProgress)
    .values({
      playerId,
      currentNodeId,
      characterId,
      flags,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.playerProgress.playerId,
      set: {
        currentNodeId,
        characterId,
        flags,
        updatedAt: new Date(),
      },
    });

  return {
    playerId,
    currentNodeId,
    characterId,
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
      minigameId: null,
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
      minigameId: null,
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
