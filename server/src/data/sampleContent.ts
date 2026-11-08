import type {
  Character,
  Conversation,
  DialogueNode,
  DialogueOption,
  Minigame,
} from "@duck-dating/shared";
import { xanderConversations, xanderNodes, xanderOptions } from "./xanderContent";

/**
 * Four duck slots. Art files (flat under client/public/assets/ducks/):
 *   {spriteKey}_left.png  /  {spriteKey}_right.png
 */
export const sampleCharacters: Character[] = [
  {
    id: "jock",
    name: "Ryan",
    personality:
      "Energetic and competitive; always organizing races around the reeds and daring others to keep up. Deep down, he is sensitive and cares deeply about his friends. He tries to keep everyone happy, even if it means sacrificing his own needs. But he tends to keep up that happy go lucky jock persona.",
    spriteKey: "jock",
    description: "Art: ducks/jock_left.png & jock_right.png",
  },
  {
    id: "breadluvr",
    name: "Sam",
    personality:
      "A bread obsessed duck who is infatuated with you and always wants to be with and around you. He also wants to eat you and is borderline dangerous and creepy at times.",
    spriteKey: "breadluvr",
    description: "Art: ducks/breadluvr_left.png & breadluvr_right.png",
  },
  {
    id: "badboy",
    name: "Xander",
    personality:
      "Broody loner energy; acts cool by the deep end but notices every glance. He has a reputation for being hard to get to know. He can be quite charming once you break through his defenses, but it takes work to even get through those defenses. He never lets anyone see his true self easily. When things get hard, he gets into alot of fights and has even been arrested a few times.",
    spriteKey: "badboy",
    description: "Art: ducks/badboy_left.png & badboy_right.png",
  },
  {
    id: "artist",
    name: "Jeremy",
    personality:
      "Quiet observer who sketches from the shadows and notices everything you almost said. A true artist at heart. Writes poetry and paints with equal passion. Artist is looking for inspiration in the world around him, and you might be his next muse.",
    spriteKey: "artist",
    description: "Art: ducks/artist_left.png & artist_right.png",
  },
];

export const sampleCharacter = sampleCharacters.find((c) => c.id === "breadluvr")!;

export const sampleMinigame: Minigame = {
  id: "lily_pad_hop",
  name: "Lily Pad Hop",
  description: "Hop across lily pads without falling into the pond.",
  phaserKey: "LilyPadHop",
};

export const SAM_CONVERSATION_ID = "sam_first_meeting";

export const sampleConversations: Conversation[] = [
  {
    id: SAM_CONVERSATION_ID,
    characterId: "breadluvr",
    title: "Sam at the pond",
    sortOrder: 0,
    maxExchanges: 20,
  },
  ...xanderConversations,
];

function line(
  node: Omit<
    DialogueNode,
    "conversationId" | "endingType" | "minFriendliness" | "guestCharacterId" | "variantGroup"
  > &
    Partial<
      Pick<
        DialogueNode,
        "conversationId" | "endingType" | "minFriendliness" | "guestCharacterId" | "variantGroup"
      >
    >
): DialogueNode {
  return {
    conversationId: SAM_CONVERSATION_ID,
    endingType: "bad",
    minFriendliness: 0,
    guestCharacterId: null,
    variantGroup: null,
    ...node,
  };
}

function reply(
  option: Omit<DialogueOption, "minFriendliness" | "continuesConversation" | "minigameId" | "requiredTier"> &
    Partial<Pick<DialogueOption, "minFriendliness" | "continuesConversation" | "minigameId" | "requiredTier">>
): DialogueOption {
  return {
    minFriendliness: 0,
    continuesConversation: false,
    minigameId: null,
    requiredTier: null,
    ...option,
  };
}

