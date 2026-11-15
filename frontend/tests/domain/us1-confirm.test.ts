import { describe, expect, it } from "vitest";
import { tick } from "../../src/domain/clock";
import { confirmDose } from "../../src/domain/doses";
import { haroldView, lastTakenAt } from "../../src/domain/views";
import { at, dose, doseId, start } from "./helpers";

const card = (s: ReturnType<typeof start>, medId: string) => haroldView(s).cards.find((c) => c.medicationId === medId)!;

describe("US1: Harold confirms a dose with one tap", () => {
  it("US1-2 / FR-003, FR-004: confirming a due dose records the clock time and sets taken", () => {
    const s = tick(start(), at("08:04"));
    const r = confirmDose(s, doseId("warfarin", "08:00"));
    expect(r.needsDuplicateChoice).toBe(false);
    expect(dose(r.state, "warfarin", "08:00").status).toBe("taken");
    expect(dose(r.state, "warfarin", "08:00").confirmations).toEqual([at("08:04")]);
  });

  it("US1-2 / FR-002: a taken dose has no active reminder", () => {
    const s = tick(start(), at("08:00"));
    expect(card(s, "warfarin").showReminder).toBe(true);
    const { state } = confirmDose(s, doseId("warfarin", "08:00"));
    expect(card(state, "warfarin").showReminder).toBe(false);
  });

  it("US1-3 / FR-005: lastTakenAt returns the latest confirmation", () => {
    const { state } = confirmDose(tick(start(), at("08:04")), doseId("warfarin", "08:00"));
    const later = tick(state, at("14:00"));
    expect(lastTakenAt(later, "warfarin")).toBe(at("08:04"));
    expect(card(later, "warfarin").lastTakenText).toBe("Last taken: today 08:04");
  });

  it("US1-4 / FR-001: the reminder is not repeated after further ticks", () => {
    const s1 = tick(start(), at("08:00"));
    const s2 = tick(tick(s1, at("08:15")), at("08:30"));
    expect(dose(s2, "warfarin", "08:00").reminderShownAt).toBe(at("08:00"));
  });

  it("edge case early dose: 18:00 confirms Atorvastatin 20:00 and no reminder appears at 20:00", () => {
    const s = tick(start(), at("18:00"));
    const { state } = confirmDose(s, doseId("atorvastatin", "20:00"));
    expect(dose(state, "atorvastatin", "20:00").status).toBe("taken");
    const later = tick(state, at("20:00"));
    expect(dose(later, "atorvastatin", "20:00").reminderShownAt).toBeNull();
    expect(card(later, "atorvastatin").showReminder).toBe(false);
  });

  it("edge case early dose (H1): 17:59 throws and no confirm target exists before 18:00", () => {
    const s = tick(start(), at("17:59"));
    expect(() => confirmDose(s, doseId("atorvastatin", "20:00"))).toThrow();
    expect(card(s, "atorvastatin").confirmTargetId).toBeNull();
    expect(card(tick(s, at("18:00")), "atorvastatin").confirmTargetId).toBe(doseId("atorvastatin", "20:00"));
  });

  it("6-hour check (H1, FR-009): Metoprolol confirmed at 15:00, then its 20:00 dose at 18:30 opens the prompt", () => {
    let s = tick(start(), at("15:00"));
    // State built directly: the 08:00 dose recorded at 15:00 (independent of US4's late path)
    s = {
      ...s,
      doses: s.doses.map((d) =>
        d.id === doseId("metoprolol", "08:00") ? { ...d, status: "takenLate", confirmations: [at("15:00")] } : d,
      ),
    };
    s = tick(s, at("18:30"));
    const r = confirmDose(s, doseId("metoprolol", "20:00"));
    expect(r.needsDuplicateChoice).toBe(true);
    expect(r.previousConfirmation).toBe(at("15:00"));
    expect(r.state).toBe(s);
  });

  it("edge case two due at once: confirming Warfarin leaves Metoprolol 08:00 due", () => {
    const { state } = confirmDose(tick(start(), at("08:00")), doseId("warfarin", "08:00"));
    expect(dose(state, "metoprolol", "08:00").status).toBe("due");
  });
});
