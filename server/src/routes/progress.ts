import { Router } from "express";
import { z } from "zod";
import { DEFAULT_PLAYER_ID } from "@duck-dating/shared";
import {
  getProgress,
  resetPlayer,
  saveProgress,
} from "../services/gameService";

export const progressRouter = Router();

progressRouter.get("/:playerId", async (req, res) => {
  try {
    const progress = await getProgress(req.params.playerId);
    if (!progress) {
      res.status(404).json({ error: "No progress" });
      return;
    }
    res.json(progress);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load progress" });
  }
});

const saveSchema = z.object({
  playerId: z.string().min(1).max(64).default(DEFAULT_PLAYER_ID),
  currentNodeId: z.string().min(1).max(128),
  characterId: z.string().min(1).max(64),
  flags: z.record(z.boolean()).optional(),
});

progressRouter.post("/save", async (req, res) => {
  const parsed = saveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  try {
    const saved = await saveProgress(
      parsed.data.playerId,
      parsed.data.currentNodeId,
      parsed.data.characterId,
      parsed.data.flags ?? {}
    );
    res.json(saved);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to save progress" });
  }
});

progressRouter.post("/reset", async (req, res) => {
  const playerId =
    typeof req.body?.playerId === "string" ? req.body.playerId : DEFAULT_PLAYER_ID;
  try {
    await resetPlayer(playerId);
    const progress = await getProgress(playerId);
    res.json(progress);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to reset" });
  }
});
