import { Router } from "express";
import { z } from "zod";
import type { FriendlinessTier } from "@duck-dating/shared";
import { generateDialogueBatch } from "../services/grok";
import {
  getCharacter,
  insertAiDialogueOptions,
} from "../services/gameService";

export const generateRouter = Router();

const generateSchema = z.object({
  characterId: z.string().min(1).max(64),
  sceneContext: z.string().min(1).max(1000),
  tier: z.enum([
    "stranger",
    "acquaintance",
    "friend",
    "crush",
    "romance",
  ]),
  count: z.number().int().min(1).max(6).optional(),
  nodeId: z.string().min(1).max(128).optional(),
  persist: z.boolean().optional(),
});

generateRouter.post("/dialogue", async (req, res) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }

  try {
    const character = await getCharacter(parsed.data.characterId);
    if (!character) {
      res.status(404).json({ error: "Character not found" });
      return;
    }

    const result = await generateDialogueBatch({
      character: {
        id: character.id,
        name: character.name,
        personality: character.personality,
        spriteKey: character.spriteKey,
        description: character.description,
      },
      sceneContext: parsed.data.sceneContext,
      tier: parsed.data.tier as FriendlinessTier,
      count: parsed.data.count,
    });

    let inserted = null;
    if (parsed.data.persist && parsed.data.nodeId) {
      inserted = await insertAiDialogueOptions(parsed.data.nodeId, result.options);
    }

    res.json({ ...result, inserted });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Generation failed" });
  }
});
