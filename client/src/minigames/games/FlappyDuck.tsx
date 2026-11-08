import { useEffect, useRef, useState } from "react";
import { MinigameShell, ResultBanner } from "../MinigameShell";
import { MG, MG_H, MG_TIME, MG_W } from "../style";

type Pipe = { x: number; gapY: number; id: number; scored?: boolean };

const NEED = 4;

export function FlappyDuck({
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
  const nextId = useRef(1);
  const state = useRef({
    y: MG_H / 2,
    vy: 0,
    pipes: [{ x: MG_W + 40, gapY: 160, id: 0 }] as Pipe[],
    score: 0,
  });

  useEffect(() => {
    const flap = (e: KeyboardEvent | MouseEvent) => {
      if (done) return;
      if ("key" in e && e.key !== " " && e.key !== "ArrowUp") return;
      e.preventDefault();
      state.current.vy = -5.5;
    };
    window.addEventListener("keydown", flap);
    window.addEventListener("mousedown", flap);
    return () => {
      window.removeEventListener("keydown", flap);
      window.removeEventListener("mousedown", flap);
    };
  }, [done]);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          setDone(true);
          setWon(state.current.score >= NEED);
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
    let frame = 0;
    const id = window.setInterval(() => {
      const s = state.current;
      frame += 1;
      s.vy += 0.28;
      s.y += s.vy;
      if (frame % 90 === 0) {
        s.pipes.push({
          x: MG_W + 20,
          gapY: 80 + Math.random() * 160,
          id: nextId.current++,
        });
      }
      for (const p of s.pipes) p.x -= 2.8;
      s.pipes = s.pipes.filter((p) => p.x > -40);

      const gap = 78;
      const duckX = 90;
      for (const p of s.pipes) {
        if (
          duckX > p.x &&
          duckX < p.x + 36 &&
          (s.y < p.gapY || s.y > p.gapY + gap)
        ) {
          setDone(true);
          setWon(false);
          return;
        }
        if (!p.scored && p.x + 36 < duckX) {
          p.scored = true;
          s.score += 1;
          if (s.score >= NEED) {
            setWon(true);
            setDone(true);
          }
        }
      }
      if (s.y < 0 || s.y > MG_H) {
        setDone(true);
        setWon(false);
        return;
      }

      ctx.fillStyle = MG.sky;
      ctx.fillRect(0, 0, MG_W, MG_H);
      for (const p of s.pipes) {
        ctx.fillStyle = MG.reed;
        ctx.strokeStyle = MG.ink;
        ctx.lineWidth = 3;
        ctx.fillRect(p.x, 0, 36, p.gapY);
        ctx.strokeRect(p.x, 0, 36, p.gapY);
        ctx.fillRect(p.x, p.gapY + gap, 36, MG_H - (p.gapY + gap));
        ctx.strokeRect(p.x, p.gapY + gap, 36, MG_H - (p.gapY + gap));
      }
      ctx.fillStyle = MG.cream;
      ctx.beginPath();
      ctx.arc(duckX, s.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = MG.ink;
      ctx.stroke();
      ctx.fillStyle = MG.ink;
      ctx.font = "14px Nunito, sans-serif";
      ctx.fillText(`${Math.min(s.score, NEED)}/${NEED}`, 12, 22);
    }, 1000 / 30);
    return () => window.clearInterval(id);
  }, [done]);

  return (
    <MinigameShell
      title="Flappy Duck"
      hint="space/click to flap | clear 4 reeds"
      timeLeft={timeLeft}
      onCancel={onCancel}
    >
      <div className="relative">
        <canvas ref={canvasRef} width={MG_W} height={MG_H} className="rounded-lg border-[3px]" style={{ borderColor: MG.ink }} />
        {done && <ResultBanner won={won} onDone={() => onComplete(won)} />}
      </div>
    </MinigameShell>
  );
}
