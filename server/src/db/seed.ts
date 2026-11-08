import dotenv from "dotenv";
import { notInArray } from "drizzle-orm";
import { resolve } from "path";
import { closeDb, getDb, initDb } from "./index";

dotenv.config({ path: resolve(__dirname, "../../../.env") });
dotenv.config();

import * as schema from "./schema";
import { duckScripts, sampleMinigames, shoreNodes, shoreOptions } from "../data/duckScripts";
import { sampleCharacters } from "../data/sampleContent";
import {
  DEFAULT_PLAYER_ID,
  DUCK_CHARACTER_IDS,
  SAMPLE_CHARACTER_ID,
  START_NODE_ID,
} from "@duck-dating/shared";

async function seed() {
  const mode = await initDb();
  if (mode !== "postgres") {
    console.log("No DATABASE_URL — seed not needed (memory store has sample data).");
    process.exit(0);
  }

  const db = getDb()!;

  for (const c of sampleCharacters) {
    await db
      .insert(schema.characters)
      .values({
        id: c.id,
        name: c.name,
        personality: c.personality,
        spriteKey: c.spriteKey,
        description: c.description,
      })
      .onConflictDoUpdate({
        target: schema.characters.id,
        set: {
          name: c.name,
          personality: c.personality,
          spriteKey: c.spriteKey,
          description: c.description,
        },
      });
  }

  for (const script of duckScripts) {
    for (const conversation of script.conversations) {
      await db
        .insert(schema.conversations)
        .values({
          id: conversation.id,
          characterId: conversation.characterId,
          title: conversation.title,
          sortOrder: conversation.sortOrder,
          maxExchanges: conversation.maxExchanges,
        })
        .onConflictDoUpdate({
          target: schema.conversations.id,
          set: {
            characterId: conversation.characterId,
            title: conversation.title,
            sortOrder: conversation.sortOrder,
            maxExchanges: conversation.maxExchanges,
          },
        });
    }
    console.log(
      script.conversations.length === 0
        ? `${script.id}: no dialogue yet`
        : `${script.id}: ${script.conversations.length} conversations`
    );
  }

  for (const minigame of sampleMinigames) {
    await db
      .insert(schema.minigames)
      .values({
        id: minigame.id,
        name: minigame.name,
        description: minigame.description,
      })
      .onConflictDoUpdate({
        target: schema.minigames.id,
        set: {
          name: minigame.name,
          description: minigame.description,
        },
      });
  }

  const nodes = [...shoreNodes, ...duckScripts.flatMap((script) => script.nodes)];
  for (const node of nodes) {
    await db
      .insert(schema.dialogueNodes)
      .values({
        id: node.id,
        characterId: node.characterId,
        conversationId: node.conversationId,
        speaker: node.speaker,
        text: node.text,
        backgroundKey: node.backgroundKey,
        spriteExpression: node.spriteExpression,
        isEnding: node.isEnding,
        endingType: node.endingType,
        minFriendliness: node.minFriendliness,
        guestCharacterId: node.guestCharacterId,
        variantGroup: node.variantGroup,
      })
      .onConflictDoUpdate({
        target: schema.dialogueNodes.id,
        set: {
          characterId: node.characterId,
          conversationId: node.conversationId,
          speaker: node.speaker,
          text: node.text,
          backgroundKey: node.backgroundKey,
          spriteExpression: node.spriteExpression,
          isEnding: node.isEnding,
          endingType: node.endingType,
          minFriendliness: node.minFriendliness,
          guestCharacterId: node.guestCharacterId,
          variantGroup: node.variantGroup,
        },
      });
  }

  const options = [...shoreOptions, ...duckScripts.flatMap((script) => script.options)];
  for (const opt of options) {
    await db
      .insert(schema.dialogueOptions)
      .values({
        id: opt.id,
        nodeId: opt.nodeId,
        text: opt.text,
        nextNodeId: opt.nextNodeId,
        friendlinessDelta: opt.friendlinessDelta,
        requiredTier: opt.requiredTier,
        minFriendliness: opt.minFriendliness,
        minigameId: opt.minigameId,
        requiresMinigameWin: opt.requiresMinigameWin,
        continuesConversation: opt.continuesConversation,
        sortOrder: opt.sortOrder,
        isAiGenerated: false,
      })
      .onConflictDoUpdate({
        target: schema.dialogueOptions.id,
        set: {
          nodeId: opt.nodeId,
          text: opt.text,
          nextNodeId: opt.nextNodeId,
          friendlinessDelta: opt.friendlinessDelta,
          requiredTier: opt.requiredTier,
          minFriendliness: opt.minFriendliness,
          minigameId: opt.minigameId,
          requiresMinigameWin: opt.requiresMinigameWin,
          continuesConversation: opt.continuesConversation,
          sortOrder: opt.sortOrder,
        },
      });
  }

  const optionIds = options.map((opt) => opt.id);
  const nodeIds = nodes.map((node) => node.id);
  await db.delete(schema.dialogueOptions).where(notInArray(schema.dialogueOptions.id, optionIds));
  await db
    .update(schema.playerProgress)
    .set({
      currentNodeId: START_NODE_ID,
      conversationId: null,
      exchangeCount: 0,
      consecutiveConversations: 0,
    })
    .where(notInArray(schema.playerProgress.currentNodeId, nodeIds));
  await db.delete(schema.dialogueNodes).where(notInArray(schema.dialogueNodes.id, nodeIds));

  for (const characterId of DUCK_CHARACTER_IDS) {
    await db
      .insert(schema.relationships)
      .values({
        playerId: DEFAULT_PLAYER_ID,
        characterId,
        friendliness: 0,
      })
      .onConflictDoNothing();
  }

  await db
    .insert(schema.playerProgress)
    .values({
      playerId: DEFAULT_PLAYER_ID,
      currentNodeId: START_NODE_ID,
      characterId: SAMPLE_CHARACTER_ID,
      conversationId: null,
      exchangeCount: 0,
      consecutiveConversations: 0,
      endingType: "bad",
      flags: {},
      bookmarks: {},
    })
    .onConflictDoNothing();

  console.log(
    `Seed complete (${nodes.length} lines, ${options.length} replies, shore included).`
  );
  await closeDb();
}

seed().catch(async (err) => {
  console.error(err);
  await closeDb();
  process.exit(1);
});
