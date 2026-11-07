import type { LoveMeter } from "@duck-dating/shared";
import { getFriendlinessLabel } from "@duck-dating/shared";
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

/** Relation bar for one duck, sitting on that duck's side of the screen. */
function RelationBar({ meter }: { meter: LoveMeter }) {
  return (
    <div className="w-full max-w-[14rem] rounded-md border border-pond-light/20 bg-pond-ink/75 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate font-display text-sm text-pond-foam">{meter.name}</p>
        <p className="shrink-0 text-[10px] text-pond-light">
          {getFriendlinessLabel(meter.friendliness)}
        </p>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/25"
        role="meter"
        aria-label={`${meter.name} relation`}
        aria-valuenow={meter.friendliness}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-pond-sunset transition-all duration-500"
          style={{ width: `${meter.friendliness}%` }}
        />
      </div>
    </div>
  );
}

export function StageChrome({
  layout,
  meters,
  onRestart,
}: {
  layout: StageLayout;
  meters: LoveMeter[];
  onRestart: () => void;
}) {
  const left = layout.ducks.filter((duck) => duck.side === "left");
  const right = layout.ducks.filter((duck) => duck.side === "right");

  const title = (
    <div>
      <h1 className="font-display text-xl text-pond-foam drop-shadow sm:text-2xl">
        What the Duck?
      </h1>
      <button
        type="button"
        onClick={onRestart}
        className="mt-0.5 text-xs text-pond-light/70 underline hover:text-pond-foam"
      >
        Reset save
      </button>
    </div>
  );

  return (
    <header className="relative z-20 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 px-4 pt-4 sm:px-6">
      <div className="flex flex-col items-start gap-2">
        {left.length === 0
          ? title
          : left.map((duck) => <RelationBar key={duck.id} meter={meterFor(duck, meters)} />)}
      </div>
      <div className="px-2 pt-0.5 text-center">
        {left.length > 0 && right.length > 0 ? title : null}
      </div>
      <div className="flex flex-col items-end gap-2">
        {right.length > 0
          ? right.map((duck) => <RelationBar key={duck.id} meter={meterFor(duck, meters)} />)
          : left.length > 0
            ? title
            : null}
      </div>
    </header>
  );
}
