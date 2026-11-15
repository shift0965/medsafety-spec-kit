import { expect } from "vitest";
import type { AppState, Dose } from "../../src/domain/types";
import { createSeedState } from "../../src/domain/seed";
import { tick } from "../../src/domain/clock";
import { windowClosesAt } from "../../src/domain/doses";
import { rachelView } from "../../src/domain/consent";

export const DAY = "2026-11-14";
export const at = (hhmm: string) => `${DAY}T${hhmm}`;

/** Seed state with today's doses created, clock at 06:45. */
export function start(): AppState {
  const s = createSeedState(DAY);
  return tick(s, s.clock);
}

export const doseId = (medId: string, hhmm: string) => `${medId}@${at(hhmm)}`;

export function dose(state: AppState, medId: string, hhmm: string): Dose {
  return state.doses.find((d) => d.id === doseId(medId, hhmm))!;
}

export const alertsFor = (state: AppState, who: string) => state.alerts.filter((a) => a.recipient === who);

/** Invariants 1–5 and 9 from contracts/domain-api.md. */
export function expectInvariants(state: AppState) {
  for (const f of state.flags) {
    const d = state.doses.find((x) => x.id === f.doseId)!;
    // 1. FR-014: missed flags only once the window has closed
    if (f.reason === "missed") expect(state.clock >= windowClosesAt(state, d)).toBe(true);
    const forFlag = state.alerts.filter((a) => a.flagId === f.id);
    if (f.riskLevel === "high") {
      // 2. FR-016
      expect(forFlag.filter((a) => a.recipient === "harold" && a.urgency === "urgent")).toHaveLength(1);
      expect(forFlag.filter((a) => a.recipient === "nguyen" && a.urgency === "urgent")).toHaveLength(1);
    } else {
      // 3. FR-017
      expect(forFlag.filter((a) => a.recipient !== "harold")).toHaveLength(0);
    }
  }
  // 4. FR-021
  for (const a of alertsFor(state, "rachel")) expect(a.contentLevel).toBe("checkInOnly");
  // 5. FR-019, FR-022
  const shared = new Set(state.medications.filter((m) => m.sharedWithRachel).map((m) => m.id));
  for (const m of rachelView(state).medications) expect(shared.has(m.id)).toBe(true);
  // 9. a dose that left `scheduled` always has its snapshot
  for (const d of state.doses) {
    if (d.status !== "scheduled") {
      expect(d.windowMinutes).not.toBeNull();
      expect(d.riskLevel).not.toBeNull();
    }
  }
}
