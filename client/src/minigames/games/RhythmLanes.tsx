import { useEffect, useRef, useState } from "react";
import { MinigameShell, ResultBanner } from "../MinigameShell";
import { MG, MG_H, MG_TIME, MG_W } from "../style";

const KEYS = ["d", "f", "j", "k"];
const NEED = 12;
const HIT_Y = MG_H - 56;
const HIT_HALF = 52; // generous timing window
const HIT_BAR_H = 36;

type Note = { lane: number; y: number; hit?: boolean };

export function RhythmLanes({
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
  const state = useRef({ notes: [] as Note[], score: 0, spawn: 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const lane = KEYS.indexOf(e.key.toLowerCase());
      if (lane < 0 || done) return;
      const note = state.current.notes.find(
        (n) => !n.hit && n.lane === lane && Math.abs(n.y - HIT_Y) < HIT_HALF
      );
      if (note) {
        note.hit = true;
        state.current.score += 1;
        if (state.current.score >= NEED) {
          setWon(true);
          setDone(true);
        }
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
    const id = window.setInterval(() => {
      const s = state.current;
      s.spawn += 1;
      if (s.spawn % 22 === 0) {
        s.notes.push({ lane: Math.floor(Math.random() * 4), y: -20 });
      }
      for (const n of s.notes) n.y += 5;
      s.notes = s.notes.filter((n) => n.y < MG_H + 40);

      const laneW = MG_W / 4;
      ctx.fillStyle = MG.bg;
      ctx.fillRect(0, 0, MG_W, MG_H);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? MG.sky : MG.mint;
        ctx.fillRect(i * laneW, 0, laneW, MG_H);
        ctx.strokeStyle = MG.ink;
        ctx.lineWidth = 2;
        ctx.strokeRect(i * laneW, 0, laneW, MG_H);
        ctx.fillStyle = MG.ink;
        ctx.font = "16px Fredoka, sans-serif";
        ctx.fillText(KEYS[i]!.toUpperCase(), i * laneW + laneW / 2 - 6, MG_H - 14);
      }
      // Big hit zone
      ctx.fillStyle = "rgba(242, 223, 179, 0.55)";
      ctx.fillRect(0, HIT_Y - HIT_BAR_H / 2, MG_W, HIT_BAR_H);
      ctx.strokeStyle = MG.ink;
      ctx.lineWidth = 3;
      ctx.strokeRect(0, HIT_Y - HIT_BAR_H / 2, MG_W, HIT_BAR_H);
      ctx.fillStyle = MG.cream;
      ctx.fillRect(0, HIT_Y - 3, MG_W, 6);

      for (const n of s.notes) {
        if (n.hit) continue;
        ctx.fillStyle = MG.heart;
        ctx.strokeStyle = MG.ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(n.lane * laneW + 18, n.y - 9, laneW - 36, 22, 6);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = MG.ink;
      ctx.font = "14px Nunito, sans-serif";
      ctx.fillText(`${s.score}/${NEED}`, 12, 22);
    }, 40);
    return () => window.clearInterval(id);
  }, [done]);

  return (
    <MinigameShell
      title="Rhythm Quacker"
      hint="D F J K | hit notes in the wide cream bar"
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
