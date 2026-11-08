import type { LoveMeter } from "@duck-dating/shared";
import type { StageLayout } from "../stage/layoutStage";

function meterFor(
  duck: { id: string; name: string; spriteKey: string },
  meters: LoveMeter[],
): LoveMeter {
  return (
    meters.find((meter) => meter.characterId === duck.id) ?? {
      characterId: duck.id,
      name: duck.name,
      spriteKey: duck.spriteKey,
      friendliness: 0,
    }
  );
}

function HeartBar({ meter }: { meter: LoveMeter }) {
  const friendship = Math.max(0, Math.min(100, meter.friendliness));
  const visualPct = 10 + friendship * 0.9;
  return (
    <div
      className="relative h-8 w-56 overflow-visible rounded-full border-[3px] border-ui-brown sm:h-9 sm:w-64 lg:h-11 lg:w-80 lg:border-4 xl:h-12 xl:w-96"
      role="meter"
      aria-label={`${meter.name} friendship`}
      aria-valuenow={friendship}
      aria-valuemin={0}
      aria-valuemax={100}
      title={`${meter.name}: ${friendship}`}
    >
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="absolute inset-0 bg-ui-cream" />
        <div
          className="absolute inset-y-0 left-0 bg-ui-pink transition-all duration-500"
          style={{ width: `${visualPct}%` }}
        />
      </div>
      <div
        className="pointer-events-none absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
        style={{ left: `${visualPct}%` }}
      >
        <HeartIcon />
      </div>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 22"
      aria-hidden
      className="h-11 w-12 drop-shadow-sm sm:h-12 sm:w-[3.25rem] lg:h-14 lg:w-16 xl:h-16 xl:w-[4.25rem]"
    >
      <path
        d="M12 20.4S2.5 14.2 2.5 8.2C2.5 4.9 4.9 2.5 8.1 2.5c1.8 0 3.4.9 4.4 2.3C13.5 3.4 15.1 2.5 16.9 2.5c3.2 0 5.6 2.4 5.6 5.7 0 6-9.5 12.2-10.5 12.2Z"
        fill="#FF7171"
        stroke="#87641D"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function HomeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Save and return to title"
      title="Save & Title"
      className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-ui-brown bg-ui-cream text-ui-brown transition-[filter] duration-200 hover:brightness-110 sm:h-16 sm:w-16 lg:h-20 lg:w-20 lg:border-4 xl:h-24 xl:w-24"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
        className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12"
      >
        <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM6 8V5h8v3H6Z" />
      </svg>
    </button>
  );
}

export function StageChrome({
  layout,
  meters,
  onSaveAndQuit,
}: {
  layout: StageLayout;
  meters: LoveMeter[];
  onRestart?: () => void;
  onSaveAndQuit: () => void;
}) {
  const showHearts = layout.ducks.length > 0 && layout.ducks.length < 4;
  const leftMeters = showHearts
    ? layout.ducks
        .filter((duck) => duck.side === "left")
        .map((duck) => meterFor(duck, meters))
    : [];
  const rightMeters = showHearts
    ? layout.ducks
        .filter((duck) => duck.side === "right")
        .map((duck) => meterFor(duck, meters))
    : [];

  return (
    <>
      {leftMeters.length > 0 && (
        <div className="pointer-events-none absolute left-4 top-4 z-30 flex flex-col items-start gap-3 sm:left-6 sm:top-5 lg:left-8 lg:top-7 lg:gap-4 xl:left-10 xl:top-8">
          {leftMeters.map((meter) => (
            <div key={meter.characterId} className="pointer-events-auto">
              <HeartBar meter={meter} />
            </div>
          ))}
        </div>
      )}
      {rightMeters.length > 0 && (
        <div className="pointer-events-none absolute right-4 top-4 z-30 flex flex-col items-end gap-3 sm:right-6 sm:top-5 lg:right-8 lg:top-7 lg:gap-4 xl:right-10 xl:top-8">
          {rightMeters.map((meter) => (
            <div key={meter.characterId} className="pointer-events-auto">
              <HeartBar meter={meter} />
            </div>
          ))}
        </div>
      )}
      <div className="absolute bottom-4 right-4 z-30 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 xl:bottom-10 xl:right-10">
        <HomeButton onClick={onSaveAndQuit} />
      </div>
    </>
  );
}
