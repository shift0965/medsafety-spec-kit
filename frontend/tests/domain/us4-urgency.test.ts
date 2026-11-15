import { describe, expect, it } from "vitest";
import { nextEvent, tick } from "../../src/domain/clock";
import { confirmDose } from "../../src/domain/doses";
import { haroldView } from "../../src/domain/views";
import type { AppState } from "../../src/domain/types";
import { alertsFor, at, dose, doseId, expectInvariants, start } from "./helpers";

const W = doseId("warfarin", "08:00");
const card = (s: AppState, medId: string) => haroldView(s).cards.find((c) => c.medicationId === medId)!;
const warfarinFlags = (s: AppState) => s.flags.filter((f) => f.doseId === W);

describe("US4: flagged doses are alerted by urgency, not on every slip", () => {
  it("US4-1 / FR-014: no Warfarin flag or alert at 08:30", () => {
    const s = tick(start(), at("08:30"));
    expect(warfarinFlags(s)).toHaveLength(0);
    expect(s.alerts.some((a) => a.flagId.includes("warfarin"))).toBe(false);
  });

  it("US4-2 / FR-012, FR-016: at 09:00 Warfarin is missed with urgent alerts for Harold and Dr. Nguyen only", () => {
    const s = tick(start(), at("09:00"));
    expect(dose(s, "warfarin", "08:00").status).toBe("missed");
    const flag = warfarinFlags(s)[0];
    expect(flag).toMatchObject({ reason: "missed", raisedAt: at("09:00"), riskLevel: "high" });
    const forFlag = s.alerts.filter((a) => a.flagId === flag.id);
    expect(forFlag.map((a) => [a.recipient, a.urgency])).toEqual([
      ["harold", "urgent"],
      ["nguyen", "urgent"],
    ]);
  });

  it("US4-3 / FR-017: Atorvastatin at 22:00 gives one routine notice to Harold only", () => {
    const s = tick(start(), at("22:00"));
    const flag = s.flags.find((f) => f.doseId === doseId("atorvastatin", "20:00"))!;
    const forFlag = s.alerts.filter((a) => a.flagId === flag.id);
    expect(forFlag).toHaveLength(1);
    expect(forFlag[0]).toMatchObject({ recipient: "harold", urgency: "routine" });
  });

  it("US4-5 / FR-015: a missed high-risk dose needs the late check; a missed low-risk one does not", () => {
    const s = tick(start(), at("09:15"));
    expect(card(s, "warfarin").needsLateCheck).toBe(true);
    expect(card(s, "levothyroxine").needsLateCheck).toBe(false); // missed at 07:30, low risk
  });

  it("US4-6 / FR-015, invariant 7: confirming at 09:15 records taken late; flag and alerts stay", () => {
    const s = tick(start(), at("09:15"));
    const alertsBefore = s.alerts.length;
    const { state } = confirmDose(s, W);
    expect(dose(state, "warfarin", "08:00").status).toBe("takenLate");
    expect(warfarinFlags(state)[0].note).toBe("taken late at 09:15");
    expect(state.alerts).toHaveLength(alertsBefore);
    expect(card(state, "warfarin").statusText).toBe("Taken late at 09:15");
  });

  it("invariants 1–3 hold after a full simulated day", () => {
    let s = start();
    for (let h = 7; h <= 23; h++) {
      s = tick(s, at(`${String(h).padStart(2, "0")}:00`));
      expectInvariants(s);
    }
    expect(alertsFor(s, "rachel")).toHaveLength(0);
  });

  it("nextEvent returns the next due time or window close", () => {
    expect(nextEvent(start())).toBe(at("07:00"));
    expect(nextEvent(tick(start(), at("07:00")))).toBe(at("07:30"));
  });
});
