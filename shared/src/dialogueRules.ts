import type { EndingType, FriendlinessTier } from "./types";

export const MAX_CONSECUTIVE_CONVERSATIONS = 3;
export const DEFAULT_MAX_EXCHANGES = 20;

const TIER_ORDER: FriendlinessTier[] = [
  "stranger",
  "acquaintance",
  "friend",
  "crush",
  "romance",
];

export function meetsTier(current: FriendlinessTier, required: FriendlinessTier | null) {
  if (!required) return true;
  return TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(required);
}

export function minigameFlag(minigameId: string) {
  return `minigame:${minigameId}`;
}

/** True once any minigame win has been stored on the save. */
export function hasClearedMinigame(flags: Record<string, boolean> | null | undefined) {
  if (!flags) return false;
  return Object.entries(flags).some(([key, on]) => on && key.startsWith("minigame:"));
}

/** Whether this reply may be shown for the current closeness and conversation. */
export function optionIsAvailable(input: {
  minFriendliness: number;
  requiredTier: FriendlinessTier | null;
  continuesConversation: boolean;
  requiresMinigameWin: boolean;
  minigameCleared: boolean;
  nextMinFriendliness: number;
  friendliness: number;
  tier: FriendlinessTier;
  staysInConversation: boolean;
  exchangeCount: number;
  maxExchanges: number;
  consecutiveConversations: number;
}): boolean {
  if (input.friendliness < input.minFriendliness) return false;
  if (input.friendliness < input.nextMinFriendliness) return false;
  if (!meetsTier(input.tier, input.requiredTier)) return false;
  if (input.requiresMinigameWin && !input.minigameCleared) return false;
  if (
    input.continuesConversation &&
    input.consecutiveConversations >= MAX_CONSECUTIVE_CONVERSATIONS
  ) {
    return false;
  }
  if (input.staysInConversation && input.exchangeCount >= input.maxExchanges) return false;
  return true;
}

/**
 * Move the save forward one reply.
 * Ending type stays bad until the line landed on is an ending that says otherwise.
 * A new conversation with the same duck adds to the streak. A different duck clears it.
 */
export function advanceConversation(input: {
  exchangeCount: number;
  consecutiveConversations: number;
  endingType: EndingType;
  currentConversationId: string | null;
  currentCharacterId: string;
  nextConversationId: string | null;
  nextCharacterId: string;
  nextIsEnding: boolean;
  nextEndingType: EndingType;
}): {
  exchangeCount: number;
  consecutiveConversations: number;
  endingType: EndingType;
  conversationId: string | null;
} {
  const endingType = input.nextIsEnding ? input.nextEndingType : input.endingType;
  const sameConversation = input.nextConversationId === input.currentConversationId;
  const sameCharacter = input.nextCharacterId === input.currentCharacterId;

  if (input.nextIsEnding || sameConversation) {
    return {
      exchangeCount: input.nextIsEnding ? input.exchangeCount : input.exchangeCount + 1,
      consecutiveConversations: input.consecutiveConversations,
      endingType,
      conversationId: input.nextConversationId,
    };
  }

  if (sameCharacter) {
    return {
      exchangeCount: 0,
      consecutiveConversations: input.consecutiveConversations + 1,
      endingType,
      conversationId: input.nextConversationId,
    };
  }

  return {
    exchangeCount: 0,
    consecutiveConversations: 0,
    endingType,
    conversationId: input.nextConversationId,
  };
}
