// V2: Dr. Nguyen's "Flags awaiting advice" (FR-024, FR-025). Advice comes only from the fixed list.
import type { NguyenOpenFlag } from "../domain/views";
import { ADVICE_TEXT, type AdviceOption } from "../domain/types";

const reasonLabel = { missed: "Missed dose", duplicate: "Taken twice", unsure: "Not sure if taken" };
const OPTIONS: AdviceOption[] = ["takeNow", "skipNextDose", "takeNextAsUsual", "callMe"];

interface Props {
  flags: NguyenOpenFlag[];
  onAdvise: (flagId: string, option: AdviceOption) => void;
}

export default function AdvicePanel({ flags, onAdvise }: Props) {
  if (flags.length === 0) return <p className="muted">No flags awaiting advice.</p>;
  return (
    <ul className="advice-panel">
      {flags.map((f) => (
        <li key={f.flagId} className="advice-panel__item">
          <p>
            <strong>{f.medicationName}</strong> — {reasonLabel[f.reason]} — due {f.dueTime} — {f.riskLevel} risk
          </p>
          <p className="muted">Record: {f.record}</p>
          {f.request && <p className="advice-panel__request">{f.request}</p>}
          <div className="advice-panel__buttons">
            {OPTIONS.map((o) => (
              <button key={o} onClick={() => onAdvise(f.flagId, o)}>
                {ADVICE_TEXT[o]}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
