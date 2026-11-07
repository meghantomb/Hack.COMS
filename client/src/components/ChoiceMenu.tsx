import type { DialogueOption } from "@duck-dating/shared";
import { useGameStore } from "../store/gameStore";

export function ChoiceMenu({ options }: { options: DialogueOption[] }) {
  const selectOption = useGameStore((s) => s.selectOption);
  const typedLength = useGameStore((s) => s.typedLength);
  const text = useGameStore((s) => s.bundle?.node.text ?? "");
  const ready = typedLength >= text.length;

  if (options.length === 0) return null;

  return (
    <div className="min-h-[3.25rem] w-full">
      {ready && (
        <div
          className="grid w-full gap-2"
          style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => void selectOption(opt)}
              className="rounded-xl border border-pond-light/40 bg-pond-deep/90 px-2 py-2 text-center font-story text-sm leading-snug text-pond-foam transition hover:border-pond-sunset hover:bg-pond-mid/90 sm:px-3 sm:text-base"
            >
              <span>{opt.text}</span>
              {opt.minigameId && (
                <span className="mt-1 block text-[10px] text-pond-sunset sm:text-xs">
                  ★ minigame
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
