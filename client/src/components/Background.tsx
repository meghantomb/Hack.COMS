import { useState } from "react";
import { backgroundSrc } from "../assets/manifest";

const FALLBACK =
  "radial-gradient(ellipse at 50% 30%, #3d8a9a 0%, #1a4a5a 45%, #0f2a35 100%)";

export function Background({ backgroundKey }: { backgroundKey?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = backgroundSrc(backgroundKey);
  const failed = failedSrc === src;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: FALLBACK }}>
      {!failed && (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          onError={() => setFailedSrc(src)}
        />
      )}
      {failed && (
        <div className="absolute bottom-3 right-3 rounded bg-pond-ink/70 px-2 py-1 text-[10px] text-pond-foam/60">
          slot: {src}
        </div>
      )}
    </div>
  );
}
