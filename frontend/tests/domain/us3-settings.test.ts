import { describe, expect, it } from "vitest";
import { tick } from "../../src/domain/clock";
import { setMedicationSettings } from "../../src/domain/medications";
import { nguyenView } from "../../src/domain/views";
import { alertsFor, at, dose, expectInvariants, start } from "./helpers";

describe("US3: Dr. Nguyen sets a window and risk level per medication", () => {
  it("US3-1 / FR-010: settings are saved and shown", () => {
    const s = setMedicationSettings(start(), "levothyroxine", { windowMinutes: 30, riskLevel: "low" });
    const row = nguyenView(s).medications.find((m) => m.id === "levothyroxine")!;
    expect(row).toMatchObject({ windowMinutes: 30, riskLevel: "low", usesDefaults: false });
  });

  it("FR-010: a window outside 5–240 minutes is rejected", () => {
    expect(() => setMedicationSettings(start(), "warfarin", { windowMinutes: 4, riskLevel: "high" })).toThrow();
    expect(() => setMedicationSettings(start(), "warfarin", { windowMinutes: 241, riskLevel: "high" })).toThrow();
  });

  it("US3-3 / FR-011: unset Metoprolol shows the default 60 min / high", () => {
    const row = nguyenView(start()).medications.find((m) => m.id === "metoprolol")!;
    expect(row).toMatchObject({ windowMinutes: 60, riskLevel: "high", usesDefaults: true });
  });

  it("US3-2: a flag after setting a risk level carries that risk level", () => {
    let s = setMedicationSettings(start(), "atorvastatin", { windowMinutes: 120, riskLevel: "high" });
    s = tick(s, at("22:00"));
    expect(s.flags.find((f) => f.doseId.startsWith("atorvastatin"))!.riskLevel).toBe("high");
    expect(alertsFor(s, "nguyen").some((a) => a.flagId.includes("atorvastatin"))).toBe(true);
  });

  it("M1 / edge case: a change before 08:00 applies today; after 08:00 it waits for the next dose", () => {
    let s = setMedicationSettings(start(), "warfarin", { windowMinutes: 90, riskLevel: "high" });
    s = tick(s, at("08:00"));
    expect(dose(s, "warfarin", "08:00").windowMinutes).toBe(90);
    s = setMedicationSettings(s, "warfarin", { windowMinutes: 30, riskLevel: "high" });
    expect(dose(s, "warfarin", "08:00").windowMinutes).toBe(90); // invariant 9
    s = tick(s, at("09:15"));
    expect(dose(s, "warfarin", "08:00").status).toBe("due"); // window closes at 09:30
    expectInvariants(s);
  });
});
