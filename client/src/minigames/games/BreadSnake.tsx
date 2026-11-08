import { useEffect, useRef, useState } from "react";
import { MinigameShell, ResultBanner } from "../MinigameShell";
import { MG, MG_H, MG_TIME, MG_W } from "../style";

const CELL = 24;
const COLS = Math.floor(MG_W / CELL);
const ROWS = Math.floor(MG_H / CELL);
const NEED = 6;

type Pt = { x: number; y: number };
type Dir = { x: number; y: number };

function randomEmpty(snake: Pt[]): Pt {
  for (let tries = 0; tries < 80; tries++) {
    const p = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
    if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
  }
  return { x: COLS - 2, y: ROWS - 2 };
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  p: Pt,
  fill: string,
  pad = 2
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = MG.ink;
  ctx.lineWidth = 2;
  ctx.fillRect(p.x * CELL + pad, p.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
  ctx.strokeRect(p.x * CELL + pad, p.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
}

export function BreadSnake({
  onComplete,
  onCancel,
}: {
  onComplete: (won: boolean) => void;
  onCancel?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timeLeft, setTimeLeft] = useState(MG_TIME);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [eaten, setEaten] = useState(0);
  const state = useRef({
    snake: [
      { x: 6, y: 8 },
      { x: 5, y: 8 },
      { x: 4, y: 8 },
    ] as Pt[],
    dir: { x: 1, y: 0 } as Dir,
    pending: { x: 1, y: 0 } as Dir,
    food: { x: 14, y: 8 } as Pt,
    eaten: 0,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      const cur = state.current.pending;
      let next: Dir | null = null;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") next = { x: 0, y: -1 };
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") next = { x: 0, y: 1 };
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") next = { x: -1, y: 0 };
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") next = { x: 1, y: 0 };
      if (!next) return;
      e.preventDefault();
      // Block 180° reverse relative to the direction already queued/moving.
      if (next.x === -cur.x && next.y === -cur.y) return;
      state.current.pending = next;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done]);

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

  useEffect(() => {
    if (done) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const paint = () => {
      const s = state.current;
      ctx.fillStyle = MG.bg;
      ctx.fillRect(0, 0, MG_W, MG_H);
      // soft grid
      ctx.strokeStyle = "rgba(74,63,53,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL, 0);
        ctx.lineTo(x * CELL, MG_H);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL);
        ctx.lineTo(MG_W, y * CELL);
        ctx.stroke();
      }
      drawBlock(ctx, s.food, MG.cream, 3);
      s.snake.forEach((p, i) => drawBlock(ctx, p, i === 0 ? MG.sky : MG.mint, 2));
    };

    paint();

    const tick = window.setInterval(() => {
      const s = state.current;
      s.dir = s.pending;
      const head = {
        x: s.snake[0]!.x + s.dir.x,
        y: s.snake[0]!.y + s.dir.y,
      };
      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= COLS ||
        head.y >= ROWS ||
        s.snake.some((p) => p.x === head.x && p.y === head.y)
      ) {
        setDone(true);
        setWon(false);
        return;
      }
      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) {
        s.eaten += 1;
        setEaten(s.eaten);
        s.food = randomEmpty(s.snake);
        if (s.eaten >= NEED) {
          setWon(true);
          setDone(true);
          paint();
          return;
        }
      } else {
        s.snake.pop();
      }
      paint();
    }, 130);

    return () => window.clearInterval(tick);
  }, [done]);

  return (
    <MinigameShell
      title="Bread Snake"
      hint={`Arrows / WASD · eat ${NEED} bread crumbs (${eaten}/${NEED})`}
      timeLeft={timeLeft}
      onCancel={onCancel}
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={MG_W}
          height={MG_H}
          className="rounded-lg border-[3px]"
          style={{ borderColor: MG.ink, background: MG.bg }}
        />
        {done && <ResultBanner won={won} onDone={() => onComplete(won)} />}
      </div>
    </MinigameShell>
  );
}
