import { useEffect, useMemo, useState } from "react";
import { MinigameShell, ResultBanner } from "../MinigameShell";
import { MG, MG_TIME } from "../style";

const PALETTE = [MG.sky, MG.pink, MG.mint, MG.cream];
const MEM = 5;

function randomPainting(): number[] {
  return Array.from({ length: 9 }, () => Math.floor(Math.random() * PALETTE.length));
}

export function PixelPaint({
  onComplete,
  onCancel,
}: {
  onComplete: (won: boolean) => void;
  onCancel?: () => void;
}) {
  const target = useMemo(() => randomPainting(), []);
  const [phase, setPhase] = useState<"memo" | "paint" | "done">("memo");
  const [grid, setGrid] = useState(() => Array(9).fill(0));
  const [brush, setBrush] = useState(0);
  const [won, setWon] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MG_TIME);

  useEffect(() => {
    const t = window.setTimeout(() => setPhase("paint"), MEM * 1000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === "done") return;
    const id = window.setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          setPhase("done");
          setWon(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const paint = (i: number) => {
    if (phase !== "paint") return;
    const next = [...grid];
    next[i] = brush;
    setGrid(next);
    if (next.every((c, idx) => c === target[idx])) {
      setWon(true);
      setPhase("done");
    }
  };

  return (
    <MinigameShell
      title="Jeremy's Special Game: Pixel Paint"
      hint={phase === "memo" ? "memorize the painting..." : "recreate it with the palette!"}
      timeLeft={timeLeft}
      onCancel={onCancel}
    >
      <div className="relative">
        <div className="grid grid-cols-3 gap-2" style={{ width: 252 }}>
          {(phase === "memo" ? target : grid).map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => paint(i)}
              className="h-[79px] w-[79px] rounded-md border-[3px]"
              style={{ background: PALETTE[c], borderColor: MG.ink }}
            />
          ))}
        </div>
        {phase === "paint" && (
          <div className="mt-3 flex justify-center gap-2">
            {PALETTE.map((color, i) => (
              <button
                key={color}
                type="button"
                onClick={() => setBrush(i)}
                className="h-8 w-8 rounded-full border-[3px]"
                style={{
                  background: color,
                  borderColor: brush === i ? MG.heart : MG.ink,
                  transform: brush === i ? "scale(1.15)" : undefined,
                }}
              />
            ))}
          </div>
        )}
        {phase === "done" && (
          <ResultBanner won={won} onDone={() => onComplete(won)} />
        )}
      </div>
    </MinigameShell>
  );
}
