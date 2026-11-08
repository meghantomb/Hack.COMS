import { useEffect, useRef, useState } from "react";
import { introVideoSrc } from "../assets/manifest";

/** Full-screen intro for a new game. Skip or wait for end to start dialogue. */
export function IntroVideo({ onFinished }: { onFinished: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const finished = useRef(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const [loadFailed, setLoadFailed] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onFinishedRef.current();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = async () => {
      try {
        video.muted = false;
        await video.play();
        setNeedsTap(false);
      } catch {
        try {
          // Browsers often allow muted autoplay when unmuted is blocked.
          video.muted = true;
          await video.play();
          setNeedsTap(false);
        } catch {
          setNeedsTap(true);
        }
      }
    };

    if (video.readyState >= 2) {
      void tryPlay();
    } else {
      const onReady = () => void tryPlay();
      video.addEventListener("loadeddata", onReady, { once: true });
      return () => video.removeEventListener("loadeddata", onReady);
    }
  }, []);

  useEffect(() => {
    if (loadFailed) finish();
  }, [loadFailed]);

  if (loadFailed) {
    return (
      <div className="flex h-full min-h-[100dvh] items-center justify-center bg-pond-ink font-display text-pond-foam">
        Starting…
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[100dvh] items-center justify-center bg-black">
      <video
        ref={videoRef}
        className="max-h-full max-w-full"
        src={introVideoSrc()}
        playsInline
        preload="auto"
        onEnded={finish}
        onError={() => setLoadFailed(true)}
      />

      {needsTap && (
        <button
          type="button"
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            video.muted = false;
            void video.play().then(() => setNeedsTap(false)).catch(() => undefined);
          }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"
        >
          <span className="rounded-full bg-pond-sunset px-8 py-3 font-display text-lg text-pond-ink">
            Play intro
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={finish}
        className="absolute bottom-6 right-6 z-20 rounded-full border border-white/40 bg-black/50 px-5 py-2 font-display text-sm text-white backdrop-blur-sm hover:bg-black/70"
      >
        Skip
      </button>
    </div>
  );
}
