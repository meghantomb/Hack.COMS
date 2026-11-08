import { useEffect, useRef, useState } from "react";
import { MinigameShell, ResultBanner } from "../MinigameShell";
import { MG, MG_H, MG_TIME, MG_W } from "../style";

type Car = { x: number; y: number; w: number; dir: number; speed: number };

/** Five lanes, mixed speeds — usually 2 cars per lane, staggered. */
function spawnCars(): Car[] {
  return [
    { x: 20, y: 68, w: 54, dir: 1, speed: 1.8 },
    { x: 260, y: 68, w: 48, dir: 1, speed: 1.8 },
    { x: 100, y: 108, w: 62, dir: -1, speed: 3.4 },
    { x: 340, y: 108, w: 50, dir: -1, speed: 3.4 },
    { x: 40, y: 148, w: 56, dir: 1, speed: 2.3 },
    { x: 300, y: 148, w: 70, dir: 1, speed: 2.3 },
    { x: 160, y: 188, w: 48, dir: -1, speed: 4.0 },
    { x: 400, y: 188, w: 58, dir: -1, speed: 4.0 },
    { x: 0, y: 228, w: 60, dir: 1, speed: 2.8 },
    { x: 220, y: 228, w: 52, dir: 1, speed: 2.8 },
    { x: 80, y: 228, w: 44, dir: 1, speed: 2.8 },
  ];
}

export function FroggerDuck({
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
    x: MG_W / 2,
    y: MG_H - 28,
    cars: spawnCars(),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      const step = 26;
      if (e.key === "ArrowUp") state.current.y -= step;
      if (e.key === "ArrowDown") state.current.y += step;
      if (e.key === "ArrowLeft") state.current.x -= step;
      if (e.key === "ArrowRight") state.current.x += step;
      state.current.x = Math.max(14, Math.min(MG_W - 14, state.current.x));
      state.current.y = Math.max(14, Math.min(MG_H - 14, state.current.y));
      if (state.current.y < 40) {
        setWon(true);
        setDone(true);
      }
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
    const id = window.setInterval(() => {
      const s = state.current;
      for (const c of s.cars) {
        c.x += c.dir * c.speed;
        if (c.x > MG_W + 50) c.x = -70;
        if (c.x < -70) c.x = MG_W + 50;
        if (s.x > c.x && s.x < c.x + c.w && s.y > c.y && s.y < c.y + 22) {
          setDone(true);
          setWon(false);
        }
      }

      ctx.fillStyle = MG.mint;
      ctx.fillRect(0, 0, MG_W, 48);
      ctx.fillStyle = MG.bg;
      ctx.fillRect(0, 48, MG_W, MG_H - 96);
      ctx.fillStyle = MG.cream;
      ctx.fillRect(0, MG_H - 48, MG_W, 48);

      for (let y = 70; y < MG_H - 50; y += 40) {
        ctx.strokeStyle = "rgba(74,63,53,0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(MG_W, y);
        ctx.stroke();
      }

      for (const c of s.cars) {
        ctx.fillStyle = MG.coral;
        ctx.strokeStyle = MG.ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.w, 20, 5);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = MG.sky;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = MG.ink;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = MG.coral;
      ctx.beginPath();
      ctx.moveTo(s.x + 8, s.y - 2);
      ctx.lineTo(s.x + 16, s.y);
      ctx.lineTo(s.x + 8, s.y + 3);
      ctx.fill();
    }, 40);
    return () => window.clearInterval(id);
  }, [done]);

  return (
    <MinigameShell
      title="Duckling Dash"
      hint="Arrows · cross the road before time runs out"
      timeLeft={timeLeft}
      onCancel={onCancel}
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={MG_W}
          height={MG_H}
          className="rounded-lg border-[3px]"
          style={{ borderColor: MG.ink }}
        />
        {done && <ResultBanner won={won} onDone={() => onComplete(won)} />}
      </div>
    </MinigameShell>
  );
}
