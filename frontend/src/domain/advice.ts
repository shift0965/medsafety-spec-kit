// V2: holds, advice requests and Dr. Nguyen's advice (G-18, G-19, G-20; research R11–R14).
import type { Advice, AdviceOption, Alert, AppState, Dose, Flag, Instant } from "./types";
import { dayOf, nextDay } from "./time";
import { confirmDose, ensureDosesForDay, findDose, latestConfirmation } from "./doses";

function findFlag(state: AppState, flagId: string): Flag {
  const flag = state.flags.find((f) => f.id === flagId);
  if (!flag) throw new Error(`Unknown flag ${flagId}`);
  return flag;
}

/** The first dose of the flagged medication due after the flagged dose (it may not exist yet). */
function nextDoseAfter(state: AppState, flag: Flag): Dose | null {
  const flagged = findDose(state, flag.doseId);
  return state.doses.find((d) => d.medicationId === flagged.medicationId && d.dueAt > flagged.dueAt) ?? null;
}

// FR-008, FR-009: an open unsure/duplicate flag holds only the medication's next dose (R11)
export function heldDose(state: AppState, flag: Flag): Dose | null {
  if (flag.status !== "open" || (flag.reason !== "duplicate" && flag.reason !== "unsure")) return null;
  return nextDoseAfter(state, flag);
}

// FR-008, FR-009
export function isHeldDose(state: AppState, doseId: string, exceptFlagId?: string): boolean {
  return state.flags.some((f) => f.id !== exceptFlagId && heldDose(state, f)?.id === doseId);
}

// FR-027: advice given since the medication's latest confirmation lets the next confirm skip the
// FR-009 and FR-015 prompts (team assumption: Dr. Nguyen has already seen the record)
export function advisedSinceLastConfirmation(state: AppState, medId: string): boolean {
  const latest = latestConfirmation(state, medId);
  return state.advice.some((a) => {
    const flag = findFlag(state, a.flagId);
    return findDose(state, flag.doseId).medicationId === medId && (latest === null || a.givenAt > latest);
  });
}

function updateDose(state: AppState, doseId: string, change: Partial<Dose>): AppState {
  return { ...state, doses: state.doses.map((d) => (d.id === doseId ? { ...d, ...change } : d)) };
}

// R13: a held dose past its due time becomes due now, with its reminder and window from now
function release(state: AppState, dose: Dose): AppState {
  const now: Instant = state.clock;
  if (dose.dueAt <= now) return updateDose(state, dose.id, { status: "due", releasedAt: now, reminderShownAt: now });
  return updateDose(state, dose.id, { status: "scheduled" });
}

// FR-025, FR-026, FR-027
export function giveAdvice(state: AppState, flagId: string, option: AdviceOption): AppState {
  const flag = findFlag(state, flagId);
  if (flag.status !== "open") throw new Error(`Flag ${flagId} is not open`);
  const now = state.clock;
  let next = state;
  if (option === "skipNextDose" && nextDoseAfter(next, flag) === null) {
    // the next dose is tomorrow's and may not exist yet
    next = ensureDosesForDay(next, nextDay(dayOf(findDose(next, flag.doseId).dueAt)));
  }
  const target = nextDoseAfter(next, flag);
  const advice: Advice = { id: `advice:${flagId}`, flagId, option, givenAt: now, acknowledged: false };
  next = {
    ...next,
    flags: next.flags.map((f) => (f.id === flagId ? { ...f, status: "resolved", resolvedAt: now } : f)),
    advice: [...next.advice, advice],
  };
  if (!target) return next;
  if (option === "skipNextDose") {
    const skippable = target.confirmations.length === 0 && ["scheduled", "held", "due"].includes(target.status);
    return skippable ? updateDose(next, target.id, { status: "skipped" }) : next;
  }
  const current = findDose(next, target.id);
  if (current.status === "held" && !isHeldDose(next, current.id)) return release(next, current);
  return next;
}

// FR-026
export function acknowledgeAdvice(state: AppState, adviceId: string): AppState {
  return { ...state, advice: state.advice.map((a) => (a.id === adviceId ? { ...a, acknowledged: true } : a)) };
}

export type LateCheckChoice = "ask" | "alreadyTook";

// FR-015: both choices send Dr. Nguyen one urgent advice request; Rachel gets nothing (R14)
export function respondToLateCheck(state: AppState, doseId: string, choice: LateCheckChoice): AppState {
  const dose = findDose(state, doseId);
  const flag = state.flags.find((f) => f.doseId === doseId && f.reason === "missed");
  if (dose.status !== "missed" || dose.riskLevel !== "high" || !flag || flag.status !== "open") {
    throw new Error(`Dose ${doseId} does not need the late-dose check`);
  }
  let next = choice === "alreadyTook" ? confirmDose(state, doseId).state : state;
  if (flag.adviceRequestedAt !== null) return next;
  const now = state.clock;
  const request: Alert = {
    id: `alert:${flag.id}:adviceRequest`,
    flagId: flag.id,
    recipient: "nguyen",
    urgency: "urgent",
    contentLevel: "full",
    kind: "adviceRequest",
    createdAt: now,
    read: false,
  };
  next = {
    ...next,
    flags: next.flags.map((f) =>
      f.id === flag.id ? { ...f, adviceRequestedAt: now, takenBeforeRequest: choice === "alreadyTook" } : f,
    ),
    alerts: [...next.alerts, request],
  };
  return next;
}
