import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";

/** Fixed-height brown dialogue panel; body text scales down to fit. */
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
  const bodyRef = useRef<HTMLParagraphElement>(null);

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

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const minPx = 13;
    const maxPx = 22;
    const fit = () => {
      let lo = minPx;
      let hi = maxPx;
      el.style.fontSize = `${hi}px`;
      if (el.scrollHeight <= el.clientHeight) return;
      while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        if (el.scrollHeight <= el.clientHeight) lo = mid;
        else hi = mid;
      }
      el.style.fontSize = `${lo}px`;
    };
    fit();
  }, [shown]);

  return (
    <button
      type="button"
      className="flex h-[7.5rem] w-full flex-col rounded-2xl bg-ui-panel/70 px-5 py-3 text-left text-white sm:h-32 sm:px-6 sm:py-4"
      onClick={() => {
        if (!done) {
          skipRef.current = true;
          setTypedLength(text.length);
        }
      }}
    >
      <div className="shrink-0 font-display text-sm text-ui-cream sm:text-base">
        {speaker}
      </div>
      <p
        ref={bodyRef}
        className="mt-1 min-h-0 flex-1 overflow-hidden font-story font-bold leading-snug text-white"
      >
        {shown}
        {!done && <span className="caret">▌</span>}
      </p>
    </button>
  );
}
