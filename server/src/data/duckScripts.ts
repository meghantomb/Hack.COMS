import type { Conversation, DialogueNode, DialogueOption, Minigame } from "@duck-dating/shared";
import { reedRaceMinigame, ryanConversations, ryanNodes, ryanOptions } from "./ryanContent";
import { jeremyConversations, jeremyMinigames, jeremyNodes, jeremyOptions } from "./jeremyContent";
import {
  samConversations,
  samNodes,
  samOptions,
  sampleMinigame,
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

export const duckScripts: DuckScript[] = [
  {
    id: "sam",
    conversations: samConversations,
    nodes: samNodes,
    options: samOptions,
    minigames: [sampleMinigame],
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
    minigames: [reedRaceMinigame],
  },
  {
    id: "jeremy",
    conversations: jeremyConversations,
    nodes: jeremyNodes,
    options: jeremyOptions,
    minigames: jeremyMinigames,
  },
];

export const sampleConversations = duckScripts.flatMap((script) => script.conversations);
export const sampleNodes = [...shoreNodes, ...duckScripts.flatMap((script) => script.nodes)];
export const sampleOptions = [...shoreOptions, ...duckScripts.flatMap((script) => script.options)];
export const sampleMinigames = duckScripts.flatMap((script) => script.minigames);

export { shoreNodes, shoreOptions };
