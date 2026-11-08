import { useEffect, useRef } from "react";
import type { DialogueOption } from "@duck-dating/shared";
import { useGameStore } from "../store/gameStore";

function choiceFontRange() {
  if (typeof window === "undefined") return { min: 13, max: 18 };
  const w = window.innerWidth;
  if (w >= 1536) return { min: 15, max: 24 };
  if (w >= 1280) return { min: 14, max: 22 };
  if (w >= 1024) return { min: 13, max: 20 };
  return { min: 12, max: 17 };
}

function ChoiceButton({
  option,
  locked,
  onPick,
}: {
  option: DialogueOption;
  locked: boolean;
  onPick: () => void;
}) {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const { min: minPx, max: maxPx } = choiceFontRange();
    let lo = minPx;
    let hi = maxPx;
    el.style.fontSize = `${hi}px`;
    const parent = el.parentElement;
    if (!parent) return;
    const fits = () =>
      el.scrollHeight <= parent.clientHeight - 8 &&
      el.scrollWidth <= parent.clientWidth - 16;
    if (fits()) return;
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = `${mid}px`;
      if (fits()) lo = mid;
      else hi = mid;
    }
    el.style.fontSize = `${lo}px`;
  }, [option.text]);

  return (
    <button
      type="button"
      disabled={locked}
      onClick={onPick}
      className={`flex h-14 items-center justify-center overflow-hidden rounded-2xl px-3 text-center font-story font-bold transition-[filter] duration-150 sm:h-16 sm:rounded-3xl sm:px-4 lg:h-[4.5rem] lg:px-5 xl:h-20 xl:px-6 ${
        locked
          ? "cursor-not-allowed bg-ui-panel/35 text-white/45"
          : "bg-ui-panel/70 text-white hover:brightness-110"
      }`}
    >
      <span ref={textRef} className="leading-snug">
        {option.text}
        {option.minigameId ? (
          <span
            className={`mt-0.5 block text-[0.65em] font-display ${
              locked ? "text-white/40" : "text-ui-cream"
            }`}
          >
            {locked ? "★ missed" : "★ minigame"}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function ChoiceMenu({ options }: { options: DialogueOption[] }) {
  const selectOption = useGameStore((s) => s.selectOption);
  const lockedIds = useGameStore((s) => s.lockedMinigameOptionIds);
  const typedLength = useGameStore((s) => s.typedLength);
  const text = useGameStore((s) => s.bundle?.node.text ?? "");
  const ready = typedLength >= text.length;

  // Reserve height so characters never shift when choices appear.
  return (
    <div className="h-14 w-full sm:h-16 lg:h-[4.5rem] xl:h-20">
      {ready && options.length > 0 && (
        <div
          className="grid h-full w-full gap-3 lg:gap-4"
          style={{
            gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))`,
          }}
        >
          {options.map((opt) => {
            const locked = Boolean(opt.minigameId && lockedIds.includes(opt.id));
            return (
              <ChoiceButton
                key={opt.id}
                option={opt}
                locked={locked}
                onPick={() => void selectOption(opt)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