export const sampleNodes: DialogueNode[] = [
  line({
    id: "pond_shore",
    characterId: "breadluvr",
    conversationId: null,
    speaker: "Narrator",
    text: "The hill ends at the campus pond. One duck waits in the sun, already staring like he has been hungry for you his whole life. At the far bank, another sits in the dark and pretends he has not seen you roll in.",
    backgroundKey: "pond",
    spriteExpression: "neutral",
    isEnding: false,
    guestCharacterId: "badboy",
  }),
  line({
    id: "pond_meet",
    characterId: "breadluvr",
    speaker: "Narrator",
    text: "You tumble out of the reeds, still warm from the kitchen. A yellow duck is already staring. He looks at you the way someone looks at a meal they have decided to marry.",
    backgroundKey: "pond",
    spriteExpression: "neutral",
    isEnding: false,
  }),
  line({
    id: "breadluvr_hello",
    characterId: "breadluvr",
    speaker: "Sam",
    text: "Oh. You're real. I'm Sam. Don't roll away. I can smell the crust from here, and I am trying so hard to be normal about it.",
    backgroundKey: "pond",
    spriteExpression: "shy",
    isEnding: false,
  }),
  line({
    id: "small_talk",
    characterId: "breadluvr",
    speaker: "Sam",
    text: "I won't eat you. I'll sit in the sun with you and think about eating you, which is different, because I love you. I think I love you. We just met.",
    backgroundKey: "pond",
    spriteExpression: "neutral",
    isEnding: false,
  }),
  line({
    id: "invite_hop",
    characterId: "breadluvr",
    speaker: "Sam",
    text: "Lily pads go out to the island. Come with me. If the others see you they'll want a bite, and I want you all to myself. Hop?",
    backgroundKey: "pond",
    spriteExpression: "hopeful",
    isEnding: false,
  }),
  line({
    id: "after_hop_win",
    characterId: "breadluvr",
    speaker: "Sam",
    text: "You came. Nobody else gets you. My stomach hurts in the nice way. Sit in the sun with me. Just us.",
    backgroundKey: "pond",
    spriteExpression: "happy",
    isEnding: false,
  }),
  line({
    id: "after_decline",
    characterId: "breadluvr",
    speaker: "Sam",
    text: "Fine. I'll sit on my wings. See? Gentle. I can be gentle while I memorize how you'd crisp.",
    backgroundKey: "pond",
    spriteExpression: "sad",
    isEnding: false,
  }),
  line({
    id: "deeper_chat",
    characterId: "breadluvr",
    speaker: "Sam",
    text: "Be honest. If I love you the way I love bread — all the way through — would you let me?",
    backgroundKey: "pond",
    spriteExpression: "shy",
    isEnding: false,
  }),
  line({
    id: "ending_friendship",
    characterId: "breadluvr",
    speaker: "Sam",
    text: "The fondness never sticks. Hunger does. Sam looks up, and the other three ducks are already around you. They eat you together, and nobody pretends it was love.",
    backgroundKey: "pond_sunset",
    spriteExpression: "neutral",
    isEnding: true,
    endingType: "bad",
  }),
  line({
    id: "ending_romance",
    characterId: "breadluvr",
    speaker: "Sam",
    text: "Sam turns you in the sun until your crust is gold. He is crying and smiling. \"I love you,\" he says, and then he eats you, carefully, like a vow.",
    backgroundKey: "pond_sunset",
    spriteExpression: "love",
    isEnding: true,
    endingType: "good",
    minFriendliness: 60,
  }),
  ...xanderNodes,
];

