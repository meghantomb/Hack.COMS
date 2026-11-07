import type { Facing } from "../assets/manifest";

export type StageSide = "left" | "right";

/** A duck standing on stage. `side` is optional; several ducks are split evenly when it is omitted. */
export interface StageDuck {
  id: string;
  name: string;
  spriteKey: string;
  side?: StageSide;
}

export interface PlacedDuck extends StageDuck {
  side: StageSide;
  /** Faces the bread. */
  facing: Facing;
}

export interface StageLayout {
  /**
   * One duck: bread stands on the opposite side.
   * More than one: bread stands in the center.
   * None: bread stands in the center.
   */
  playerSide: "left" | "center" | "right";
  playerFacing: Facing;
  ducks: PlacedDuck[];
}

function place(duck: StageDuck, side: StageSide): PlacedDuck {
  return {
    ...duck,
    side,
    facing: side === "left" ? "right" : "left",
  };
}

/**
 * Arranges whoever is on stage.
 * A single duck keeps the side it asks for (default right, matching the pond scene).
 * Two or more ducks put the bread in the center; each duck stays on its own side.
 */
export function layoutStage(ducks: StageDuck[]): StageLayout {
  if (ducks.length === 0) {
    return { playerSide: "center", playerFacing: "right", ducks: [] };
  }

  if (ducks.length === 1) {
    const side: StageSide = ducks[0].side ?? "right";
    const playerSide = side === "right" ? "left" : "right";
    return {
      playerSide,
      playerFacing: playerSide === "left" ? "right" : "left",
      ducks: [place(ducks[0], side)],
    };
  }

  const placed: PlacedDuck[] = [];
  const undecided: StageDuck[] = [];
  let left = 0;
  let right = 0;

  for (const duck of ducks) {
    if (duck.side === "left") {
      left += 1;
      placed.push(place(duck, "left"));
    } else if (duck.side === "right") {
      right += 1;
      placed.push(place(duck, "right"));
    } else {
      undecided.push(duck);
    }
  }

  for (const duck of undecided) {
    const side: StageSide = left <= right ? "left" : "right";
    if (side === "left") left += 1;
    else right += 1;
    placed.push(place(duck, side));
  }

  return {
    playerSide: "center",
    playerFacing: "right",
    ducks: [
      ...placed.filter((duck) => duck.side === "left"),
      ...placed.filter((duck) => duck.side === "right"),
    ],
  };
}
