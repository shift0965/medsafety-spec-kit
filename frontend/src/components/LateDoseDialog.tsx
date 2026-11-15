// FR-015: before recording a missed high-risk dose. The app gives no dosing advice of its own.
interface Props {
  medicationName: string;
  onRecord: () => void;
  onBack: () => void;
}

export default function LateDoseDialog({ medicationName, onRecord, onBack }: Props) {
  return (
    <div className="dialog-backdrop">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="late-title">
        <h2 id="late-title">{medicationName}</h2>
        <p>Check with Dr. Nguyen about this late dose.</p>
        <div className="dialog__actions">
          <button className="btn btn--primary" onClick={onRecord}>
            Record that I took it
          </button>
          <button className="btn" onClick={onBack}>
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
