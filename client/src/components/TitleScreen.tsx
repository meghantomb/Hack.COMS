import { titleBackgroundSrc, titleLogoSrc } from "../assets/manifest";
import "../styles/title-screen.css";

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
    <div className="title-screen">
      <img
        className="title-screen__background"
        src={titleBackgroundSrc()}
        alt=""
        draggable={false}
      />
      <img
        className="title-screen__title"
        src={titleLogoSrc()}
        alt="What the Duck?"
        draggable={false}
      />

      <div className="title-screen__actions">
        <button
          type="button"
          className="title-screen__btn title-screen__btn--primary"
          disabled={busy}
          onClick={onNewGame}
        >
          New Game
        </button>
        {canContinue && (
          <button
            type="button"
            className="title-screen__btn title-screen__btn--primary"
            disabled={busy}
            onClick={onContinue}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
