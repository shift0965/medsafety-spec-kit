// Harold's consent choices for Rachel (FR-020, FR-022). The in-app toggle stands in for consent
// for the demo only; whether it counts as written consent is an open question (C2).
import { useStore } from "../state/store";

export default function SharingSettings() {
  const { state, dispatch } = useStore();
  return (
    <section className="sharing" aria-labelledby="sharing-title">
      <h2 id="sharing-title">What Rachel can see</h2>
      <label className="toggle">
        <input
          type="checkbox"
          checked={state.consent.rachelIsSafetyContact}
          onChange={(e) => dispatch({ type: "SET_SAFETY_CONTACT", enabled: e.target.checked })}
        />
        <span>
          <strong>Rachel is my safety contact</strong>
          <small>She gets a "please check in" message for serious problems. She does not see your medicines.</small>
        </span>
      </label>
      {state.medications.map((m) => (
        <label className="toggle" key={m.id}>
          <input
            type="checkbox"
            checked={m.sharedWithRachel}
            onChange={(e) => dispatch({ type: "SET_SHARED", medId: m.id, shared: e.target.checked })}
          />
          <span>
            <strong>Share {m.name} with Rachel</strong>
            <small>She sees the name, time and whether it was taken.</small>
          </span>
        </label>
      ))}
    </section>
  );
}
