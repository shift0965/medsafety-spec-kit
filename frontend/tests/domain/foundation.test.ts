import { describe, expect, it } from "vitest";
import { createSeedState } from "../../src/domain/seed";
import { tick } from "../../src/domain/clock";
import { DAY, at, dose, start } from "./helpers";

describe("Foundation: seed, clock and reminders", () => {
  it("seed has 4 medications and the clock at 06:45", () => {
    const s = createSeedState(DAY);
    expect(s.medications).toHaveLength(4);
    expect(s.clock).toBe(at("06:45"));
  });

  it("FR-001: at 08:00 Warfarin and both 08:00 doses are due with a reminder", () => {
    const s = tick(start(), at("08:00"));
    for (const id of ["warfarin", "metoprolol"]) {
      expect(dose(s, id, "08:00").status).toBe("due");
      expect(dose(s, id, "08:00").reminderShownAt).toBe(at("08:00"));
    }
  });

  it("invariant 6 / FR-001: a later tick does not change reminderShownAt", () => {
    const s1 = tick(start(), at("08:00"));
    const s2 = tick(s1, at("08:20"));
    expect(dose(s2, "warfarin", "08:00").reminderShownAt).toBe(at("08:00"));
  });

  it("FR-011 / M1: Metoprolol has no snapshot before 08:00 and 60 / high once due", () => {
    const s0 = start();
    expect(dose(s0, "metoprolol", "08:00").windowMinutes).toBeNull();
    expect(dose(s0, "metoprolol", "08:00").riskLevel).toBeNull();
    const s1 = tick(s0, at("08:00"));
    expect(dose(s1, "metoprolol", "08:00").windowMinutes).toBe(60);
    expect(dose(s1, "metoprolol", "08:00").riskLevel).toBe("high");
  });

  it("tick to an earlier time is a no-op", () => {
    const s1 = tick(start(), at("08:00"));
    expect(tick(s1, at("07:00"))).toBe(s1);
  });
});
