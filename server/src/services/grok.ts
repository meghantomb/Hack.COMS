import { z } from "zod";
import type {
  AiDialogueOption,
  AiGenerationResult,
  Character,
  FriendlinessTier,
} from "@duck-dating/shared";

const optionSchema = z.object({
  text: z.string().min(1).max(200),
  friendlinessDelta: z.number().int().min(-20).max(30),
  tone: z.string().min(1).max(40),
});

const batchSchema = z.object({
  options: z.array(optionSchema).min(1).max(8),
});

const MOCK_BY_TIER: Record<FriendlinessTier, AiDialogueOption[]> = {
  stranger: [
    { text: "Nice to meet you. This pond is peaceful.", friendlinessDelta: 6, tone: "polite" },
    { text: "Do you come here often?", friendlinessDelta: 4, tone: "curious" },
    { text: "I won't interrupt your writing for long.", friendlinessDelta: 5, tone: "gentle" },
  ],
  acquaintance: [
    { text: "Your reed headband suits you.", friendlinessDelta: 8, tone: "warm" },
    { text: "Tell me about your favorite ripple poem.", friendlinessDelta: 10, tone: "interested" },
    { text: "Want to share the bench?", friendlinessDelta: 7, tone: "friendly" },
  ],
  friend: [
    { text: "I saved a snack—half for you.", friendlinessDelta: 12, tone: "caring" },
    { text: "You make quiet mornings brighter.", friendlinessDelta: 14, tone: "sincere" },
    { text: "Race you to the willow tree—walk-race!", friendlinessDelta: 9, tone: "playful" },
  ],
  crush: [
    { text: "I keep thinking about our lily pad hop.", friendlinessDelta: 15, tone: "flirty" },
    { text: "Your smile could calm any storm.", friendlinessDelta: 16, tone: "romantic" },
    { text: "Can I walk you home after sunset?", friendlinessDelta: 14, tone: "hopeful" },
  ],
  romance: [
    { text: "I'd choose this pond—and you—every morning.", friendlinessDelta: 12, tone: "devoted" },
    { text: "Hold my wing a little longer?", friendlinessDelta: 10, tone: "tender" },
    { text: "Write a poem with me—about us.", friendlinessDelta: 11, tone: "intimate" },
  ],
};

export function mockGenerateDialogue(
  tier: FriendlinessTier,
  count = 3
): AiGenerationResult {
  const pool = MOCK_BY_TIER[tier];
  return {
    options: pool.slice(0, Math.min(count, pool.length)),
    source: "mock",
  };
}

export async function generateDialogueBatch(params: {
  character: Character;
  sceneContext: string;
  tier: FriendlinessTier;
  count?: number;
}): Promise<AiGenerationResult> {
  const count = params.count ?? 3;
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return mockGenerateDialogue(params.tier, count);
  }

  const base = process.env.XAI_API_BASE ?? "https://api.x.ai/v1";
  const model = process.env.XAI_MODEL ?? "grok-2-latest";

  const system = `You generate dialogue response OPTIONS for a duck dating visual novel.
Return ONLY valid JSON matching: {"options":[{"text":string,"friendlinessDelta":number,"tone":string}]}
Rules:
- ${count} options max
- text under 120 chars, second-person player lines spoken TO the character
- friendlinessDelta between -10 and 25
- match the friendliness tier tone: ${params.tier}
- do NOT invent new story branches or endings; these are flavor variations only`;

  const user = `Character: ${params.character.name}
Personality: ${params.character.personality}
Scene: ${params.sceneContext}
Tier: ${params.tier}
Count: ${count}`;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    console.warn(`Grok API error ${res.status}; falling back to mock`);
    return mockGenerateDialogue(params.tier, count);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return mockGenerateDialogue(params.tier, count);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.warn("Grok returned non-JSON; using mock");
    return mockGenerateDialogue(params.tier, count);
  }

  const validated = batchSchema.safeParse(parsed);
  if (!validated.success) {
    console.warn("Grok JSON failed validation; using mock", validated.error.message);
    return mockGenerateDialogue(params.tier, count);
  }

  return {
    options: validated.data.options.slice(0, count),
    source: "grok",
  };
}
