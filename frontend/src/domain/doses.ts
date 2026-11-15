// Dose generation, confirmation, "I'm not sure" and the FR-009 duplicate prompt.
import type { AppState, Dose, Instant } from "./types";
import { EARLY_CONFIRM_MINUTES, REPEAT_CHECK_MINUTES } from "./types";
import { addMinutes, atTime, formatHHMM, minutesBetween } from "./time";
import { effectiveRisk, effectiveWindow, findMedication } from "./medications";
import { raiseFlag } from "./flags";
import { advisedSinceLastConfirmation } from "./advice";

export function findDose(state: AppState, doseId: string): Dose {
  const dose = state.doses.find((d) => d.id === doseId);
  if (!dose) throw new Error(`Unknown dose ${doseId}`);
  return dose;
}

function updateDose(state: AppState, doseId: string, change: Partial<Dose>): AppState {
  return { ...state, doses: state.doses.map((d) => (d.id === doseId ? { ...d, ...change } : d)) };
}

// FR-001, FR-011: one dose per medication per schedule time; settings are not snapshotted yet
export function ensureDosesForDay(state: AppState, day: string): AppState {
  const existing = new Set(state.doses.map((d) => d.id));
  const added: Dose[] = [];
  for (const med of state.medications) {
    for (const time of med.scheduleTimes) {
      const dueAt = atTime(day, time);
      const id = `${med.id}@${dueAt}`;
      if (existing.has(id)) continue;
      added.push({
        id,
        medicationId: med.id,
        dueAt,
        windowMinutes: null,
        riskLevel: null,
        status: "scheduled",
        confirmations: [],
        unsureAt: null,
        reminderShownAt: null,
        releasedAt: null,
      });
    }
  }
  if (added.length === 0) return state;
  const doses = [...state.doses, ...added].sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id));
  return { ...state, doses };
}

// FR-010, FR-011: copy the medication's effective window/risk onto a dose leaving `scheduled`
export function snapshotSettings(state: AppState, doseId: string): AppState {
  const dose = findDose(state, doseId);
  if (dose.windowMinutes !== null && dose.riskLevel !== null) return state;
  const med = findMedication(state, dose.medicationId);
  return updateDose(state, doseId, { windowMinutes: effectiveWindow(med), riskLevel: effectiveRisk(med) });
}

// R13: a held dose released after its due time counts its window from the release
export function windowClosesAt(state: AppState, dose: Dose): Instant {
  const window = dose.windowMinutes ?? effectiveWindow(findMedication(state, dose.medicationId));
  return addMinutes(dose.releasedAt ?? dose.dueAt, window);
}

/** Latest confirmation time for a medication across all its doses (FR-005). */
export function latestConfirmation(state: AppState, medId: string): Instant | null {
  let latest: Instant | null = null;
  for (const d of state.doses) {
    if (d.medicationId !== medId) continue;
    for (const c of d.confirmations) if (latest === null || c > latest) latest = c;
  }
  return latest;
}

/** The dose holding the medication's latest confirmation (FR-009 target). */
export function mostRecentConfirmedDose(state: AppState, medId: string): Dose | null {
  const latest = latestConfirmation(state, medId);
  if (latest === null) return null;
  return state.doses.find((d) => d.medicationId === medId && d.confirmations.includes(latest)) ?? null;
}

// FR-009: an already-confirmed dose, or a medication confirmed less than 6 h ago, opens the prompt.
// FR-027 (V2): not after advice given since the latest confirmation.
function needsDuplicatePrompt(state: AppState, dose: Dose): boolean {
  if (advisedSinceLastConfirmation(state, dose.medicationId)) return false;
  if (dose.confirmations.length > 0) return true;
  const latest = latestConfirmation(state, dose.medicationId);
  return latest !== null && minutesBetween(latest, state.clock) < REPEAT_CHECK_MINUTES;
}

export interface ConfirmResult {
  state: AppState;
  needsDuplicateChoice: boolean;
  /** Time shown in the FR-009 prompt ("You recorded this at …"). */
  previousConfirmation: Instant | null;
}

// FR-002, FR-003, FR-004, FR-009, FR-015
export function confirmDose(state: AppState, doseId: string): ConfirmResult {
  const dose = findDose(state, doseId);
  if (needsDuplicatePrompt(state, dose)) {
    return { state, needsDuplicateChoice: true, previousConfirmation: latestConfirmation(state, dose.medicationId) };
  }
  const now = state.clock;
  const confirmed = { confirmations: [...dose.confirmations, now] };
  let next: AppState;
  switch (dose.status) {
    case "scheduled": {
      // Early dose: only within 2 h before the due time (FR-003, spec edge case)
      if (now < addMinutes(dose.dueAt, -EARLY_CONFIRM_MINUTES)) {
        throw new Error(`Too early to confirm ${doseId}`);
      }
      next = updateDose(snapshotSettings(state, doseId), doseId, { ...confirmed, status: "taken" });
      break;
    }
    case "due":
    case "unsure": // "unsure then later remembers": the unsure flag is kept
      next = updateDose(state, doseId, { ...confirmed, status: "taken" });
      break;
    case "missed": {
      // FR-015: recorded as taken late; the flag stays, alerts are never withdrawn
      const note = `taken late at ${formatHHMM(now)}`;
      next = updateDose(state, doseId, { ...confirmed, status: "takenLate" });
      next = {
        ...next,
        flags: next.flags.map((f) => (f.doseId === doseId && f.reason === "missed" ? { ...f, note } : f)),
      };
      break;
    }
    default:
      throw new Error(`Cannot confirm dose ${doseId} with status ${dose.status}`);
  }
  return { state: next, needsDuplicateChoice: false, previousConfirmation: null };
}

// FR-007, FR-008, FR-013
export function markUnsure(state: AppState, doseId: string): AppState {
  const dose = findDose(state, doseId);
  if (dose.status === "unsure") return state;
  if (dose.status !== "due" && dose.status !== "taken" && dose.status !== "takenLate") {
    throw new Error(`Cannot mark dose ${doseId} unsure with status ${dose.status}`);
  }
  const next = updateDose(state, doseId, { unsureAt: state.clock, status: "unsure" });
  return raiseFlag(next, doseId, "unsure", state.clock);
}

export type DuplicateChoice = "tookAnother" | "mistake" | "unsure";

// FR-009, FR-013: acts on the medication's most recent confirmed dose; the triggering dose is
// never changed (in the 6-hour case it stays scheduled and still gets its reminder).
export function resolveDuplicateChoice(state: AppState, doseId: string, choice: DuplicateChoice): AppState {
  const dose = findDose(state, doseId);
  if (!needsDuplicatePrompt(state, dose)) {
    throw new Error(`Dose ${doseId} does not need the duplicate prompt`);
  }
  if (choice === "mistake") return state;
  const target = mostRecentConfirmedDose(state, dose.medicationId)!;
  if (choice === "tookAnother") {
    const next = updateDose(state, target.id, {
      confirmations: [...target.confirmations, state.clock],
      status: "duplicate",
    });
    return raiseFlag(next, target.id, "duplicate", state.clock);
  }
  // "I'm not sure": a dose already flagged duplicate keeps its (urgent-or-routine) duplicate flag
  if (target.status === "duplicate" || target.status === "unsure") return state;
  return markUnsure(state, target.id);
}
