import { useEffect, useMemo, useRef, useState } from "react";
import { MinigameShell, ResultBanner } from "../MinigameShell";
import { MG, MG_TIME } from "../style";

const GRID = 6;
const CELL = 62; // ~52 × 1.2
const BOARD = GRID * CELL;

type Axis = "h" | "v";

type Car = {
  id: string;
  r: number;
  c: number;
  len: number;
  axis: Axis;
  color: string;
  hero?: boolean;
};

/**
 * Classic Rush Hour board (dark-red GO car exits right).
 *
 *   G . . W W W
 *   G . . O . F
 *   H H . O B F → EXIT
 *   S S S . B F
 *   . . P . N N
 *   D D P E E .
 */
function initialCars(): Car[] {
  return [
    { id: "hero", r: 2, c: 0, len: 2, axis: "h", color: "#C62828", hero: true },
    { id: "lime", r: 0, c: 0, len: 2, axis: "v", color: "#AED581" },
    { id: "white", r: 0, c: 3, len: 3, axis: "h", color: "#ECEFF1" },
    { id: "orange", r: 1, c: 3, len: 2, axis: "v", color: "#FFB74D" },
    { id: "blue", r: 2, c: 4, len: 2, axis: "v", color: "#64B5F6" },
    { id: "fire", r: 1, c: 5, len: 3, axis: "v", color: "#E53935" },
    { id: "semi", r: 3, c: 0, len: 3, axis: "h", color: "#42A5F5" },
    { id: "pink", r: 4, c: 2, len: 2, axis: "v", color: "#F48FB1" },
    { id: "bronze", r: 4, c: 4, len: 2, axis: "h", color: "#A1887F" },
    { id: "greenL", r: 5, c: 0, len: 2, axis: "h", color: "#66BB6A" },
    { id: "greenR", r: 5, c: 3, len: 2, axis: "h", color: "#43A047" },
  ];
}

function cellsOf(car: Car): { r: number; c: number }[] {
  return Array.from({ length: car.len }, (_, i) =>
    car.axis === "h" ? { r: car.r, c: car.c + i } : { r: car.r + i, c: car.c }
  );
}

function assertNoOverlap(cars: Car[]) {
  const seen = new Set<string>();
  for (const car of cars) {
    for (const p of cellsOf(car)) {
      const key = `${p.r},${p.c}`;
      if (seen.has(key)) {
        throw new Error(`Garage overlap at ${key} (${car.id})`);
      }
      seen.add(key);
    }
  }
}

function occupied(cars: Car[], exceptId?: string): Set<string> {
  const set = new Set<string>();
  for (const car of cars) {
    if (car.id === exceptId) continue;
    for (const p of cellsOf(car)) set.add(`${p.r},${p.c}`);
  }
  return set;
}

function maxSlide(cars: Car[], car: Car, dir: -1 | 1): number {
  const occ = occupied(cars, car.id);
  let steps = 0;
  for (let s = 1; s < GRID; s++) {
    const nr = car.axis === "v" ? car.r + (dir === 1 ? car.len - 1 + s : -s) : car.r;
    const nc = car.axis === "h" ? car.c + (dir === 1 ? car.len - 1 + s : -s) : car.c;

    if (car.hero && car.axis === "h" && dir === 1 && nr === 2 && nc === GRID) {
      return s;
    }

    if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) break;
    if (occ.has(`${nr},${nc}`)) break;
    steps = s;
  }
  return steps;
}

function tryMoveSteps(
  cars: Car[],
  id: string,
  dir: -1 | 1,
  want: number
): Car[] | "win" | null {
  const car = cars.find((c) => c.id === id);
  if (!car || want <= 0) return null;
  const steps = Math.min(want, maxSlide(cars, car, dir));
  if (steps <= 0) return null;

  if (
    car.hero &&
    car.axis === "h" &&
    dir === 1 &&
    car.c + car.len + steps > GRID
  ) {
    return "win";
  }

  return cars.map((c) => {
    if (c.id !== id) return c;
    return c.axis === "h"
      ? { ...c, c: c.c + dir * steps }
      : { ...c, r: c.r + dir * steps };
  });
}

function tryMove(cars: Car[], id: string, dir: -1 | 1): Car[] | "win" | null {
  return tryMoveSteps(cars, id, dir, GRID);
}

function slideToward(cars: Car[], id: string, tr: number, tc: number): Car[] | "win" | null {
  const car = cars.find((c) => c.id === id);
  if (!car) return null;
  if (car.axis === "h") {
    if (tr !== car.r) return null;
    if (tc >= car.c && tc < car.c + car.len) return null;
    const dir: -1 | 1 = tc > car.c ? 1 : -1;
    const want =
      dir === 1 ? tc - (car.c + car.len - 1) : car.c - tc;
    return tryMoveSteps(cars, id, dir, want);
  }
  if (tc !== car.c) return null;
  if (tr >= car.r && tr < car.r + car.len) return null;
  const dir: -1 | 1 = tr > car.r ? 1 : -1;
  const want = dir === 1 ? tr - (car.r + car.len - 1) : car.r - tr;
  return tryMoveSteps(cars, id, dir, want);
}

type DragState = {
  id: string;
  startX: number;
  startY: number;
  originR: number;
  originC: number;
  axis: Axis;
  dx: number;
  dy: number;
};

