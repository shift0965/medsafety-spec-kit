// One medication on Harold's large-print view (FR-001, FR-003, FR-005, FR-006, FR-007, FR-008).
import type { HaroldCard } from "../domain/views";

interface Props {
  card: HaroldCard;
  onTookIt: (card: HaroldCard) => void;
  onNotSure: (card: HaroldCard) => void;
}

export default function MedicationCard({ card, onTookIt, onNotSure }: Props) {
  return (
    <article className={`med-card${card.showReminder ? " med-card--reminder" : ""}`}>
      <h2 className="med-card__name">{card.name}</h2>
      {card.showReminder && <p className="med-card__reminder">Time for your {card.name}</p>}
      <p className="med-card__status">{card.statusText}</p>
      <p className="med-card__last">{card.lastTakenText}</p>
      {card.unsureAdvice && <p className="med-card__advice">{card.unsureAdvice}</p>}
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
