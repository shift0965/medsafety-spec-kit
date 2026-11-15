// FR-015 (V2): before recording a missed high-risk dose. The app gives no dosing advice of its own
// (FR-028); both choices send Dr. Nguyen an advice request.
interface Props {
  medicationName: string;
  onAsk: () => void;
  onAlreadyTook: () => void;
  onBack: () => void;
}

export default function LateDoseDialog({ medicationName, onAsk, onAlreadyTook, onBack }: Props) {
  return (
    <div className="dialog-backdrop">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="late-title">
        <h2 id="late-title">{medicationName}</h2>
        <p>This dose is late. Ask Dr. Nguyen before taking it.</p>
        <div className="dialog__actions">
          <button className="btn btn--primary" onClick={onAsk}>
            Ask Dr. Nguyen
          </button>
          <button className="btn" onClick={onAlreadyTook}>
            I already took it
          </button>
          <button className="btn" onClick={onBack}>
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
