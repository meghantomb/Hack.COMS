import type { DialogueOption, FriendlinessTier } from "@duck-dating/shared";

export interface MinigameChoice {
  nodeId: string;
  id: string;
  text: string;
}

/**
 * Add exactly one launching reply on nodes that do not already have one.
 * The reply continues to the same line as an existing reply, so a win is not a dead end.
 * An ungated reply is preferred. If every reply is gated, the new one keeps that gate
 * so a minigame cannot skip a closeness check.
 */
export function attachMinigameChoices(
  options: DialogueOption[],
  minigameId: string,
  additions: MinigameChoice[]
): DialogueOption[] {
  const extra: DialogueOption[] = [];
  for (const add of additions) {
    const onNode = options.filter((option) => option.nodeId === add.nodeId);
    if (onNode.length === 0) {
      throw new Error(`No replies on ${add.nodeId}`);
    }
    if (onNode.some((option) => option.minigameId)) continue;
    const open = onNode.find(
      (option) =>
        !option.requiresMinigameWin &&
        !option.requiredTier &&
        option.minFriendliness === 0 &&
        !option.continuesConversation
    );
    const anchor =
      open ??
      onNode.find((option) => !option.requiresMinigameWin && !option.continuesConversation);
    if (!anchor) {
      throw new Error(`No reply to continue from ${add.nodeId}`);
    }
    extra.push({
      id: add.id,
      nodeId: add.nodeId,
      text: add.text,
      nextNodeId: anchor.nextNodeId,
      friendlinessDelta: open ? 12 : anchor.friendlinessDelta,
      requiredTier: (open ? null : anchor.requiredTier) as FriendlinessTier | null,
      minFriendliness: open ? 0 : anchor.minFriendliness,
      minigameId,
      requiresMinigameWin: false,
      continuesConversation: false,
      sortOrder: Math.max(...onNode.map((option) => option.sortOrder)) + 1,
    });
  }
  return [...options, ...extra];
}
