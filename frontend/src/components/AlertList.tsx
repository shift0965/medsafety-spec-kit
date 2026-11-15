// Alerts and notices for one recipient (FR-016, FR-017, FR-018, FR-021).
// Urgent alerts are a prominent banner, routine ones are calm notices; read items are hidden.
import type { AlertView } from "../domain/views";
import type { RachelMessage } from "../domain/consent";
import { formatHHMM } from "../domain/time";
import { useStore } from "../state/store";

type Props =
  | { mode: "full"; alerts: AlertView[] }
  | { mode: "checkInOnly"; alerts: RachelMessage[] };

export default function AlertList(props: Props) {
  const { dispatch } = useStore();
  const markRead = (alertId: string) => dispatch({ type: "MARK_ALERT_READ", alertId });
  const unread = props.alerts.filter((a) => !a.read);
  if (unread.length === 0) return null;

  if (props.mode === "checkInOnly") {
    return (
      <ul className="alerts">
        {(unread as RachelMessage[]).map((a) => (
          <li key={a.id} className="alert alert--urgent">
            <span className="alert__text">Please check in with Harold.</span>
            <span className="alert__time">{formatHHMM(a.createdAt)}</span>
            <button onClick={() => markRead(a.id)}>OK</button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="alerts">
      {(unread as AlertView[]).map((a) => (
        <li key={a.id} className={`alert alert--${a.urgency}`}>
          <span className="alert__text">{a.text}</span>
          <span className="alert__time">{formatHHMM(a.createdAt)}</span>
          <button onClick={() => markRead(a.id)}>OK</button>
        </li>
      ))}
    </ul>
  );
}
