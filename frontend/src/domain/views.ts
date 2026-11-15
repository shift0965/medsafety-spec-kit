// Read-only queries the role views render (contracts/domain-api.md "Queries").
import type { Alert, AppState, Dose, Flag, FlagReason, PersonId, RiskLevel } from "./types";
import { EARLY_CONFIRM_MINUTES } from "./types";
import { addMinutes, describeRelative, formatHHMM, isSameDay } from "./time";
import { effectiveRisk, effectiveWindow, findMedication, usesDefaults } from "./medications";
import { findDose, latestConfirmation } from "./doses";

// FR-005
export function lastTakenAt(state: AppState, medId: string) {
  return latestConfirmation(state, medId);
}

function dosesOf(state: AppState, medId: string): Dose[] {
  return state.doses.filter((d) => d.medicationId === medId);
}

/** The latest of today's doses with dueAt ≤ now, in any status (including taken). */
export function currentDose(state: AppState, medId: string): Dose | null {
  const today = dosesOf(state, medId).filter((d) => isSameDay(d.dueAt, state.clock) && d.dueAt <= state.clock);
  return today[today.length - 1] ?? null;
}

/** The next dose after now, in any status (an early-confirmed dose is no longer `scheduled`). */
export function nextDose(state: AppState, medId: string): Dose | null {
  return dosesOf(state, medId).find((d) => d.dueAt > state.clock) ?? null;
}

/** Dose shown on a card: an early-confirmed upcoming dose, else the current dose, else the next. */
export function currentOrNextDose(state: AppState, medId: string): Dose | null {
  const upcoming = nextDose(state, medId);
  if (upcoming && upcoming.status !== "scheduled") return upcoming;
  return currentDose(state, medId) ?? upcoming;
}

const lastConfirmationOf = (d: Dose) => formatHHMM(d.confirmations[d.confirmations.length - 1]);

export function statusLabelForHarold(dose: Dose): string {
  const due = formatHHMM(dose.dueAt);
  switch (dose.status) {
    case "scheduled":
      return `Next dose at ${due}`;
    case "due":
      return `Due at ${due}`;
    case "taken":
      return `Taken at ${lastConfirmationOf(dose)}`;
    case "takenLate":
      return `Taken late at ${lastConfirmationOf(dose)}`;
    case "unsure":
      return `Not sure if taken (due ${due})`;
    case "missed":
      return `Not recorded (due ${due})`;
    case "duplicate":
      return `Recorded twice (${dose.confirmations.map(formatHHMM).join(" and ")})`;
  }
}

export function statusLabelForRachel(dose: Dose): string {
  const due = formatHHMM(dose.dueAt);
  switch (dose.status) {
    case "scheduled":
      return `Not due yet (${due})`;
    case "due":
      return `Due now (${due})`;
    case "taken":
      return `Taken at ${lastConfirmationOf(dose)}`;
    case "takenLate":
      return `Taken late at ${lastConfirmationOf(dose)}`;
    case "unsure":
      return `Harold wasn't sure if he took it (${due})`;
    case "missed":
      return `Missed (${due})`;
    case "duplicate":
      return `Taken twice (${dose.confirmations.map(formatHHMM).join(" and ")})`;
  }
}

function flagText(flag: Flag, dose: Dose): string {
  const base = {
    missed: `Not recorded within the window (due ${formatHHMM(dose.dueAt)})`,
    duplicate: "Recorded twice",
    unsure: `Marked "not sure" at ${formatHHMM(flag.raisedAt)}`,
  }[flag.reason];
  return flag.note ? `${base} — ${flag.note}` : base;
}

export interface HaroldCard {
  medicationId: string;
  name: string;
  riskLevel: RiskLevel;
  doseId: string | null;
  statusText: string;
  lastTakenText: string;
  /** Reminder with "I took it" / "I'm not sure" (FR-001, FR-007). */
  showReminder: boolean;
  /** Dose that "I took it" acts on; null hides the button (FR-003, 2-hour limit). */
  confirmTargetId: string | null;
  /** Missed high-risk dose: "Check with Dr. Nguyen" first (FR-015). */
  needsLateCheck: boolean;
  /** FR-008 advice after "I'm not sure". */
  unsureAdvice: string | null;
  flags: string[];
}

function confirmTarget(state: AppState, medId: string): Dose | null {
  const current = currentDose(state, medId);
  if (current?.status === "due") return current;
  const upcoming = nextDose(state, medId);
  if (upcoming && state.clock >= addMinutes(upcoming.dueAt, -EARLY_CONFIRM_MINUTES)) return upcoming;
  return current;
}

