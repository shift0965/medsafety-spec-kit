// Rachel's view: only what Harold has chosen to share (FR-019, FR-021, FR-022).
import { useStore } from "../state/store";
import { rachelView } from "../domain/consent";
import AlertList from "../components/AlertList";

export default function RachelView() {
  const { state } = useStore();
  const view = rachelView(state);

  if (view.nothingShared) {
    return (
      <div className="rachel">
        <h1 className="view-title">Rachel</h1>
        <p className="empty">Harold hasn't shared anything with you.</p>
      </div>
    );
  }

  return (
    <div className="rachel">
      <h1 className="view-title">Rachel</h1>
      {view.isSafetyContact && (
        <>
          <h2>Safety messages</h2>
          {view.messages.some((m) => !m.read) ? (
            <AlertList mode="checkInOnly" alerts={view.messages} />
          ) : (
            <p className="muted">No new messages.</p>
          )}
        </>
      )}
      {view.medications.length > 0 && (
        <>
          <h2>Medicines Harold shares with you</h2>
          <ul className="shared-list">
            {view.medications.map((m) => (
              <li key={m.id}>
                <strong>{m.name}</strong> · due {m.dueTimes.join(", ")} · {m.status}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
