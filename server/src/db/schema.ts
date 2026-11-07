import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

export const characters = pgTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  personality: text("personality").notNull(),
  spriteKey: text("sprite_key").notNull(),
  description: text("description").notNull(),
});

export const dialogueNodes = pgTable("dialogue_nodes", {
  id: text("id").primaryKey(),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id),
  speaker: text("speaker").notNull(),
  text: text("text").notNull(),
  backgroundKey: text("background_key").notNull().default("pond"),
  spriteExpression: text("sprite_expression").notNull().default("neutral"),
  isEnding: boolean("is_ending").notNull().default(false),
  endingType: text("ending_type"), // 'friendship' | 'romance' | null
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
  requiredTier: text("required_tier"), // FriendlinessTier | null
  minigameId: text("minigame_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
});

export const minigames = pgTable("minigames", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  phaserKey: text("phaser_key").notNull(),
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
  flags: jsonb("flags").$type<Record<string, boolean>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
