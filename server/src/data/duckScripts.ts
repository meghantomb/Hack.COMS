import type { Conversation, DialogueNode, DialogueOption, Minigame } from "@duck-dating/shared";
import { allMinigameRecords } from "@duck-dating/shared";
import { ryanConversations, ryanNodes, ryanOptions } from "./ryanContent";
import { jeremyConversations, jeremyNodes, jeremyOptions } from "./jeremyContent";
import {
  samConversations,
  samNodes,
  samOptions,
  shoreNodes,
  shoreOptions,
} from "./sampleContent";
import { xanderConversations, xanderNodes, xanderOptions } from "./xanderContent";

/** One duck's authored route. An empty script is skipped at seed time. */
export interface DuckScript {
  id: string;
  conversations: Conversation[];
  nodes: DialogueNode[];
  options: DialogueOption[];
  minigames: Minigame[];
}

const catalog = allMinigameRecords();

export const duckScripts: DuckScript[] = [
  {
    id: "sam",
    conversations: samConversations,
    nodes: samNodes,
    options: samOptions,
    minigames: [],
  },
  {
    id: "xander",
    conversations: xanderConversations,
    nodes: xanderNodes,
    options: xanderOptions,
    minigames: [],
  },
  {
    id: "ryan",
    conversations: ryanConversations,
    nodes: ryanNodes,
    options: ryanOptions,
    minigames: [],
  },
  {
    id: "jeremy",
    conversations: jeremyConversations,
    nodes: jeremyNodes,
    options: jeremyOptions,
    minigames: [],
  },
];

export const sampleConversations = duckScripts.flatMap((script) => script.conversations);
export const sampleNodes = [...shoreNodes, ...duckScripts.flatMap((script) => script.nodes)];
export const sampleOptions = [...shoreOptions, ...duckScripts.flatMap((script) => script.options)];
/** Full playable catalog (signatures + random pool). */
export const sampleMinigames = catalog;

export { shoreNodes, shoreOptions };
