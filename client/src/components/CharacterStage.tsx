import type { ReactNode } from "react";
import { duckSrc, playerSrc } from "../assets/manifest";
import type { StageLayout } from "../stage/layoutStage";
import { SpriteImage } from "./SpriteImage";

/**
 * One duck: bread on the opposite side, normal spacing.
 * Two ducks: bread in the center, one duck on each side, normal spacing.
 * Four ducks: bread in the center, ducks overlapping so they fit.
 */
export function CharacterStage({
  layout,
  showDucks = true,
}: {
  layout: StageLayout;
  showDucks?: boolean;
}) {
  const left = layout.ducks.filter((duck) => duck.side === "left");
  const right = layout.ducks.filter((duck) => duck.side === "right");

  const crowd = layout.ducks.length >= 4 && layout.playerSide === "center";

  if (crowd) {
    const row = [
      ...left.map((duck) => ({ kind: "duck" as const, duck })),
      { kind: "bread" as const },
      ...right.map((duck) => ({ kind: "duck" as const, duck })),
    ];
    return (
      <div className="flex h-full min-h-0 w-full items-end justify-center overflow-visible px-1 pb-2">
        <div className="flex h-[min(100%,28vw)] items-end justify-center">
          {row.map((entry, index) =>
            entry.kind === "bread" ? (
              <Player key="bread" facing={layout.playerFacing} overlap={index > 0} />
            ) : (
              <DuckSprite key={entry.duck.id} duck={entry.duck} overlap={index > 0} />
            )
          )}
        </div>
      </div>
    );
  }

  const spaced = layout.ducks.length === 2;

  return (
    <div className="flex h-full min-h-0 w-full items-end overflow-visible px-2 pb-2 sm:px-8">
      <Zone spaced={spaced}>
        {layout.playerSide === "left" && <Player facing={layout.playerFacing} fit={spaced} />}
        {showDucks && left.map((duck) => <DuckSprite key={duck.id} duck={duck} fit={spaced} />)}
      </Zone>
      <Zone spaced={spaced}>
        {layout.playerSide === "center" && (
          <Player facing={layout.playerFacing} fit={spaced} />
        )}
      </Zone>
      <Zone spaced={spaced}>
        {showDucks && right.map((duck) => <DuckSprite key={duck.id} duck={duck} fit={spaced} />)}
        {layout.playerSide === "right" && <Player facing={layout.playerFacing} fit={spaced} />}
      </Zone>
    </div>
  );
}

function Zone({ children, spaced }: { children: ReactNode; spaced: boolean }) {
  return (
    <div
      className={
        spaced
          ? "relative h-full min-h-0 min-w-0 flex-1"
          : "flex h-full min-w-0 flex-1 items-end justify-center"
      }
    >
      {children}
    </div>
  );
}

const crowdSpriteClass = "h-full w-auto max-w-none object-contain object-bottom";
/** Fits the zone and keeps a clear gap from the neighbors. The box is the painted sprite. */
const fitSpriteClass =
  "absolute bottom-0 left-1/2 h-auto w-auto max-h-full max-w-[calc(100%-5vw)] -translate-x-1/2 object-contain object-bottom";

function Player({
  facing,
  overlap = false,
  fit = false,
}: {
  facing: "left" | "right";
  overlap?: boolean;
  fit?: boolean;
}) {
  return (
    <div
      className={
        fit
          ? "contents"
          : `z-10 flex h-full shrink-0 items-end justify-center ${overlap ? "-ml-[4vw]" : ""}`
      }
    >
      <SpriteImage
        src={playerSrc(facing)}
        alt="You"
        className={fit ? fitSpriteClass : crowdSpriteClass}
        placeholderClassName={
          fit
            ? "absolute bottom-0 left-1/2 flex h-4/5 w-[calc(100%-5vw)] -translate-x-1/2 items-end justify-center rounded-t-[40%] bg-pond-mid/40"
            : "flex h-full w-40 items-end justify-center rounded-t-[40%] bg-pond-mid/40"
        }
      />
    </div>
  );
}

function DuckSprite({
  duck,
  overlap = false,
  fit = false,
}: {
  duck: { id: string; name: string; spriteKey: string; facing: "left" | "right" };
  overlap?: boolean;
  fit?: boolean;
}) {
  return (
    <div
      className={
        fit
          ? "contents"
          : `flex h-full shrink-0 items-end justify-center ${overlap ? "-ml-[4vw]" : ""}`
      }
    >
      <SpriteImage
        src={duckSrc(duck.spriteKey, duck.facing)}
        alt={duck.name}
        className={fit ? fitSpriteClass : crowdSpriteClass}
        placeholderClassName={
          fit
            ? "absolute bottom-0 left-1/2 flex h-4/5 w-[calc(100%-5vw)] -translate-x-1/2 items-end justify-center rounded-t-[40%] bg-pond-reed/35"
            : "flex h-full w-36 items-end justify-center rounded-t-[40%] bg-pond-reed/35"
        }
      />
    </div>
  );
}
