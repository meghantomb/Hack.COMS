import { useEffect, useState } from "react";
import { backgroundSrc } from "../assets/manifest";

const FALLBACK_GRADIENTS: Record<string, string> = {
  pond: "radial-gradient(ellipse at 50% 30%, #3d8a9a 0%, #1a4a5a 45%, #0f2a35 100%)",
  island: "radial-gradient(ellipse at 40% 60%, #5a9a6a 0%, #2d6a7a 40%, #1a3a4a 100%)",
  pond_sunset:
    "linear-gradient(180deg, #f0a878 0%, #e87860 35%, #4a6a8a 70%, #1a2a3a 100%)",
};

/** Full-bleed background PNG slot; CSS gradient shows until / if PNG is missing. */
export function Background({ backgroundKey }: { backgroundKey: string }) {
  const [failed, setFailed] = useState(false);
  const fallback =
    FALLBACK_GRADIENTS[backgroundKey] ?? FALLBACK_GRADIENTS.pond;
  const src = backgroundSrc(backgroundKey);

  useEffect(() => {
    setFailed(false);
  }, [backgroundKey]);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: fallback }}>
      {!failed && (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          onError={() => setFailed(true)}
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
