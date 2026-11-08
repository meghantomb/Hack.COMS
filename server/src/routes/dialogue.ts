import { Router } from "express";
import { z } from "zod";
import { DEFAULT_PLAYER_ID, START_NODE_ID } from "@duck-dating/shared";
import {
  applyChoice,
  getDialogueBundle,
  getProgress,
} from "../services/gameService";

export const dialogueRouter = Router();

dialogueRouter.get("/start", async (req, res) => {
  const playerId =
    typeof req.query.playerId === "string" && req.query.playerId.length > 0
      ? req.query.playerId
      : DEFAULT_PLAYER_ID;
  try {
    // Create this device's save only when they actually start/continue — not on title poll.
    const progress = await getProgress(playerId);
    const nodeId = progress?.currentNodeId ?? START_NODE_ID;
    const bundle = await getDialogueBundle(nodeId, playerId);
    if (!bundle) {
      res.status(404).json({ error: "Start node missing" });
      return;
    }
    res.json(bundle);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load dialogue" });
  }
});

dialogueRouter.get("/node/:nodeId", async (req, res) => {
  const playerId =
    typeof req.query.playerId === "string" ? req.query.playerId : DEFAULT_PLAYER_ID;
  try {
    const bundle = await getDialogueBundle(req.params.nodeId, playerId);
    if (!bundle) {
      res.status(404).json({ error: "Node not found" });
      return;
    }
    res.json(bundle);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load node" });
  }
});

const choiceSchema = z.object({
  playerId: z.string().min(1).max(64).default(DEFAULT_PLAYER_ID),
  optionId: z.string().min(1).max(128),
  minigameWon: z.boolean().optional(),
  playedMinigameId: z.string().min(1).max(64).optional(),
});

dialogueRouter.post("/choice", async (req, res) => {
  const parsed = choiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  try {
    const result = await applyChoice(
      parsed.data.playerId,
      parsed.data.optionId,
      parsed.data.minigameWon,
      parsed.data.playedMinigameId
    );
    if (!result.success && result.reason === "Minigame required") {
      res.status(409).json(result);
      return;
    }
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    const bundle = result.nextNodeId
      ? await getDialogueBundle(result.nextNodeId, parsed.data.playerId)
      : null;
    res.json({ ...result, bundle });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to apply choice" });
  }
});
