// FR-009: shown instead of recording when a dose is already recorded or the medication was
// confirmed less than 6 hours ago.
import type { DuplicateChoice } from "../domain/doses";
import { formatHHMM } from "../domain/time";

interface Props {
  medicationName: string;
  previousConfirmation: string;
  onChoose: (choice: DuplicateChoice) => void;
}

export default function ConfirmDuplicateDialog({ medicationName, previousConfirmation, onChoose }: Props) {
  return (
    <div className="dialog-backdrop">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dup-title">
        <h2 id="dup-title">{medicationName}</h2>
        <p>You recorded this at {formatHHMM(previousConfirmation)}.</p>
        <div className="dialog__actions">
          <button className="btn" onClick={() => onChoose("tookAnother")}>
            Yes, I took another
          </button>
          <button className="btn btn--primary" onClick={() => onChoose("mistake")}>
            No, I tapped by mistake
          </button>
          <button className="btn" onClick={() => onChoose("unsure")}>
            I'm not sure
          </button>
        </div>
      </div>
    </div>
  );
}
