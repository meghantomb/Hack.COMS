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

export interface DialogueNode {
  id: string;
  characterId: string;
  speaker: string;
  text: string;
  backgroundKey: string;
  spriteExpression: string;
  isEnding: boolean;
  endingType: "friendship" | "romance" | null;
}

export interface DialogueOption {
  id: string;
  nodeId: string;
  text: string;
  nextNodeId: string;
  friendlinessDelta: number;
  requiredTier: FriendlinessTier | null;
  minigameId: string | null;
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
  flags: Record<string, boolean>;
  updatedAt: string;
}

export interface LoveMeter {
  characterId: string;
  name: string;
  spriteKey: string;
  friendliness: number;
}

export interface DialogueBundle {
  node: DialogueNode;
  options: DialogueOption[];
  character: Character;
  friendliness: number;
  tier: FriendlinessTier;
  /** Love bars for all ducks (four slots). */
  loveMeters: LoveMeter[];
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
export const START_NODE_ID = "pond_meet";
