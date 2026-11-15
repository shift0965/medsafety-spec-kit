// One medication on Harold's large-print view (FR-001, FR-003, FR-005–FR-008; V2: FR-026–FR-028).
import type { HaroldCard } from "../domain/views";

interface Props {
  card: HaroldCard;
  onTookIt: (card: HaroldCard) => void;
  onNotSure: (card: HaroldCard) => void;
  onAcknowledge: (adviceId: string) => void;
}

export default function MedicationCard({ card, onTookIt, onNotSure, onAcknowledge }: Props) {
  return (
    <article className={`med-card${card.showReminder ? " med-card--reminder" : ""}`}>
      <h2 className="med-card__name">{card.name}</h2>
      {card.showReminder && <p className="med-card__reminder">Time for your {card.name}</p>}
      <p className="med-card__status">{card.statusText}</p>
      <p className="med-card__last">{card.lastTakenText}</p>
      {card.waitingForAdvice && <p className="med-card__advice">{card.waitingForAdvice}</p>}
      {card.advice.map((a) => (
        <div key={a.id} className="med-card__nguyen">
          <p>{a.text}</p>
          <button onClick={() => onAcknowledge(a.id)}>OK</button>
        </div>
      ))}
      {card.flags.length > 0 && (
        <ul className="med-card__flags">
          {card.flags.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      <div className="med-card__actions">
        {card.confirmTargetId && (
          <button className="btn btn--primary" onClick={() => onTookIt(card)}>
            I took it
          </button>
        )}
        {card.showReminder && (
          <button className="btn" onClick={() => onNotSure(card)}>
            I'm not sure
          </button>
        )}
      </div>
    </article>
  );
}