function haroldCards(state: AppState): HaroldCard[] {
  return state.medications.map((med) => {
    const dose = currentOrNextDose(state, med.id);
    const target = confirmTarget(state, med.id);
    const risk = dose?.riskLevel ?? effectiveRisk(med);
    const last = lastTakenAt(state, med.id);
    const lastTakenText = last ? `Last taken: ${describeRelative(last, state.clock)}` : "Not taken yet";
    let unsureAdvice: string | null = null;
    if (dose?.status === "unsure") {
      const told = risk === "high" ? "Dr. Nguyen has been told." : "It has been noted.";
      const lastLine = last ? `You last recorded it ${describeRelative(last, state.clock)}.` : "There is no record of taking it yet.";
      unsureAdvice = `${lastLine} Please wait before taking another. ${told}`;
    }
    return {
      medicationId: med.id,
      name: med.name,
      riskLevel: risk,
      doseId: dose?.id ?? null,
      statusText: dose ? statusLabelForHarold(dose) : "No dose scheduled",
      lastTakenText,
      showReminder: dose?.status === "due",
      confirmTargetId: target?.id ?? null,
      needsLateCheck: target?.status === "missed" && (target.riskLevel ?? effectiveRisk(med)) === "high",
      unsureAdvice,
      flags: dose ? state.flags.filter((f) => f.doseId === dose.id).map((f) => flagText(f, dose)) : [],
    };
  });
}

// FR-001–FR-008, FR-015, FR-017
export function haroldView(state: AppState) {
  return { cards: haroldCards(state), alerts: alertViews(state, "harold") };
}

export interface AlertView {
  id: string;
  urgency: Alert["urgency"];
  read: boolean;
  createdAt: string;
  medicationName: string;
  reason: FlagReason;
  text: string;
}

const reasonLabel: Record<FlagReason, string> = {
  missed: "Missed dose",
  duplicate: "Taken twice",
  unsure: "Patient not sure if taken",
};

function alertText(alert: Alert, flag: Flag, dose: Dose, medName: string): string {
  const due = formatHHMM(dose.dueAt);
  const times = dose.confirmations.map(formatHHMM).join(" and ");
  if (alert.recipient === "nguyen") {
    const note = flag.note ? ` (${flag.note})` : "";
    return `${medName} — ${reasonLabel[flag.reason]} — due ${due}${note}`;
  }
  const told = alert.urgency === "urgent" ? " Dr. Nguyen has been told." : " It has been noted.";
  const body = {
    missed: `${medName} (${due}) wasn't recorded.`,
    duplicate: `${medName} was recorded twice (${times}).`,
    unsure: `You weren't sure about ${medName} (${due}).`,
  }[flag.reason];
  return body + told;
}

// FR-016, FR-017, FR-018 (full-detail alerts; Rachel's "check in" messages come from rachelView)
export function alertViews(state: AppState, recipient: PersonId): AlertView[] {
  return state.alerts
    .filter((a) => a.recipient === recipient && a.contentLevel === "full")
    .map((a) => {
      const flag = state.flags.find((f) => f.id === a.flagId)!;
      const dose = findDose(state, flag.doseId);
      const med = findMedication(state, dose.medicationId);
      return {
        id: a.id,
        urgency: a.urgency,
        read: a.read,
        createdAt: a.createdAt,
        medicationName: med.name,
        reason: flag.reason,
        text: alertText(a, flag, dose, med.name),
      };
    })
    .sort((x, y) => Number(x.read) - Number(y.read) || y.createdAt.localeCompare(x.createdAt));
}

export interface NguyenMedicationRow {
  id: string;
  name: string;
  scheduleTimes: string[];
  windowMinutes: number;
  riskLevel: RiskLevel;
  usesDefaults: boolean;
}

export interface NguyenDoseRow {
  id: string;
  medicationName: string;
  dueTime: string;
  status: string;
  confirmations: string[];
  flags: string[];
}

// FR-010, FR-011, FR-016, FR-018
export function nguyenView(state: AppState) {
  const medications: NguyenMedicationRow[] = state.medications.map((m) => ({
    id: m.id,
    name: m.name,
    scheduleTimes: m.scheduleTimes,
    windowMinutes: effectiveWindow(m),
    riskLevel: effectiveRisk(m),
    usesDefaults: usesDefaults(m),
  }));
  const doseLog: NguyenDoseRow[] = state.doses
    .filter((d) => isSameDay(d.dueAt, state.clock))
    .map((d) => ({
      id: d.id,
      medicationName: findMedication(state, d.medicationId).name,
      dueTime: formatHHMM(d.dueAt),
      status: statusLabelForHarold(d),
      confirmations: d.confirmations.map(formatHHMM),
      flags: state.flags.filter((f) => f.doseId === d.id).map((f) => flagText(f, d)),
    }));
  return { medications, doseLog, alerts: alertViews(state, "nguyen") };
}
