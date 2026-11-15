// Read-only queries the role views render (contracts/domain-api.md "Queries").
import type { Advice, Alert, AppState, Dose, Flag, FlagReason, PersonId, RiskLevel } from "./types";
import { ADVICE_TEXT, EARLY_CONFIRM_MINUTES } from "./types";
import { addMinutes, describeRelative, formatHHMM, isSameDay } from "./time";
import { effectiveRisk, effectiveWindow, findMedication, usesDefaults } from "./medications";
import { findDose, latestConfirmation } from "./doses";
import { heldDose } from "./advice";

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
      return `Recorded twice (${dose.confirmations.map(formatHHMM).join(" and ")})`;    case "held":
      return "Waiting for Dr. Nguyen's advice"; // FR-009
    case "skipped":
      return "Skipped (Dr. Nguyen's advice)"; // FR-027
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
      return `Taken twice (${dose.confirmations.map(formatHHMM).join(" and ")})`;    case "held":
      return `On hold (${due})`; // never the advice itself (C2)
    case "skipped":
      return `Skipped (${due})`;
  }
}

// V2: Harold sees advice only as "Dr. Nguyen: <advice>" (FR-026, FR-028)
const adviceText = (a: Advice) => `Dr. Nguyen: ${ADVICE_TEXT[a.option]}`;

function flagText(state: AppState, flag: Flag, dose: Dose): string {
  const base = {
    missed: `Not recorded within the window (due ${formatHHMM(dose.dueAt)})`,
    duplicate: "Recorded twice",
    unsure: `Marked "not sure" at ${formatHHMM(flag.raisedAt)}`,
  }[flag.reason];
  let text = flag.note ? `${base} — ${flag.note}` : base;
  // FR-027: resolved flags stay visible with the advice and its time
  const advice = state.advice.find((a) => a.flagId === flag.id);
  if (flag.status === "resolved" && advice) text += ` — resolved — ${adviceText(advice)} at ${formatHHMM(advice.givenAt)}`;
  return text;
}

const WAIT_FOR_ANOTHER = "Please wait for Dr. Nguyen's advice before taking another.";
const WAIT_FOR_IT = "Please wait for Dr. Nguyen's advice before taking it.";

const flagsOfMedication = (state: AppState, medId: string) =>
  state.flags.filter((f) => findDose(state, f.doseId).medicationId === medId);

// FR-008, FR-009, FR-015, FR-028: the only instruction while a flag awaits advice; an open missed
// flag without "Ask Dr. Nguyen" shows only its status
function waitingMessage(state: AppState, medId: string): string | null {
  const open = flagsOfMedication(state, medId).filter((f) => f.status === "open");
  if (open.some((f) => f.reason === "duplicate" || f.reason === "unsure")) return WAIT_FOR_ANOTHER;
  if (open.some((f) => f.reason === "missed" && f.takenBeforeRequest === false)) return WAIT_FOR_IT;
  return null;
}

/** Doses an open unsure/duplicate flag is holding, including ones not yet due (R11). */
function heldIds(state: AppState): Set<string> {
  return new Set(state.flags.map((f) => heldDose(state, f)?.id).filter((id): id is string => id !== undefined));
}

export interface AdviceNotice {
  id: string;
  medicationName: string;
  text: string;
}

// FR-026: unacknowledged advice, shown until Harold taps OK
function adviceNotices(state: AppState, medId?: string): AdviceNotice[] {
  return state.advice
    .filter((a) => !a.acknowledged)
    .map((a) => ({ a, dose: findDose(state, findFlag(state, a.flagId).doseId) }))
    .filter(({ dose }) => medId === undefined || dose.medicationId === medId)
    .map(({ a, dose }) => ({ id: a.id, medicationName: findMedication(state, dose.medicationId).name, text: adviceText(a) }));
}

const findFlag = (state: AppState, flagId: string) => state.flags.find((f) => f.id === flagId)!;

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
  /** Missed high-risk dose with an open flag: the late-dose check first (FR-015, FR-027). */
  needsLateCheck: boolean;
  /** V2: the waiting message, the card's only instruction while a flag awaits advice (FR-028). */
  waitingForAdvice: string | null;
  /** V2: the medication's next dose is held (FR-008, FR-009). */
  onHold: boolean;
  /** V2: unacknowledged "Dr. Nguyen: …" advice for this medication (FR-026). */
  advice: AdviceNotice[];
  flags: string[];
}

