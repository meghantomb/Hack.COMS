import dotenv from "dotenv";
import { notInArray, sql } from "drizzle-orm";
import { resolve } from "path";
import { closeDb, getDb, initDb } from "./index";

dotenv.config({ path: resolve(__dirname, "../../../.env") });
dotenv.config();

import * as schema from "./schema";
import { duckScripts, sampleMinigames, shoreNodes, shoreOptions } from "../data/duckScripts";
import { sampleCharacters } from "../data/sampleContent";
import { bookmarkGraph } from "@duck-dating/shared";
import { rewriteExitBookmarks } from "./rewriteExitBookmarks";

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

  // Sam and Xander both used to share the line id xander_noticed. Xander's line moved.
  await db.execute(sql`
    UPDATE player_progress
    SET current_node_id = 'xander_you_noticed',
        conversation_id = 'xander_first_meeting'
    WHERE current_node_id = 'xander_noticed'
      AND character_id = 'badboy'
  `);
  await db.execute(sql`
    UPDATE player_progress
    SET bookmarks = jsonb_set(
      jsonb_set(bookmarks, '{badboy,nodeId}', '"xander_you_noticed"'::jsonb),
      '{badboy,conversationId}',
      '"xander_first_meeting"'::jsonb
    )
    WHERE bookmarks->'badboy'->>'nodeId' = 'xander_noticed'
  `);

  const optionIds = options.map((opt) => opt.id);
  const nodeIds = nodes.map((node) => node.id);
  await db.delete(schema.dialogueOptions).where(notInArray(schema.dialogueOptions.id, optionIds));
  await db.delete(schema.dialogueNodes).where(notInArray(schema.dialogueNodes.id, nodeIds));

  // Wipe all player saves so devices never share a seeded "local-player" row.
  await db.delete(schema.relationships);
  await db.delete(schema.playerProgress);
  console.log("Cleared all player progress and relationships.");

  const rewritten = await rewriteExitBookmarks(db, bookmarkGraph(nodes, options));
  console.log(
    `Seed complete (${nodes.length} lines, ${options.length} replies, shore included, ${rewritten} visit-exit bookmark saves moved).`
  );
  await closeDb();
}

seed().catch(async (err) => {
  console.error(err);
  await closeDb();
  process.exit(1);
});
