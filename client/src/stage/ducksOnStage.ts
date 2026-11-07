import type { DialogueBundle } from "@duck-dating/shared";
import type { StageDuck } from "./layoutStage";

/**
 * Who is standing on stage for this scene.
 * Today that is the speaking duck, on the right.
 * A bundle can later send `onStage` with more than one duck; the bread then stands in the center.
 */
export function ducksOnStage(bundle: DialogueBundle, showDucks: boolean): StageDuck[] {
  if (!showDucks) return [];

  const byId = new Map(bundle.loveMeters.map((meter) => [meter.characterId, meter]));
  const presence =
    bundle.onStage && bundle.onStage.length > 0
      ? bundle.onStage
      : [{ characterId: bundle.character.id, side: "right" as const }];

  return presence.map((entry) => {
    const meter = byId.get(entry.characterId);
    const speaking = entry.characterId === bundle.character.id;
    return {
      id: entry.characterId,
      name: meter?.name ?? (speaking ? bundle.character.name : entry.characterId),
      spriteKey:
        meter?.spriteKey ?? (speaking ? bundle.character.spriteKey : entry.characterId),
      side: entry.side,
    };
  });
}
