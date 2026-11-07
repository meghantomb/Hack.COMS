import type { LoveMeter } from "@duck-dating/shared";
import { getFriendlinessLabel } from "@duck-dating/shared";
import { duckPortraitSrc } from "../assets/manifest";
import { SpriteImage } from "./SpriteImage";

export function LoveMeters({
  meters,
  activeCharacterId,
}: {
  meters: LoveMeter[];
  activeCharacterId: string;
}) {
  return (
    <div className="absolute left-3 top-3 z-20 flex w-[min(100%,16rem)] flex-col gap-2 sm:left-4 sm:top-4">
      <p className="font-display text-xs uppercase tracking-widest text-pond-light/80">
        Love
      </p>
      {meters.map((m) => {
        const active = m.characterId === activeCharacterId;
        return (
          <div
            key={m.characterId}
            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 backdrop-blur-sm ${
              active
                ? "border-pond-sunset/60 bg-pond-ink/80"
                : "border-pond-light/15 bg-pond-ink/55"
            }`}
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-pond-deep/80">
              <SpriteImage
                src={duckPortraitSrc(m.spriteKey)}
                alt={m.name}
                className="h-full w-full object-cover object-top"
                placeholderClassName="flex h-full w-full items-center justify-center bg-pond-mid/50 text-[9px] text-pond-foam"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-1">
                <p className="truncate font-display text-sm text-pond-foam">{m.name}</p>
                <p className="shrink-0 text-[10px] text-pond-light">
                  {getFriendlinessLabel(m.friendliness)}
                </p>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-pond-deep">
                <div
                  className="h-full rounded-full bg-pond-sunset transition-all duration-500"
                  style={{ width: `${m.friendliness}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
