import { useEffect, useRef, useState } from "react";
import { MinigameShell, ResultBanner } from "../MinigameShell";
import { MG, MG_H, MG_TIME, MG_W } from "../style";

type Bullet = { x: number; y: number; vx: number; vy: number };

export function BulletHell({
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
  const keys = useRef<Record<string, boolean>>({});
  const state = useRef({
    x: MG_W / 2,
    y: MG_H - 40,
    bullets: [] as Bullet[],
    survived: 0,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          setDone(true);
          setWon(state.current.survived >= 25);
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
      const k = keys.current;
      if (k.ArrowLeft || k.a) s.x -= 4;
      if (k.ArrowRight || k.d) s.x += 4;
      if (k.ArrowUp || k.w) s.y -= 4;
      if (k.ArrowDown || k.s) s.y += 4;
      s.x = Math.max(16, Math.min(MG_W - 16, s.x));
      s.y = Math.max(16, Math.min(MG_H - 16, s.y));

      if (frame % 18 === 0) {
        const angle = (frame / 40) % (Math.PI * 2);
        for (let i = 0; i < 5; i++) {
          const a = angle + (i * Math.PI * 2) / 5;
          s.bullets.push({
            x: MG_W / 2,
            y: 50,
            vx: Math.cos(a) * 2.2,
            vy: Math.sin(a) * 2.2 + 1.2,
          });
        }
      }

      s.bullets = s.bullets
        .map((b) => ({ ...b, x: b.x + b.vx, y: b.y + b.vy }))
        .filter((b) => b.x > -10 && b.x < MG_W + 10 && b.y < MG_H + 10);

      for (const b of s.bullets) {
        const dx = b.x - s.x;
        const dy = b.y - s.y;
        if (dx * dx + dy * dy < 14 * 14) {
          setDone(true);
          setWon(false);
          return;
        }
      }

      s.survived += 1;
      if (s.survived >= 28 * 10) {
        // ~28s of ticks at 100ms... actually interval is 50ms below
      }

      ctx.fillStyle = MG.bg;
      ctx.fillRect(0, 0, MG_W, MG_H);
      // boss blob
      ctx.fillStyle = MG.lilac;
      ctx.strokeStyle = MG.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(MG_W / 2, 48, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // bullets
      ctx.fillStyle = MG.heart;
      for (const b of s.bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      // player duck
      ctx.fillStyle = MG.cream;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }, 50);

    const winTimer = window.setTimeout(() => {
      if (!done) {
        setWon(true);
        setDone(true);
      }
    }, 30000);

    return () => {
      window.clearInterval(id);
      window.clearTimeout(winTimer);
    };
  }, [done]);

  return (
    <MinigameShell
      title="Xavier's Special Game: Bullet Hell"
      hint="arrow keys/WASD to move | survive 30s"
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
