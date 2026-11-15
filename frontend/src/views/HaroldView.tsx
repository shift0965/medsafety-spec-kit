// Harold's large-print view (G-36): reminders, one-tap confirm, "not sure", alerts, sharing.
import { useState } from "react";
import { useStore } from "../state/store";
import { haroldView, type HaroldCard } from "../domain/views";
import { confirmDose } from "../domain/doses";
import MedicationCard from "../components/MedicationCard";
import AlertList from "../components/AlertList";
import ConfirmDuplicateDialog from "../components/ConfirmDuplicateDialog";
import LateDoseDialog from "../components/LateDoseDialog";
import SharingSettings from "../components/SharingSettings";

type Pending =
  | { kind: "late"; card: HaroldCard; doseId: string }
  | { kind: "duplicate"; card: HaroldCard; doseId: string; previousConfirmation: string };

export default function HaroldView() {
  const { state, dispatch } = useStore();
  const [pending, setPending] = useState<Pending | null>(null);
  const view = haroldView(state);

  // FR-009: ask the domain first; only record when no duplicate prompt is needed
  const confirm = (card: HaroldCard, doseId: string) => {
    try {
      const result = confirmDose(state, doseId);
      if (result.needsDuplicateChoice && result.previousConfirmation) {
        setPending({ kind: "duplicate", card, doseId, previousConfirmation: result.previousConfirmation });
        return;
      }
      dispatch({ type: "CONFIRM_DOSE", doseId });
    } catch (err) {
      console.warn("[medsafety] confirm rejected", err);
    }
    setPending(null);
  };

  const onTookIt = (card: HaroldCard) => {
    if (!card.confirmTargetId) return;
    if (card.needsLateCheck) {
      setPending({ kind: "late", card, doseId: card.confirmTargetId }); // FR-015
      return;
    }
    confirm(card, card.confirmTargetId);
  };

  const onNotSure = (card: HaroldCard) => {
    if (card.doseId) dispatch({ type: "MARK_UNSURE", doseId: card.doseId });
  };

  return (
    <div className="harold">
      <h1 className="view-title">Your medicines</h1>
      <AlertList mode="full" alerts={view.alerts} />
      <div className="med-list">
        {view.cards.map((card) => (
          <MedicationCard key={card.medicationId} card={card} onTookIt={onTookIt} onNotSure={onNotSure} />
        ))}
      </div>
      <SharingSettings />

      {pending?.kind === "late" && (
        <LateDoseDialog
          medicationName={pending.card.name}
          onRecord={() => confirm(pending.card, pending.doseId)}
          onBack={() => setPending(null)}
        />
      )}
      {pending?.kind === "duplicate" && (
        <ConfirmDuplicateDialog
          medicationName={pending.card.name}
          previousConfirmation={pending.previousConfirmation}
          onChoose={(choice) => {
            dispatch({ type: "RESOLVE_DUPLICATE", doseId: pending.doseId, choice });
            setPending(null);
          }}
        />
      )}
    </div>
  );
}
