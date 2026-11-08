import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";

function bodyFontRange() {
  if (typeof window === "undefined") return { min: 15, max: 26 };
  const w = window.innerWidth;
  if (w >= 1536) return { min: 18, max: 34 };
  if (w >= 1280) return { min: 17, max: 30 };
  if (w >= 1024) return { min: 16, max: 26 };
  return { min: 14, max: 22 };
}

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
    const { min: minPx, max: maxPx } = bodyFontRange();
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
      className="flex h-36 w-full flex-col rounded-2xl bg-ui-panel/70 px-5 py-3 text-left text-white sm:h-40 sm:rounded-3xl sm:px-7 sm:py-4 lg:h-48 lg:px-9 lg:py-5 xl:h-56 xl:px-10 xl:py-6"
      onClick={() => {
        if (!done) {
          skipRef.current = true;
          setTypedLength(text.length);
        }
      }}
    >
      <div className="shrink-0 font-display text-base text-ui-cream sm:text-lg lg:text-xl xl:text-2xl">
        {speaker}
      </div>
      <p
        ref={bodyRef}
        className="mt-1 min-h-0 flex-1 overflow-hidden font-story font-bold leading-snug text-white sm:mt-2"
      >
        {shown}
        {!done && <span className="caret">▌</span>}
      </p>
    </button>
  );
}
