// Per-medication window and risk settings (G-38).
import { DEFAULT_RISK, DEFAULT_WINDOW_MINUTES } from "./types";
import type { AppState, Medication, RiskLevel } from "./types";

// FR-011
export function effectiveWindow(med: Medication): number {
  return med.windowMinutes ?? DEFAULT_WINDOW_MINUTES;
}

// FR-011
export function effectiveRisk(med: Medication): RiskLevel {
  return med.riskLevel ?? DEFAULT_RISK;
}

// FR-011
export function usesDefaults(med: Medication): boolean {
  return med.windowMinutes === null || med.riskLevel === null;
}

export function findMedication(state: AppState, medId: string): Medication {
  const med = state.medications.find((m) => m.id === medId);
  if (!med) throw new Error(`Unknown medication ${medId}`);
  return med;
}

// FR-010, FR-011: only the medication changes; doses still `scheduled` pick up the new values when
// they become due, doses that already left `scheduled` keep their snapshot (spec edge case).
export function setMedicationSettings(
  state: AppState,
  medId: string,
  settings: { windowMinutes: number; riskLevel: RiskLevel },
): AppState {
  findMedication(state, medId);
  const { windowMinutes, riskLevel } = settings;
  if (!Number.isInteger(windowMinutes) || windowMinutes < 5 || windowMinutes > 240) {
    throw new Error("Window must be a whole number of minutes from 5 to 240");
  }
  if (riskLevel !== "high" && riskLevel !== "low") {
    throw new Error("Risk level must be high or low");
  }
  return {
    ...state,
    medications: state.medications.map((m) => (m.id === medId ? { ...m, windowMinutes, riskLevel } : m)),
  };
}
