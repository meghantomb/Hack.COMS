import { useEffect, useRef } from "react";
import type { DialogueOption } from "@duck-dating/shared";
import { useGameStore } from "../store/gameStore";

function ChoiceButton({
  option,
  onPick,
}: {
  option: DialogueOption;
  onPick: () => void;
}) {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const minPx = 12;
    const maxPx = 18;
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
      onClick={onPick}
      className="flex h-[3.25rem] items-center justify-center overflow-hidden rounded-2xl bg-ui-panel/70 px-3 text-center font-story font-bold text-white transition-[filter] duration-150 hover:brightness-110 sm:h-14 sm:px-4"
    >
      <span ref={textRef} className="leading-snug">
        {option.text}
        {option.minigameId ? (
          <span className="mt-0.5 block text-[0.65em] font-display text-ui-cream">
            ★ minigame
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function ChoiceMenu({ options }: { options: DialogueOption[] }) {
  const selectOption = useGameStore((s) => s.selectOption);
  const typedLength = useGameStore((s) => s.typedLength);
  const text = useGameStore((s) => s.bundle?.node.text ?? "");
  const ready = typedLength >= text.length;

  // Reserve height so characters never shift when choices appear.
  return (
    <div className="h-[3.25rem] w-full sm:h-14">
      {ready && options.length > 0 && (
        <div
          className="grid h-full w-full gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))`,
          }}
        >
          {options.map((opt) => (
            <ChoiceButton
              key={opt.id}
              option={opt}
              onPick={() => void selectOption(opt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
