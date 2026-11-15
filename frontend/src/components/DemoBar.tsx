// Demo controls for the simulated clock (research R3). Not part of any role's view.
import { useState } from "react";
import { useStore } from "../state/store";
import { nextEvent } from "../domain/clock";
import { addMinutes, atTime, dayOf, formatHHMM } from "../domain/time";

export default function DemoBar() {
  const { state, dispatch } = useStore();
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const next = nextEvent(state);

  const advance = (minutes: number) => {
    setMessage(null);
    dispatch({ type: "TICK", now: addMinutes(state.clock, minutes) });
  };

  const goTo = () => {
    if (!target) return;
    const now = atTime(dayOf(state.clock), target);
    if (now < state.clock) {
      setMessage("Time can only move forward. Use Reset demo to start over.");
      return;
    }
    setMessage(null);
    dispatch({ type: "TICK", now });
  };

  return (
    <section className="demo-bar" aria-label="Demo controls">
      <div className="demo-bar__label">Demo controls</div>
      <div className="demo-bar__clock">
        Simulated time <strong>{formatHHMM(state.clock)}</strong>
        <span className="demo-bar__day">{dayOf(state.clock)}</span>
      </div>
      <div className="demo-bar__buttons">
        <button onClick={() => advance(5)}>+5 min</button>
        <button onClick={() => advance(15)}>+15 min</button>
        <button onClick={() => advance(60)}>+1 h</button>
        <button disabled={!next} onClick={() => next && dispatch({ type: "TICK", now: next })}>
          Next event{next ? ` (${formatHHMM(next)})` : ""}
        </button>
        <label className="demo-bar__goto">
          Go to
          <input type="time" value={target} onChange={(e) => setTarget(e.target.value)} />
        </label>
        <button onClick={goTo} disabled={!target}>
          Go
        </button>
        <button className="demo-bar__reset" onClick={() => dispatch({ type: "RESET" })}>
          Reset demo
        </button>
      </div>
      {message && <div className="demo-bar__message">{message}</div>}
    </section>
  );
}
