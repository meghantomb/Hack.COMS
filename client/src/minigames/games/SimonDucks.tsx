import { useEffect, useState } from "react";
import { MinigameShell, ResultBanner } from "../MinigameShell";
import { MG, MG_TIME } from "../style";

const KEYS = ["a", "s", "d", "f"];
const COLORS = [MG.sky, MG.pink, MG.mint, MG.lilac];
const NEED = 4;

export function SimonDucks({
  onComplete,
  onCancel,
}: {
  onComplete: (won: boolean) => void;
  onCancel?: () => void;
}) {
  const [seq, setSeq] = useState<number[]>(() => [Math.floor(Math.random() * 4)]);
  const [input, setInput] = useState<number[]>([]);
  const [flash, setFlash] = useState<number | null>(null);
  const [showing, setShowing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(MG_TIME);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [round, setRound] = useState(1);

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
    let i = 0;
    setShowing(true);
    setInput([]);
    const id = window.setInterval(() => {
      if (i >= seq.length) {
        window.clearInterval(id);
        setFlash(null);
        setShowing(false);
        return;
      }
      setFlash(seq[i]!);
      window.setTimeout(() => setFlash(null), 350);
      i += 1;
    }, 550);
    return () => window.clearInterval(id);
  }, [seq, done]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showing || done) return;
      const idx = KEYS.indexOf(e.key.toLowerCase());
      if (idx < 0) return;
      const next = [...input, idx];
      setInput(next);
      setFlash(idx);
      window.setTimeout(() => setFlash(null), 200);
      if (seq[next.length - 1] !== idx) {
        setDone(true);
        setWon(false);
        return;
      }
      if (next.length === seq.length) {
        if (round >= NEED) {
          setWon(true);
          setDone(true);
        } else {
          setRound((r) => r + 1);
          setSeq((s) => [...s, Math.floor(Math.random() * 4)]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input, seq, showing, done, round]);

  return (
    <MinigameShell
      title="Simon Quacks"
      hint={`A S D F | repeat the sequence (round ${round}/${NEED})`}
      timeLeft={timeLeft}
      onCancel={onCancel}
    >
      <div className="relative flex gap-4 p-5">
        {COLORS.map((color, i) => (
          <div
            key={color}
            className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-[3px] font-display text-xl transition"
            style={{
              background: flash === i ? color : `${color}99`,
              borderColor: MG.ink,
              color: MG.ink,
              transform: flash === i ? "scale(1.08)" : undefined,
            }}
          >
            {KEYS[i]!.toUpperCase()}
          </div>
        ))}
        {done && <ResultBanner won={won} onDone={() => onComplete(won)} />}
      </div>
    </MinigameShell>
  );
}
