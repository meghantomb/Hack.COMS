import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { ConversationBookmarks } from "@duck-dating/shared";

export const characters = pgTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  personality: text("personality").notNull(),
  spriteKey: text("sprite_key").notNull(),
  description: text("description").notNull(),
});

/** One visit with a duck. A route is several of these, capped at max_exchanges replies. */
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  maxExchanges: integer("max_exchanges").notNull().default(20),
});

export const dialogueNodes = pgTable("dialogue_nodes", {
  id: text("id").primaryKey(),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id),
  conversationId: text("conversation_id").references(() => conversations.id),
  speaker: text("speaker").notNull(),
  text: text("text").notNull(),
  backgroundKey: text("background_key").notNull().default("pond"),
  spriteExpression: text("sprite_expression").notNull().default("neutral"),
  isEnding: boolean("is_ending").notNull().default(false),
  /** 'good' | 'bad'. Bad until a good ending line changes it. */
  endingType: text("ending_type").notNull().default("bad"),
  minFriendliness: integer("min_friendliness").notNull().default(0),
  guestCharacterId: text("guest_character_id").references(() => characters.id),
  variantGroup: text("variant_group"),
});

export const dialogueOptions = pgTable("dialogue_options", {
  id: text("id").primaryKey(),
  nodeId: text("node_id")
    .notNull()
    .references(() => dialogueNodes.id),
  text: text("text").notNull(),
  nextNodeId: text("next_node_id")
    .notNull()
    .references(() => dialogueNodes.id),
  friendlinessDelta: integer("friendliness_delta").notNull().default(0),
  requiredTier: text("required_tier"),
  minFriendliness: integer("min_friendliness").notNull().default(0),
  minigameId: text("minigame_id"),
  requiresMinigameWin: boolean("requires_minigame_win").notNull().default(false),
  continuesConversation: boolean("continues_conversation").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
});

export const minigames = pgTable("minigames", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
});

export const relationships = pgTable(
  "relationships",
  {
    playerId: text("player_id").notNull(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id),
    friendliness: integer("friendliness").notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.playerId, t.characterId] }),
  })
);

export const playerProgress = pgTable("player_progress", {
  playerId: text("player_id").primaryKey(),
  currentNodeId: text("current_node_id")
    .notNull()
    .references(() => dialogueNodes.id),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id),
  conversationId: text("conversation_id").references(() => conversations.id),
  exchangeCount: integer("exchange_count").notNull().default(0),
  consecutiveConversations: integer("consecutive_conversations").notNull().default(0),
  endingType: text("ending_type").notNull().default("bad"),
  flags: jsonb("flags").$type<Record<string, boolean>>().notNull().default({}),
  bookmarks: jsonb("bookmarks").$type<ConversationBookmarks>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
