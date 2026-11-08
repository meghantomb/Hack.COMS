import type { ReactNode } from "react";
import { MG } from "./style";

export function MinigameShell({
  title,
  hint,
  timeLeft,
  children,
  onCancel,
}: {
  title: string;
  hint: string;
  timeLeft: number;
  children: ReactNode;
  /** Tester-only escape; hidden in real play. */
  onCancel?: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ui-brown/85 px-4">
      <div
        className="w-full max-w-[624px] overflow-hidden rounded-2xl border-[3px] shadow-lg"
        style={{ borderColor: MG.cream, background: MG.bg }}
      >
        <div
          className="flex items-center justify-between px-5 py-2.5 font-display text-base"
          style={{ background: MG.cream, color: MG.ink }}
        >
          <span className="font-bold">{title}</span>
          <span>{Math.max(0, Math.ceil(timeLeft))}s</span>
        </div>
        <p className="px-5 py-2 text-center font-story text-sm" style={{ color: MG.ink }}>
          {hint}
        </p>
        <div className="flex justify-center px-3 pb-4">{children}</div>
      </div>
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 font-display text-sm text-ui-cream underline hover:text-white"
        >
          Skip (tester)
        </button>
      ) : null}
    </div>
  );
}

export function ResultBanner({
  won,
  onDone,
}: {
  won: boolean;
  onDone: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onDone}
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/40"
    >
      <span
        className="rounded-2xl border-[3px] px-8 py-4 font-display text-2xl"
        style={{
          background: won ? MG.mint : MG.pink,
          borderColor: MG.ink,
          color: MG.ink,
        }}
      >
        {won ? "Nice!" : "Missed it…"}
      </span>
    </button>
  );
}
