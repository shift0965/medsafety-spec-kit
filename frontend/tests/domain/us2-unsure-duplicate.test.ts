import { describe, expect, it } from "vitest";
import { tick } from "../../src/domain/clock";
import { confirmDose, markUnsure, resolveDuplicateChoice } from "../../src/domain/doses";
import { haroldView } from "../../src/domain/views";
import type { AppState } from "../../src/domain/types";
import { at, dose, doseId, expectInvariants, start } from "./helpers";

const W = doseId("warfarin", "08:00");
const card = (s: AppState, medId: string) => haroldView(s).cards.find((c) => c.medicationId === medId)!;
const wFlags = (s: AppState) => s.flags.filter((f) => f.doseId === W).map((f) => f.reason);
const warfarinTakenAt0804 = () => confirmDose(tick(start(), at("08:04")), W).state;

describe("US2: unsure and duplicate doses are flagged straight away", () => {
  it("US2-1 / FR-007, FR-013: markUnsure sets unsure and raises an unsure flag now", () => {
    const s = markUnsure(tick(start(), at("08:10")), W);
    expect(dose(s, "warfarin", "08:00").status).toBe("unsure");
    expect(dose(s, "warfarin", "08:00").unsureAt).toBe(at("08:10"));
    expect(s.flags.filter((f) => f.doseId === W)).toEqual([expect.objectContaining({ doseId: W, reason: "unsure", raisedAt: at("08:10") })]);
    expect(card(s, "warfarin").unsureAdvice).toContain("Please wait before taking another");
  });

  it("US2-2 / FR-009: confirming a taken dose asks instead of changing state", () => {
    const s = tick(warfarinTakenAt0804(), at("08:15"));
    const r = confirmDose(s, W);
    expect(r.needsDuplicateChoice).toBe(true);
    expect(r.previousConfirmation).toBe(at("08:04"));
    expect(r.state).toBe(s);
  });

  it("H2: after confirming, the taken dose stays the confirm target and re-confirming opens the prompt", () => {
    const s = warfarinTakenAt0804();
    expect(card(s, "warfarin").confirmTargetId).toBe(W);
    expect(confirmDose(s, W).needsDuplicateChoice).toBe(true);
  });

  it("US2-3 / US4-4 / FR-016: 'Yes, I took another' records a duplicate with urgent alerts before the window closes", () => {
    const s = resolveDuplicateChoice(tick(warfarinTakenAt0804(), at("08:15")), W, "tookAnother");
    const d = dose(s, "warfarin", "08:00");
    expect(d.confirmations).toEqual([at("08:04"), at("08:15")]);
    expect(d.status).toBe("duplicate");
    expect(wFlags(s)).toEqual(["duplicate"]);
    const dupAlerts = s.alerts.filter((a) => a.flagId === `flag:${W}:duplicate`);
    expect(dupAlerts.map((a) => [a.recipient, a.urgency])).toEqual([
      ["harold", "urgent"],
      ["nguyen", "urgent"],
    ]);
    expectInvariants(s); // invariant 1: only duplicate/unsure flags inside the window
  });

  it("US2-4: 'No, I tapped by mistake' changes nothing", () => {
    const s = tick(warfarinTakenAt0804(), at("08:15"));
    expect(resolveDuplicateChoice(s, W, "mistake")).toBe(s);
  });

  it("US2-5: 'I'm not sure' marks the dose unsure and keeps the confirmation", () => {
    const s = resolveDuplicateChoice(tick(warfarinTakenAt0804(), at("08:15")), W, "unsure");
    const d = dose(s, "warfarin", "08:00");
    expect(d.status).toBe("unsure");
    expect(d.confirmations).toEqual([at("08:04")]);
    expect(wFlags(s)).toEqual(["unsure"]);
  });

  it("M2 / unsure then later remembers: I took it stays available and keeps the unsure flag", () => {
    const s1 = markUnsure(tick(start(), at("08:10")), W);
    expect(card(s1, "warfarin").confirmTargetId).toBe(W);
    const s2 = confirmDose(tick(s1, at("08:20")), W).state;
    expect(dose(s2, "warfarin", "08:00").status).toBe("taken");
    expect(wFlags(s2)).toEqual(["unsure"]);
  });

  it("M2: an unsure dose that already has a confirmation opens the prompt again", () => {
    const s = resolveDuplicateChoice(tick(warfarinTakenAt0804(), at("08:15")), W, "unsure");
    expect(confirmDose(s, W).needsDuplicateChoice).toBe(true);
  });

  it("M4: in the 6-hour case the choice acts on the most recent confirmed dose; the next dose stays scheduled", () => {
    let s = tick(start(), at("15:00"));
    s = confirmDose(s, doseId("metoprolol", "08:00")).state; // missed → taken late at 15:00
    s = tick(s, at("18:30"));
    const evening = doseId("metoprolol", "20:00");
    expect(confirmDose(s, evening).needsDuplicateChoice).toBe(true);
    const after = resolveDuplicateChoice(s, evening, "tookAnother");
    expect(dose(after, "metoprolol", "08:00").status).toBe("duplicate");
    expect(dose(after, "metoprolol", "20:00").status).toBe("scheduled");
    expect(dose(tick(after, at("20:00")), "metoprolol", "20:00").reminderShownAt).toBe(at("20:00"));
  });

  it("invariant 8: a dose never gains a second confirmation without resolveDuplicateChoice", () => {
    let s = warfarinTakenAt0804();
    for (let i = 0; i < 3; i++) s = confirmDose(s, W).state;
    expect(dose(s, "warfarin", "08:00").confirmations).toHaveLength(1);
  });

  it("resolveDuplicateChoice throws when the prompt would not be shown", () => {
    expect(() => resolveDuplicateChoice(tick(start(), at("08:00")), W, "tookAnother")).toThrow();
  });
});
