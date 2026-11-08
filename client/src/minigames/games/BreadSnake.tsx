import { useEffect, useRef, useState } from "react";
import { MinigameShell, ResultBanner } from "../MinigameShell";
import { MG, MG_H, MG_TIME, MG_W } from "../style";

const CELL = 20;
const COLS = Math.floor(MG_W / CELL);
const ROWS = Math.floor(MG_H / CELL);
const NEED = 6;

type Pt = { x: number; y: number };

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
  const state = useRef({
    snake: [{ x: 5, y: 8 }] as Pt[],
    dir: { x: 1, y: 0 },
    food: { x: 12, y: 8 } as Pt,
    eaten: 0,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = state.current.dir;
      if (e.key === "ArrowUp" && d.y === 0) state.current.dir = { x: 0, y: -1 };
      if (e.key === "ArrowDown" && d.y === 0) state.current.dir = { x: 0, y: 1 };
      if (e.key === "ArrowLeft" && d.x === 0) state.current.dir = { x: -1, y: 0 };
      if (e.key === "ArrowRight" && d.x === 0) state.current.dir = { x: 1, y: 0 };
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

    const tick = window.setInterval(() => {
      const s = state.current;
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
        s.food = {
          x: Math.floor(Math.random() * COLS),
          y: Math.floor(Math.random() * ROWS),
        };
        if (s.eaten >= NEED) {
          setWon(true);
          setDone(true);
        }
      } else {
        s.snake.pop();
      }

      ctx.fillStyle = MG.bg;
      ctx.fillRect(0, 0, MG_W, MG_H);
      // food bread
      ctx.fillStyle = MG.cream;
      ctx.strokeStyle = MG.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(s.food.x * CELL + 2, s.food.y * CELL + 2, CELL - 4, CELL - 4, 4);
      ctx.fill();
      ctx.stroke();
      // snake
      for (const p of s.snake) {
        ctx.fillStyle = MG.mint;
        ctx.strokeStyle = MG.ink;
        ctx.beginPath();
        ctx.roundRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2, 6);
        ctx.fill();
        ctx.stroke();
      }
    }, 140);

    return () => window.clearInterval(tick);
  }, [done]);

  return (
    <MinigameShell
      title="Sam's Special Game: Bread Snake"
      hint={`arrows to turn | eat ${NEED} breads (${state.current.eaten}/${NEED})`}
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
