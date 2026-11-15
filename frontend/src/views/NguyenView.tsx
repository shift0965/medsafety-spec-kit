// Dr. Nguyen's view: per-medication window and risk (G-38), urgent alerts, today's dose log.
import { useState } from "react";
import { useStore } from "../state/store";
import { nguyenView, type NguyenMedicationRow } from "../domain/views";
import { setMedicationSettings } from "../domain/medications";
import type { RiskLevel } from "../domain/types";
import AlertList from "../components/AlertList";

function SettingsRow({ row }: { row: NguyenMedicationRow }) {
  const { state, dispatch } = useStore();
  const [windowMinutes, setWindow] = useState(String(row.windowMinutes));
  const [riskLevel, setRisk] = useState<RiskLevel>(row.riskLevel);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = () => {
    const settings = { windowMinutes: Number(windowMinutes), riskLevel };
    try {
      setMedicationSettings(state, row.id, settings); // validate before dispatching
    } catch (err) {
      setError((err as Error).message);
      setSaved(false);
      return;
    }
    setError(null);
    setSaved(true);
    dispatch({ type: "SET_MEDICATION_SETTINGS", medId: row.id, ...settings });
  };

  return (
    <tr>
      <th scope="row">
        {row.name}
        {row.usesDefaults && <span className="badge">default (60 min, high)</span>}
      </th>
      <td>{row.scheduleTimes.join(", ")}</td>
      <td>
        <input
          type="number"
          min={5}
          max={240}
          aria-label={`${row.name} window in minutes`}
          value={windowMinutes}
          onChange={(e) => {
            setWindow(e.target.value);
            setSaved(false);
          }}
        />
      </td>
      <td>
        <select
          aria-label={`${row.name} risk level`}
          value={riskLevel}
          onChange={(e) => {
            setRisk(e.target.value as RiskLevel);
            setSaved(false);
          }}
        >
          <option value="high">High</option>
          <option value="low">Low</option>
        </select>
      </td>
      <td>
        <button onClick={save}>Save</button>
        {saved && <span className="saved">Saved</span>}
        {error && <div className="error">{error}</div>}
      </td>
    </tr>
  );
}

export default function NguyenView() {
  const { state } = useStore();
  const view = nguyenView(state);
  return (
    <div className="nguyen">
      <h1 className="view-title">Dr. Nguyen — community pharmacist</h1>
      <h2>Urgent alerts</h2>
      {view.alerts.some((a) => !a.read) ? (
        <AlertList mode="full" alerts={view.alerts} />
      ) : (
        <p className="muted">No new alerts.</p>
      )}

      <h2>Medication settings for Harold</h2>
      <p className="muted">Window: how long after the due time a dose may still be taken. Changes apply from the next due dose.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Medication</th>
              <th>Times</th>
              <th>Window (min)</th>
              <th>Risk</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {view.medications.map((row) => (
              <SettingsRow key={`${row.id}:${row.windowMinutes}:${row.riskLevel}:${row.usesDefaults}`} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <h2>Today's doses</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Due</th>
              <th>Medication</th>
              <th>Status</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {view.doseLog.map((d) => (
              <tr key={d.id}>
                <td>{d.dueTime}</td>
                <td>{d.medicationName}</td>
                <td>{d.status}</td>
                <td>{d.flags.join("; ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