function confirmTarget(state: AppState, medId: string): Dose | null {
  const current = currentDose(state, medId);
  if (current?.status === "due") return current;
  const upcoming = nextDose(state, medId);
  const target =
    upcoming && state.clock >= addMinutes(upcoming.dueAt, -EARLY_CONFIRM_MINUTES) ? upcoming : current;
  // V2: no "I took it" for a held or skipped dose, or one an open flag will hold (FR-009, FR-027)
  if (!target || target.status === "held" || target.status === "skipped" || heldIds(state).has(target.id)) return null;
  return target;
}

function haroldCards(state: AppState): HaroldCard[] {
  return state.medications.map((med) => {
    const dose = currentOrNextDose(state, med.id);
    const target = confirmTarget(state, med.id);
    const risk = dose?.riskLevel ?? effectiveRisk(med);
    const last = lastTakenAt(state, med.id);
    const lastTakenText = last ? `Last taken: ${describeRelative(last, state.clock)}` : "Not taken yet";
    const held = heldIds(state);
    const missedFlag = target && state.flags.find((f) => f.doseId === target.id && f.reason === "missed");
    return {
      medicationId: med.id,
      name: med.name,
      riskLevel: risk,
      doseId: dose?.id ?? null,
      statusText: dose ? statusLabelForHarold(dose) : "No dose scheduled",
      lastTakenText,
      showReminder: dose?.status === "due",
      confirmTargetId: target?.id ?? null,
      needsLateCheck:
        target?.status === "missed" &&
        (target.riskLevel ?? effectiveRisk(med)) === "high" &&
        missedFlag?.status === "open",
      waitingForAdvice: waitingMessage(state, med.id),
      onHold: state.doses.some((d) => d.medicationId === med.id && (d.status === "held" || held.has(d.id))),
      advice: adviceNotices(state, med.id),
      flags: dose ? state.flags.filter((f) => f.doseId === dose.id).map((f) => flagText(state, f, dose)) : [],
    };
  });
}

// FR-001–FR-009, FR-015, FR-017, FR-026, FR-028
export function haroldView(state: AppState) {
  return { cards: haroldCards(state), alerts: alertViews(state, "harold"), adviceNotices: adviceNotices(state) };
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
  if (alert.kind === "adviceRequest") {
    // FR-015 (V2)
    return `${medName} — advice requested — due ${due} (already taken: ${flag.takenBeforeRequest ? "yes" : "no"})`;
  }
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

export interface NguyenOpenFlag {
  flagId: string;
  medicationName: string;
  reason: FlagReason;
  dueTime: string;
  riskLevel: RiskLevel;
  /** The dose's record, e.g. "Taken late at 15:00". */
  record: string;
  /** "Harold asked for advice (already taken: yes/no)" when requested (FR-015). */
  request: string | null;
}

export interface NguyenDoseRow {
  id: string;
  medicationName: string;
  dueTime: string;
  status: string;
  confirmations: string[];
  flags: string[];
}

// FR-010, FR-011, FR-016, FR-018, FR-024, FR-027
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
      flags: state.flags.filter((f) => f.doseId === d.id).map((f) => flagText(state, f, d)),
    }));
  // FR-024: every open flag, any reason and risk level (low-risk ones without an alert)
  const openFlags: NguyenOpenFlag[] = state.flags
    .filter((f) => f.status === "open")
    .map((f) => {
      const d = findDose(state, f.doseId);
      return {
        flagId: f.id,
        medicationName: findMedication(state, d.medicationId).name,
        reason: f.reason,
        dueTime: formatHHMM(d.dueAt),
        riskLevel: f.riskLevel,
        record: statusLabelForHarold(d),
        request:
          f.adviceRequestedAt === null
            ? null
            : `Harold asked for advice (already taken: ${f.takenBeforeRequest ? "yes" : "no"})`,
      };
    });
  return { medications, doseLog, openFlags, alerts: alertViews(state, "nguyen") };
}
