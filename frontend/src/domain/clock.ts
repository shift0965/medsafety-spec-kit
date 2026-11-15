// The simulated clock is the single time source for every rule (research R3).
import type { AppState, Instant } from "./types";
import { dayOf, nextDay } from "./time";
import { ensureDosesForDay, snapshotSettings, windowClosesAt } from "./doses";
import { raiseFlag } from "./flags";
import { isHeldDose } from "./advice";
import { createSeedState } from "./seed";

// FR-001, FR-008, FR-009, FR-012, FR-014, FR-016, FR-017, FR-021
export function tick(state: AppState, now: Instant): AppState {
  if (now < state.clock) return state;
  let next: AppState = { ...state, clock: now };

  for (let day = dayOf(state.clock); day <= dayOf(now); day = nextDay(day)) {
    next = ensureDosesForDay(next, day);
  }

  // Doses reaching their due time: snapshot settings, show the single reminder (FR-001).
  // V2: an open unsure/duplicate flag's next dose is held instead, with no reminder (FR-008, FR-009).
  for (const dose of next.doses) {
    if (dose.status !== "scheduled" || dose.dueAt > now) continue;
    next = snapshotSettings(next, dose.id);
    if (isHeldDose(next, dose.id)) {
      next = { ...next, doses: next.doses.map((d) => (d.id === dose.id ? { ...d, status: "held" } : d)) };
      continue;
    }
    next = {
      ...next,
      doses: next.doses.map((d) =>
        d.id === dose.id ? { ...d, status: "due", reminderShownAt: d.reminderShownAt ?? d.dueAt } : d,
      ),
    };
  }

  // Missed only once the window has closed with no confirmation or unsure mark (FR-012, FR-014)
  const closing = next.doses
    .filter((d) => d.status === "due" && d.confirmations.length === 0 && d.unsureAt === null)
    .map((d) => ({ id: d.id, closesAt: windowClosesAt(next, d) }))
    .filter((d) => d.closesAt <= now)
    .sort((a, b) => a.closesAt.localeCompare(b.closesAt));
  for (const { id, closesAt } of closing) {
    next = { ...next, doses: next.doses.map((d) => (d.id === id ? { ...d, status: "missed" } : d)) };
    next = raiseFlag(next, id, "missed", closesAt);
  }
  return next;
}

/** Next due time or window close after the clock, for the demo bar's "Next event" button. */
export function nextEvent(state: AppState): Instant | null {
  const times: Instant[] = [];
  for (const d of state.doses) {
    if (d.status === "scheduled" && d.dueAt > state.clock) times.push(d.dueAt);
    // held and skipped doses have no window close; a released dose closes from releasedAt (R13)
    if (d.status === "scheduled" || (d.status === "due" && d.confirmations.length === 0 && d.unsureAt === null)) {
      const closes = windowClosesAt(state, d);
      if (closes > state.clock) times.push(closes);
    }
  }
  times.sort();
  return times[0] ?? null;
}

export function resetDemo(day: string): AppState {
  const seed = createSeedState(day);
  return tick(seed, seed.clock);
}
