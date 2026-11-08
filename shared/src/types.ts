export type FriendlinessTier =
  | "stranger"
  | "acquaintance"
  | "friend"
  | "crush"
  | "romance";

export const FRIENDLINESS_TIERS: {
  id: FriendlinessTier;
  label: string;
  min: number;
  max: number;
}[] = [
  { id: "stranger", label: "Stranger", min: 0, max: 19 },
  { id: "acquaintance", label: "Acquaintance", min: 20, max: 39 },
  { id: "friend", label: "Friend", min: 40, max: 59 },
  { id: "crush", label: "Crush", min: 60, max: 79 },
  { id: "romance", label: "Romance", min: 80, max: 100 },
];

export function getFriendlinessTier(value: number): FriendlinessTier {
  const clamped = Math.max(0, Math.min(100, value));
  const tier = FRIENDLINESS_TIERS.find((t) => clamped >= t.min && clamped <= t.max);
  return tier?.id ?? "stranger";
}

export function getFriendlinessLabel(value: number): string {
  const tier = getFriendlinessTier(value);
  return FRIENDLINESS_TIERS.find((t) => t.id === tier)?.label ?? "Stranger";
}

export interface Character {
  id: string;
  name: string;
  personality: string;
  spriteKey: string;
  description: string;
}

/** Good endings are set on purpose. Everything else stays bad. */
export type EndingType = "good" | "bad";

export interface Conversation {
  id: string;
  characterId: string;
  title: string;
  sortOrder: number;
  /** Player replies in this conversation before it must end. */
  maxExchanges: number;
}

export interface DialogueNode {
  id: string;
  characterId: string;
  conversationId: string | null;
  speaker: string;
  text: string;
  backgroundKey: string;
  spriteExpression: string;
  isEnding: boolean;
  /** Defaults to bad. A good ending is the line that changes it. */
  endingType: EndingType;
  /** This duck line is offered only once closeness reaches this score. */
  minFriendliness: number;
  /** Another duck standing in the scene. Bread moves to the center when set. */
  guestCharacterId: string | null;
  /** Alternate wordings of one beat. The option points at the line the player has earned. */
  variantGroup: string | null;
}

export interface DialogueOption {
  id: string;
  nodeId: string;
  text: string;
  nextNodeId: string;
  friendlinessDelta: number;
  requiredTier: FriendlinessTier | null;
  /** Exact closeness required before this reply is shown. */
  minFriendliness: number;
  minigameId: string | null;
  /** Starts another conversation with the same duck. Hidden after three in a row. */
  continuesConversation: boolean;
  sortOrder: number;
}

export interface Minigame {
  id: string;
  name: string;
  description: string;
  phaserKey: string;
}

export interface Relationship {
  playerId: string;
  characterId: string;
  friendliness: number;
}

export interface PlayerProgress {
  playerId: string;
  currentNodeId: string;
  characterId: string;
  conversationId: string | null;
  /** Replies already given in the current conversation. */
  exchangeCount: number;
  /** Finished conversations in a row with the duck they are still talking to. */
  consecutiveConversations: number;
  /** Stays bad until a good ending node changes it. */
  endingType: EndingType;
  flags: Record<string, boolean>;
  updatedAt: string;
}

export interface LoveMeter {
  characterId: string;
  name: string;
  spriteKey: string;
  friendliness: number;
}

/** A duck present in the current scene. Omit `side` and several ducks are split left and right. */
export interface StagePresence {
  characterId: string;
  side?: "left" | "right";
}

export interface DialogueBundle {
  node: DialogueNode;
  options: DialogueOption[];
  character: Character;
  friendliness: number;
  tier: FriendlinessTier;
  /** Love bars for all ducks (four slots). The stage shows a bar only for ducks in the scene. */
  loveMeters: LoveMeter[];
  /**
   * Ducks standing on stage. One duck: the bread stands on the other side.
   * More than one: the bread stands in the center.
   * Omit to show only `character` on the right.
   */
  onStage?: StagePresence[];
}

/** The four dateable duck IDs — art files: `{id}_left.png` / `{id}_right.png`. */
export const DUCK_CHARACTER_IDS = ["jock", "breadluvr", "badboy", "artist"] as const;


export interface ChoiceRequest {
  playerId: string;
  optionId: string;
  minigameWon?: boolean;
}

export interface ChoiceResult {
  success: boolean;
  reason?: string;
  friendliness: number;
  tier: FriendlinessTier;
  nextNodeId: string | null;
  unlocked: boolean;
}

export interface ProgressSaveRequest {
  playerId: string;
  currentNodeId: string;
  characterId: string;
  flags?: Record<string, boolean>;
}

export interface AiDialogueOption {
  text: string;
  friendlinessDelta: number;
  tone: string;
}

export interface AiGenerationRequest {
  characterId: string;
  sceneContext: string;
  tier: FriendlinessTier;
  count?: number;
}

export interface AiGenerationResult {
  options: AiDialogueOption[];
  source: "grok" | "mock";
}

export const DEFAULT_PLAYER_ID = "local-player";
export const SAMPLE_CHARACTER_ID = "breadluvr";
export const START_NODE_ID = "pond_shore";