export function SlidePuzzle({
  onComplete,
  onCancel,
}: {
  onComplete: (won: boolean) => void;
  onCancel?: () => void;
}) {
  const start = useMemo(() => {
    const cars = initialCars();
    assertNoOverlap(cars);
    return cars;
  }, []);
  const [cars, setCars] = useState(start);
  const [selected, setSelected] = useState<string>("hero");
  const [timeLeft, setTimeLeft] = useState(Math.max(MG_TIME, 45));
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const carsRef = useRef(cars);
  carsRef.current = cars;
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const doneRef = useRef(done);
  doneRef.current = done;

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          setDone(true);
          setWon(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  const apply = (next: Car[] | "win" | null) => {
    if (!next || doneRef.current) return;
    if (next === "win") {
      setWon(true);
      setDone(true);
      return;
    }
    setCars(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (doneRef.current || !selected) return;
      const car = carsRef.current.find((c) => c.id === selected);
      if (!car) return;
      let dir: -1 | 1 | null = null;
      if (car.axis === "h") {
        if (e.key === "ArrowLeft") dir = -1;
        if (e.key === "ArrowRight") dir = 1;
      } else {
        if (e.key === "ArrowUp") dir = -1;
        if (e.key === "ArrowDown") dir = 1;
      }
      if (!dir) return;
      e.preventDefault();
      apply(tryMove(carsRef.current, selected, dir));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setDrag({
        ...d,
        dx: e.clientX - d.startX,
        dy: e.clientY - d.startY,
      });
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const car = carsRef.current.find((c) => c.id === d.id);
      setDrag(null);
      if (!car || doneRef.current) return;

      const delta = car.axis === "h" ? e.clientX - d.startX : e.clientY - d.startY;
      if (Math.abs(delta) < CELL * 0.25) return; // treat as click/select only

      const dir: -1 | 1 = delta > 0 ? 1 : -1;
      const want = Math.max(1, Math.round(Math.abs(delta) / CELL));
      apply(tryMoveSteps(carsRef.current, d.id, dir, want));
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const onBoardClick = (r: number, c: number) => {
    if (done || drag) return;
    const hit = cars.find((car) => cellsOf(car).some((p) => p.r === r && p.c === c));
    if (hit) {
      setSelected(hit.id);
      return;
    }
    if (selected) apply(slideToward(cars, selected, r, c));
  };

  const onExitClick = () => {
    if (done) return;
    if (selected !== "hero") {
      setSelected("hero");
      return;
    }
    apply(tryMove(cars, "hero", 1));
  };

  const startDrag = (car: Car, e: React.PointerEvent) => {
    if (done) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(car.id);
    setDrag({
      id: car.id,
      startX: e.clientX,
      startY: e.clientY,
      originR: car.r,
      originC: car.c,
      axis: car.axis,
      dx: 0,
      dy: 0,
    });
  };

  return (
    <MinigameShell
      title="Ryan's Special Game: Slide Puzzle"
      hint="drag or click | get the red GO car out the exit"
      timeLeft={timeLeft}
      onCancel={onCancel}
    >
      <div className="relative flex items-stretch gap-0">
        <div
          className="relative rounded-l-lg border-[3px]"
          style={{
            width: BOARD,
            height: BOARD,
            borderColor: MG.ink,
            background: "#D9E4C9",
            touchAction: "none",
          }}
        >
          {Array.from({ length: GRID }, (_, i) => (
            <div key={`g${i}`}>
              <div
                className="absolute left-0 right-0"
                style={{ top: i * CELL, height: 1, background: "rgba(74,63,53,0.12)" }}
              />
              <div
                className="absolute top-0 bottom-0"
                style={{ left: i * CELL, width: 1, background: "rgba(74,63,53,0.12)" }}
              />
            </div>
          ))}

          {Array.from({ length: GRID * GRID }, (_, i) => {
            const r = Math.floor(i / GRID);
            const c = i % GRID;
            return (
              <button
                key={i}
                type="button"
                aria-label={`cell ${r},${c}`}
                className="absolute"
                style={{ left: c * CELL, top: r * CELL, width: CELL, height: CELL }}
                onClick={() => onBoardClick(r, c)}
              />
            );
          })}

          {cars.map((car) => {
            const w = (car.axis === "h" ? car.len : 1) * CELL - 6;
            const h = (car.axis === "v" ? car.len : 1) * CELL - 6;
            const selectedRing = selected === car.id;
            const dragging = drag?.id === car.id;
            let left = car.c * CELL + 3;
            let top = car.r * CELL + 3;
            if (dragging && drag) {
              if (car.axis === "h") left += drag.dx;
              else top += drag.dy;
            }
            return (
              <button
                key={car.id}
                type="button"
                onPointerDown={(e) => startDrag(car, e)}
                className="absolute flex cursor-grab items-center justify-center rounded-md border-[3px] font-display text-xs active:cursor-grabbing"
                style={{
                  left,
                  top,
                  width: w,
                  height: h,
                  background: car.color,
                  borderColor: selectedRing ? MG.panel : MG.ink,
                  boxShadow: selectedRing ? `0 0 0 2px ${MG.cream}` : undefined,
                  color: MG.ink,
                  zIndex: dragging ? 5 : 2,
                  opacity: dragging ? 0.92 : 1,
                }}
              >
                {car.hero ? (
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block h-4 w-4 rounded-full border-2"
                      style={{ background: "#F6E27A", borderColor: MG.ink }}
                    />
                    GO
                  </span>
                ) : (
                  <span className="opacity-60">{car.axis === "h" ? "—" : "|"}</span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onExitClick}
          className="flex w-14 flex-col items-center justify-center rounded-r-lg border-[3px] border-l-0 font-display text-[10px] leading-tight"
          style={{
            borderColor: MG.ink,
            background: MG.cream,
            color: MG.ink,
            marginTop: 2 * CELL,
            height: CELL,
          }}
        >
          EXIT
          <span aria-hidden>→</span>
        </button>

        {done && <ResultBanner won={won} onDone={() => onComplete(won)} />}
      </div>
    </MinigameShell>
  );
}
