import {
  START_NODE_ID,
  type ConversationBookmarks,
  type EndingType,
  type FriendlinessTier,
} from "./types";

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
 * A new real conversation with the same duck adds to the streak. A different duck clears it.
 * A hub line has a character but no conversation id (the shore). Moving between that hub
 * and a visit does not count as one of the duck's consecutive conversations, and it clears
 * the streak. Only real visit-to-visit hops with the same duck add to it, so the cap in
 * optionIsAvailable still stops a fourth continue after three real conversations.
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
  const bothRealConversations =
    input.currentConversationId !== null && input.nextConversationId !== null;

  if (input.nextIsEnding || sameConversation) {
    return {
      exchangeCount: input.nextIsEnding ? input.exchangeCount : input.exchangeCount + 1,
      consecutiveConversations: input.consecutiveConversations,
      endingType,
      conversationId: input.nextConversationId,
    };
  }

  if (sameCharacter && bothRealConversations) {
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

export function readBookmarks(value: unknown): ConversationBookmarks {
  let source = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source) as unknown;
    } catch {
      return {};
    }
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};
  const bookmarks: ConversationBookmarks = {};
  for (const [characterId, raw] of Object.entries(source as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const mark = raw as Record<string, unknown>;
    if (typeof mark.nodeId !== "string" || mark.nodeId === START_NODE_ID) continue;
    bookmarks[characterId] = {
      nodeId: mark.nodeId,
      conversationId: typeof mark.conversationId === "string" ? mark.conversationId : null,
      exchangeCount: typeof mark.exchangeCount === "number" ? mark.exchangeCount : 0,
      consecutiveConversations:
        typeof mark.consecutiveConversations === "number" ? mark.consecutiveConversations : 0,
    };
  }
  return bookmarks;
}

/** Remember a duck's place. The shore hub is not a place, even though Sam owns that node. */
export function rememberDuckPlace(
  bookmarks: ConversationBookmarks,
  place: {
    nodeId: string;
    characterId: string;
    conversationId: string | null;
    exchangeCount: number;
    consecutiveConversations: number;
  }
): ConversationBookmarks {
  if (place.nodeId === START_NODE_ID) return bookmarks;
  return {
    ...bookmarks,
    [place.characterId]: {
      nodeId: place.nodeId,
      conversationId: place.conversationId,
      exchangeCount: place.exchangeCount,
      consecutiveConversations: place.consecutiveConversations,
    },
  };
}

type ChoiceNodeSnap = {
  id: string;
  characterId: string;
  conversationId: string | null;
  isEnding: boolean;
  endingType: EndingType;
};

/**
 * Progress after one chosen reply.
 * Leaving a duck line stores that line for them. A shore choice reopens the saved line
 * for the duck that option introduces, with the counters from when the player left.
 * Resuming does not run the streak forward. A missing saved node uses the scripted line.
 */
export function applyChoiceProgress(input: {
  fromNodeId: string;
  fromCharacterId: string;
  fromConversationId: string | null;
  scriptedNext: ChoiceNodeSnap;
  /** Loaded saved node, when this choice leaves the shore and that node still exists. */
  resumeNode: ChoiceNodeSnap | null;
  progress: {
    exchangeCount: number;
    consecutiveConversations: number;
    endingType: EndingType;
    bookmarks: ConversationBookmarks;
  };
}): {
  currentNodeId: string;
  characterId: string;
  conversationId: string | null;
  exchangeCount: number;
  consecutiveConversations: number;
  endingType: EndingType;
  bookmarks: ConversationBookmarks;
  resumed: boolean;
} {
  let bookmarks = input.progress.bookmarks;
  if (input.fromNodeId !== START_NODE_ID) {
    bookmarks = rememberDuckPlace(bookmarks, {
      nodeId: input.fromNodeId,
      characterId: input.fromCharacterId,
      conversationId: input.fromConversationId,
      exchangeCount: input.progress.exchangeCount,
      consecutiveConversations: input.progress.consecutiveConversations,
    });
  }

  const saved =
    input.fromNodeId === START_NODE_ID
      ? bookmarks[input.scriptedNext.characterId]
      : undefined;
  const resumed = Boolean(saved && input.resumeNode);

  let currentNodeId: string;
  let characterId: string;
  let conversationId: string | null;
  let exchangeCount: number;
  let consecutiveConversations: number;
  let endingType: EndingType;

  if (resumed && saved && input.resumeNode) {
    currentNodeId = input.resumeNode.id;
    characterId = input.resumeNode.characterId;
    conversationId = saved.conversationId;
    exchangeCount = saved.exchangeCount;
    consecutiveConversations = saved.consecutiveConversations;
    endingType = input.resumeNode.isEnding
      ? input.resumeNode.endingType
      : input.progress.endingType;
  } else {
    const moved = advanceConversation({
      exchangeCount: input.progress.exchangeCount,
      consecutiveConversations: input.progress.consecutiveConversations,
      endingType: input.progress.endingType,
      currentConversationId: input.fromConversationId,
      currentCharacterId: input.fromCharacterId,
      nextConversationId: input.scriptedNext.conversationId,
      nextCharacterId: input.scriptedNext.characterId,
      nextIsEnding: input.scriptedNext.isEnding,
      nextEndingType: input.scriptedNext.endingType,
    });
    currentNodeId = input.scriptedNext.id;
    characterId = input.scriptedNext.characterId;
    conversationId = moved.conversationId;
    exchangeCount = moved.exchangeCount;
    consecutiveConversations = moved.consecutiveConversations;
    endingType = moved.endingType;
  }

  if (currentNodeId !== START_NODE_ID) {
    bookmarks = rememberDuckPlace(bookmarks, {
      nodeId: currentNodeId,
      characterId,
      conversationId,
      exchangeCount,
      consecutiveConversations,
    });
  }

  return {
    currentNodeId,
    characterId,
    conversationId,
    exchangeCount,
    consecutiveConversations,
    endingType,
    bookmarks,
    resumed,
  };
}
