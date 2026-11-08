import type { ReactNode } from "react";
import { duckSrc, playerSrc } from "../assets/manifest";
import type { StageLayout } from "../stage/layoutStage";
import { SpriteImage } from "./SpriteImage";

/**
 * One duck: bread on the opposite side.
 * More than one: bread in the center, ducks on the sides they were given.
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

  return (
    <div className="flex h-full min-h-0 w-full items-end overflow-hidden px-2 pb-2 sm:px-8">
      <Zone>
        {layout.playerSide === "left" && <Player facing={layout.playerFacing} />}
        {showDucks && left.map((duck) => <DuckSprite key={duck.id} duck={duck} />)}
      </Zone>
      <Zone>
        {layout.playerSide === "center" && <Player facing={layout.playerFacing} />}
      </Zone>
      <Zone>
        {showDucks && right.map((duck) => <DuckSprite key={duck.id} duck={duck} />)}
        {layout.playerSide === "right" && <Player facing={layout.playerFacing} />}
      </Zone>
    </div>
  );
}

function Zone({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-w-0 flex-1 items-end justify-center gap-2">{children}</div>
  );
}

function Player({ facing }: { facing: "left" | "right" }) {
  return (
    <div className="flex h-full max-w-full items-end justify-center">
      <SpriteImage
        src={playerSrc(facing)}
        alt="You"
        className="max-h-full w-auto max-w-full object-contain object-bottom"
        placeholderClassName="flex h-[70%] w-full max-w-[240px] items-end justify-center rounded-t-[40%] bg-pond-mid/40"
      />
    </div>
  );
}

function DuckSprite({
  duck,
}: {
  duck: { id: string; name: string; spriteKey: string; facing: "left" | "right" };
}) {
  return (
    <div className="flex h-full max-w-full items-end justify-center">
      <SpriteImage
        src={duckSrc(duck.spriteKey, duck.facing)}
        alt={duck.name}
        className="max-h-full w-auto max-w-full object-contain object-bottom"
        placeholderClassName="flex h-[70%] w-full max-w-[240px] items-end justify-center rounded-t-[40%] bg-pond-reed/35"
      />
    </div>
  );
}
