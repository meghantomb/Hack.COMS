import type { ReactNode } from "react";
import { duckSrc, playerSrc } from "../assets/manifest";
import type { StageLayout } from "../stage/layoutStage";
import { SpriteImage } from "./SpriteImage";

/**
 * One duck: bread on the opposite side, large.
 * Two–three ducks: bread in the center, large.
 * Four ducks: overlapping crowd, smaller.
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
  const count = layout.ducks.length;

  const crowd = count >= 4 && layout.playerSide === "center";
  /** 2–3 figures on screen (bread + 1–2 ducks), or 3 ducks — keep them big. */
  const large = count >= 1 && count <= 3;

  if (crowd) {
    const row = [
      ...left.map((duck) => ({ kind: "duck" as const, duck })),
      { kind: "bread" as const },
      ...right.map((duck) => ({ kind: "duck" as const, duck })),
    ];
    return (
      <div className="flex h-full min-h-0 w-full items-end justify-center overflow-visible px-1 pb-0">
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

  const spaced = count >= 2;

  return (
    <div className="flex h-full min-h-0 w-full items-end overflow-visible px-2 pb-0 sm:px-6">
      <Zone spaced={spaced}>
        {layout.playerSide === "left" && (
          <Player facing={layout.playerFacing} fit={spaced || large} large={large} />
        )}
        {showDucks &&
          left.map((duck) => (
            <DuckSprite key={duck.id} duck={duck} fit={spaced || large} large={large} />
          ))}
      </Zone>
      <Zone spaced={spaced}>
        {layout.playerSide === "center" && (
          <Player facing={layout.playerFacing} fit={spaced || large} large={large} />
        )}
      </Zone>
      <Zone spaced={spaced}>
        {showDucks &&
          right.map((duck) => (
            <DuckSprite key={duck.id} duck={duck} fit={spaced || large} large={large} />
          ))}
        {layout.playerSide === "right" && (
          <Player facing={layout.playerFacing} fit={spaced || large} large={large} />
        )}
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
          : "relative flex h-full min-w-0 flex-1 items-end justify-center"
      }
    >
      {children}
    </div>
  );
}

const crowdSpriteClass = "h-full w-auto max-w-none object-contain object-bottom";

/** Default fit inside a zone. */
const fitSpriteClass =
  "absolute bottom-0 left-1/2 h-auto w-auto max-h-full max-w-[calc(100%-4vw)] -translate-x-1/2 object-contain object-bottom origin-bottom";

/** Bigger when only a few characters share the stage. */
const largeSpriteClass =
  "absolute bottom-0 left-1/2 h-auto w-auto max-h-[125%] max-w-[min(100%,52vw)] -translate-x-1/2 scale-110 object-contain object-bottom origin-bottom";

function Player({
  facing,
  overlap = false,
  fit = false,
  large = false,
}: {
  facing: "left" | "right";
  overlap?: boolean;
  fit?: boolean;
  large?: boolean;
}) {
  const spriteClass = !fit && !large
    ? crowdSpriteClass
    : large
      ? largeSpriteClass
      : fitSpriteClass;

  return (
    <div
      className={
        fit || large
          ? "contents"
          : `z-10 flex h-full shrink-0 items-end justify-center ${overlap ? "-ml-[4vw]" : ""}`
      }
    >
      <SpriteImage
        src={playerSrc(facing)}
        alt="You"
        className={spriteClass}
        placeholderClassName={
          fit || large
            ? "absolute bottom-0 left-1/2 flex h-4/5 w-[calc(100%-4vw)] -translate-x-1/2 items-end justify-center rounded-t-[40%] bg-pond-mid/40"
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
  large = false,
}: {
  duck: { id: string; name: string; spriteKey: string; facing: "left" | "right" };
  overlap?: boolean;
  fit?: boolean;
  large?: boolean;
}) {
  const spriteClass = !fit && !large
    ? crowdSpriteClass
    : large
      ? largeSpriteClass
      : fitSpriteClass;

  return (
    <div
      className={
        fit || large
          ? "contents"
          : `flex h-full shrink-0 items-end justify-center ${overlap ? "-ml-[4vw]" : ""}`
      }
    >
      <SpriteImage
        src={duckSrc(duck.spriteKey, duck.facing)}
        alt={duck.name}
        className={spriteClass}
        placeholderClassName={
          fit || large
            ? "absolute bottom-0 left-1/2 flex h-4/5 w-[calc(100%-4vw)] -translate-x-1/2 items-end justify-center rounded-t-[40%] bg-pond-reed/35"
            : "flex h-full w-36 items-end justify-center rounded-t-[40%] bg-pond-reed/35"
        }
      />
    </div>
  );
}
