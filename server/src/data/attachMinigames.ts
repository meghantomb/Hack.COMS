import type { DialogueOption } from "@duck-dating/shared";

/**
 * Mark one existing reply on each listed node as a silent minigame launcher.
 * Keeps the original wording — only bumps friendship and attaches minigameId —
 * so the choice reads like the rest of the scene, just worth more.
 */
export function attachMinigameChoices(
  options: DialogueOption[],
  minigameId: string,
  nodeIds: string[],
  boostTo = 18
): DialogueOption[] {
  const targets = new Set(nodeIds);
  const pickIds = new Set<string>();

  for (const nodeId of targets) {
    const onNode = options.filter((option) => option.nodeId === nodeId);
    if (onNode.some((option) => option.minigameId)) continue;

    const candidates = onNode.filter(
      (option) =>
        !option.requiresMinigameWin &&
        !option.continuesConversation &&
        option.minFriendliness === 0 &&
        !option.requiredTier
    );
    const pool = candidates.length > 0 ? candidates : onNode.filter((o) => !o.requiresMinigameWin);
    if (pool.length === 0) continue;

    const best = [...pool].sort((a, b) => b.friendlinessDelta - a.friendlinessDelta)[0]!;
    pickIds.add(best.id);
  }

  return options.map((option) => {
    if (!pickIds.has(option.id)) return option;
    return {
      ...option,
      minigameId,
      friendlinessDelta: Math.max(option.friendlinessDelta, boostTo),
    };
  });
}
