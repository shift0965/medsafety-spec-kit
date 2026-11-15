// Flag creation (G-22). Every flag is routed to alerts in the same update (FR-016, FR-017).
import type { AppState, Flag, FlagReason, Instant } from "./types";
import { routeFlag } from "./alerts";
import { effectiveRisk } from "./medications";

// FR-012, FR-013: at most one flag per (dose, reason)
export function raiseFlag(state: AppState, doseId: string, reason: FlagReason, at: Instant): AppState {
  const id = `flag:${doseId}:${reason}`;
  if (state.flags.some((f) => f.id === id)) return state;
  const dose = state.doses.find((d) => d.id === doseId);
  if (!dose) throw new Error(`Unknown dose ${doseId}`);
  const med = state.medications.find((m) => m.id === dose.medicationId)!;
  const flag: Flag = {
    id,
    doseId,
    reason,
    raisedAt: at,
    riskLevel: dose.riskLevel ?? effectiveRisk(med),
    note: null,
  };
  return routeFlag({ ...state, flags: [...state.flags, flag] }, flag);
}

export function flagsForDose(state: AppState, doseId: string): Flag[] {
  return state.flags.filter((f) => f.doseId === doseId);
}
