import { duckSrc, playerSrc } from "../assets/manifest";
import { SpriteImage } from "./SpriteImage";

/**
 * DDLC-style staging: player left (faces right), duck right (faces left).
 * Duck art: `{id}_left.png` / `{id}_right.png` in `public/assets/ducks/`.
 */
export function CharacterStage({
  duckName,
  duckSpriteKey,
  showDuck = true,
}: {
  duckName: string;
  duckSpriteKey: string;
  showDuck?: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[22%] top-[8%] z-10 flex items-end justify-between px-2 sm:px-8">
      <div className="flex h-full w-[42%] max-w-md items-end justify-center">
        <SpriteImage
          src={playerSrc("right")}
          alt="You"
          className="max-h-full w-auto max-w-full object-contain object-bottom drop-shadow-lg"
          placeholderClassName="flex h-[70%] w-full max-w-[280px] items-end justify-center rounded-t-[40%] bg-pond-mid/40"
        />
      </div>

      {showDuck && (
        <div className="flex h-full w-[42%] max-w-md items-end justify-center">
          <SpriteImage
            src={duckSrc(duckSpriteKey, "left")}
            alt={duckName}
            className="max-h-full w-auto max-w-full object-contain object-bottom drop-shadow-lg"
            placeholderClassName="flex h-[70%] w-full max-w-[280px] items-end justify-center rounded-t-[40%] bg-pond-reed/35"
          />
        </div>
      )}
    </div>
  );
}