export const sampleOptions: DialogueOption[] = [
  reply({
    id: "opt_shore_sam",
    nodeId: "pond_shore",
    text: "Roll toward the duck in the sun.",
    nextNodeId: "pond_meet",
    friendlinessDelta: 0,
    sortOrder: 0,
  }),
  reply({
    id: "opt_shore_xander",
    nodeId: "pond_shore",
    text: "Roll toward the duck at the deep end.",
    nextNodeId: "xander_deep_end_meet",
    friendlinessDelta: 0,
    sortOrder: 1,
  }),
  reply({
    id: "opt_approach",
    nodeId: "pond_meet",
    text: "Roll closer and say hello.",
    nextNodeId: "breadluvr_hello",
    friendlinessDelta: 6,
    sortOrder: 0,
  }),
  reply({
    id: "opt_wave",
    nodeId: "pond_meet",
    text: "Wave. Your crust flexes. He makes a small, hungry sound.",
    nextNodeId: "breadluvr_hello",
    friendlinessDelta: 8,
    sortOrder: 1,
  }),
  reply({
    id: "opt_like_ponds",
    nodeId: "breadluvr_hello",
    text: "The pond feels safer than the kitchen. Can I stay by you?",
    nextNodeId: "small_talk",
    friendlinessDelta: 12,
    sortOrder: 0,
  }),
  reply({
    id: "opt_poetry",
    nodeId: "breadluvr_hello",
    text: "You look hungry. Should I be worried?",
    nextNodeId: "small_talk",
    friendlinessDelta: 4,
    sortOrder: 1,
  }),
  reply({
    id: "opt_awkward",
    nodeId: "breadluvr_hello",
    text: "Please stop looking at me like lunch.",
    nextNodeId: "small_talk",
    friendlinessDelta: -2,
    sortOrder: 2,
  }),
  reply({
    id: "opt_not_silly",
    nodeId: "small_talk",
    text: "That's sweet. And terrifying. I'll stay.",
    nextNodeId: "invite_hop",
    friendlinessDelta: 14,
    sortOrder: 0,
  }),
  reply({
    id: "opt_encourage",
    nodeId: "small_talk",
    text: "Then stay close. If you're going to love me, I want the gentle version.",
    nextNodeId: "invite_hop",
    friendlinessDelta: 18,
    requiredTier: "acquaintance",
    minFriendliness: 20,
    sortOrder: 1,
  }),
  reply({
    id: "opt_hop_yes",
    nodeId: "invite_hop",
    text: "I'll hop. Stay where I can see you.",
    nextNodeId: "after_hop_win",
    friendlinessDelta: 20,
    minigameId: "lily_pad_hop",
    sortOrder: 0,
  }),
  reply({
    id: "opt_hop_no",
    nodeId: "invite_hop",
    text: "I'm staying on the shore. You can sit. Not nibble.",
    nextNodeId: "after_decline",
    friendlinessDelta: 2,
    sortOrder: 1,
  }),
  reply({
    id: "opt_safer",
    nodeId: "after_hop_win",
    text: "I like being the one you chose.",
    nextNodeId: "deeper_chat",
    friendlinessDelta: 16,
    sortOrder: 0,
  }),
  reply({
    id: "opt_race_heart",
    nodeId: "after_hop_win",
    text: "Your stomach metaphor needs work.",
    nextNodeId: "deeper_chat",
    friendlinessDelta: 6,
    sortOrder: 1,
  }),
  reply({
    id: "opt_sit",
    nodeId: "after_decline",
    text: "Sitting is enough. Keep your beak to yourself.",
    nextNodeId: "deeper_chat",
    friendlinessDelta: 8,
    sortOrder: 0,
  }),
  reply({
    id: "opt_apologize",
    nodeId: "after_decline",
    text: "Sorry. The hop looked like a trap.",
    nextNodeId: "deeper_chat",
    friendlinessDelta: 4,
    sortOrder: 1,
  }),
  reply({
    id: "opt_mean_it",
    nodeId: "deeper_chat",
    text: "If it's love, then yes. Do it kindly.",
    nextNodeId: "ending_romance",
    friendlinessDelta: 15,
    requiredTier: "crush",
    minFriendliness: 60,
    sortOrder: 0,
  }),
  reply({
    id: "opt_friends",
    nodeId: "deeper_chat",
    text: "I don't want to be eaten. Not even sweetly.",
    nextNodeId: "ending_friendship",
    friendlinessDelta: 2,
    sortOrder: 1,
  }),
  reply({
    id: "opt_honest_warm",
    nodeId: "deeper_chat",
    text: "I trust you. That still doesn't mean I'm dinner.",
    nextNodeId: "ending_friendship",
    friendlinessDelta: 8,
    requiredTier: "friend",
    minFriendliness: 40,
    sortOrder: 2,
  }),
  ...xanderOptions,
];
