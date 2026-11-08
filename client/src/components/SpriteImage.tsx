import { useEffect, useState } from "react";

/** Loads a PNG slot; shows a labeled placeholder if the file is missing. */
export function SpriteImage({
  src,
  alt,
  className,
  placeholderClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div
        className={
          placeholderClassName ??
          "flex h-full w-full items-end justify-center bg-gradient-to-t from-black/40 to-transparent"
        }
        title={`Missing: ${src}`}
      >
        <span className="mb-6 rounded bg-pond-ink/80 px-3 py-1 font-display text-sm text-pond-foam/80">
          {alt}
          <span className="mt-1 block text-[10px] font-story text-pond-light/70">{src}</span>
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      decoding="async"
      style={{
        // Avoid CSS filters/shadows — they fringe transparent PNG edges.
        filter: "none",
        WebkitFilter: "none",
        background: "transparent",
      }}
      onError={() => setFailed(true)}
    />
  );
}
