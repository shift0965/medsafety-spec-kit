// Rachel's consent tiers (C2): nothing by default, "check in" messages as safety contact,
// name/due time/status for shared medications only.
import type { AppState, Instant } from "./types";
import { findMedication } from "./medications";
import { currentOrNextDose, statusLabelForRachel } from "./views";

// FR-020
export function setSafetyContact(state: AppState, enabled: boolean): AppState {
  return { ...state, consent: { ...state.consent, rachelIsSafetyContact: enabled } };
}

// FR-022
export function setShared(state: AppState, medId: string, shared: boolean): AppState {
  findMedication(state, medId);
  return {
    ...state,
    medications: state.medications.map((m) => (m.id === medId ? { ...m, sharedWithRachel: shared } : m)),
  };
}

export interface RachelMedication {
  id: string;
  name: string;
  dueTimes: string[];
  status: string;
}

export interface RachelMessage {
  id: string;
  createdAt: Instant;
  read: boolean;
}

export interface RachelView {
  nothingShared: boolean;
  isSafetyContact: boolean;
  medications: RachelMedication[];
  messages: RachelMessage[];
}

// FR-019, FR-021, FR-022: only shared medications, and alerts reduced to "check in" with a time
export function rachelView(state: AppState): RachelView {
  const shared = state.medications.filter((m) => m.sharedWithRachel);
  const medications = shared.map((m) => {
    const dose = currentOrNextDose(state, m.id);
    return {
      id: m.id,
      name: m.name,
      dueTimes: m.scheduleTimes,
      status: dose ? statusLabelForRachel(dose) : "No dose today",
    };
  });
  const messages = state.alerts
    .filter((a) => a.recipient === "rachel")
    .map((a) => ({ id: a.id, createdAt: a.createdAt, read: a.read }));
  return {
    nothingShared: shared.length === 0 && !state.consent.rachelIsSafetyContact,
    isSafetyContact: state.consent.rachelIsSafetyContact,
    medications,
    messages,
  };
}
