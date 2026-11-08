import { titleBackgroundSrc, titleLogoSrc } from "../assets/manifest";

/** Same layout/colors as the old title-screen.css, expressed in Tailwind. */
export function TitleScreen({
  canContinue,
  busy,
  onNewGame,
  onContinue,
}: {
  canContinue: boolean;
  busy: boolean;
  onNewGame: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="relative h-full min-h-[100dvh] overflow-hidden">
      <img
        src={titleBackgroundSrc()}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      />
      <img
        src={titleLogoSrc()}
        alt="What the Duck?"
        draggable={false}
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full select-none object-cover"
      />

      <div className="absolute left-1/2 top-[68%] z-[2] flex w-full max-w-md -translate-x-1/2 flex-col gap-4 px-6 sm:max-w-lg sm:gap-5 lg:max-w-xl">
        <button
          type="button"
          disabled={busy}
          onClick={onNewGame}
          className="cursor-pointer rounded-full border-none bg-ui-cream px-10 py-4 font-display text-2xl text-ui-brown transition-[filter] duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:px-12 sm:py-5 sm:text-3xl lg:px-14 lg:py-6 lg:text-4xl"
        >
          New Game
        </button>
        {canContinue && (
          <button
            type="button"
            disabled={busy}
            onClick={onContinue}
            className="cursor-pointer rounded-full border-none bg-ui-cream px-10 py-4 font-display text-2xl text-ui-brown transition-[filter] duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:px-12 sm:py-5 sm:text-3xl lg:px-14 lg:py-6 lg:text-4xl"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
