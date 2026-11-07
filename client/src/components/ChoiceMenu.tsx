import type { DialogueOption } from "@duck-dating/shared";
import { useGameStore } from "../store/gameStore";

export function ChoiceMenu({ options }: { options: DialogueOption[] }) {
  const selectOption = useGameStore((s) => s.selectOption);
  const typedLength = useGameStore((s) => s.typedLength);
  const text = useGameStore((s) => s.bundle?.node.text ?? "");
  const ready = typedLength >= text.length;

  if (!ready || options.length === 0) return null;

  return (
    <div className="absolute inset-x-4 bottom-36 z-30 flex max-w-2xl flex-col gap-2 sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:px-8">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => void selectOption(opt)}
          className="rounded-xl border border-pond-light/40 bg-pond-deep/90 px-4 py-3 text-left font-story text-base text-pond-foam transition hover:border-pond-sunset hover:bg-pond-mid/90"
        >
          <span>{opt.text}</span>
          {opt.minigameId && (
            <span className="ml-2 text-xs text-pond-sunset">★ minigame</span>
          )}
        </button>
      ))}
    </div>
  );
}
