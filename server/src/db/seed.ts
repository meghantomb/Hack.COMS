import dotenv from "dotenv";
import { resolve } from "path";
import { getDb, isUsingDatabase, closeDb } from "./index";

dotenv.config({ path: resolve(__dirname, "../../../.env") });
dotenv.config();

import * as schema from "./schema";
import {
  sampleCharacters,
  sampleConversations,
  sampleMinigame,
  sampleNodes,
  sampleOptions,
} from "../data/sampleContent";
import {
  DEFAULT_PLAYER_ID,
  DUCK_CHARACTER_IDS,
  SAMPLE_CHARACTER_ID,
  START_NODE_ID,
} from "@duck-dating/shared";

async function seed() {
  if (!isUsingDatabase()) {
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

  for (const conversation of sampleConversations) {
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

  await db
    .insert(schema.minigames)
    .values({
      id: sampleMinigame.id,
      name: sampleMinigame.name,
      description: sampleMinigame.description,
      phaserKey: sampleMinigame.phaserKey,
    })
    .onConflictDoNothing();

  for (const node of sampleNodes) {
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

  for (const opt of sampleOptions) {
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
          continuesConversation: opt.continuesConversation,
          sortOrder: opt.sortOrder,
        },
      });
  }

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
      conversationId: "sam_first_meeting",
      exchangeCount: 0,
      consecutiveConversations: 0,
      endingType: "bad",
      flags: {},
    })
    .onConflictDoNothing();

  console.log("Seed complete (4 duck slots).");
  await closeDb();
}

seed().catch(async (err) => {
  console.error(err);
  await closeDb();
  process.exit(1);
});
