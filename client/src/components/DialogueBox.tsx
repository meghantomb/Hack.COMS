import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";

export function DialogueBox({
  speaker,
  text,
}: {
  speaker: string;
  text: string;
}) {
  const typedLength = useGameStore((s) => s.typedLength);
  const setTypedLength = useGameStore((s) => s.setTypedLength);
  const skipRef = useRef(false);

  useEffect(() => {
    skipRef.current = false;
    setTypedLength(0);
    let i = 0;
    const id = window.setInterval(() => {
      if (skipRef.current) {
        setTypedLength(text.length);
        window.clearInterval(id);
        return;
      }
      i += 1;
      setTypedLength(i);
      if (i >= text.length) window.clearInterval(id);
    }, 22);
    return () => window.clearInterval(id);
  }, [text, setTypedLength]);

  const done = typedLength >= text.length;
  const shown = text.slice(0, typedLength);

  return (
    <button
      type="button"
      className="w-full rounded-2xl border border-pond-light/30 bg-pond-ink/85 p-4 text-left shadow-xl backdrop-blur-sm sm:p-5"
      onClick={() => {
        if (!done) {
          skipRef.current = true;
          setTypedLength(text.length);
        }
      }}
    >
      <div className="mb-2 inline-block rounded-md bg-pond-mid px-3 py-0.5 font-display text-sm text-pond-foam">
        {speaker}
      </div>
      <p className="min-h-[3.25rem] font-story text-lg leading-relaxed text-pond-foam sm:text-xl">
        {shown}
        {!done && <span className="caret">▌</span>}
      </p>
      {!done && (
        <p className="mt-1 text-xs text-pond-foam/50">Click to skip</p>
      )}
    </button>
  );
}
