import { describe, expect, it } from "vitest";
import { tick } from "../../src/domain/clock";
import { rachelView, setSafetyContact, setShared } from "../../src/domain/consent";
import { alertsFor, at, expectInvariants, start } from "./helpers";

describe("US5: Harold controls what Rachel sees", () => {
  it("US5-1 / FR-019: by default Rachel sees nothing", () => {
    const v = rachelView(tick(start(), at("09:00")));
    expect(v).toMatchObject({ nothingShared: true, medications: [], messages: [] });
  });

  it("US5-2 / FR-021, invariant 4: as safety contact Rachel gets one check-in message per high-risk flag", () => {
    const s = tick(setSafetyContact(start(), true), at("09:00"));
    const rachel = alertsFor(s, "rachel");
    // Warfarin and Metoprolol (default high risk) both missed at 09:00
    expect(rachel).toHaveLength(2);
    for (const a of rachel) expect(a).toMatchObject({ urgency: "urgent", contentLevel: "checkInOnly" });
    const v = rachelView(s);
    expect(v.medications).toEqual([]);
    expect(Object.keys(v.messages[0]).sort()).toEqual(["createdAt", "id", "read"]);
    expectInvariants(s);
  });

  it("US5-3 / FR-022, invariant 5: sharing Atorvastatin shows only Atorvastatin", () => {
    const v = rachelView(setShared(start(), "atorvastatin", true));
    expect(v.nothingShared).toBe(false);
    expect(v.medications).toEqual([
      { id: "atorvastatin", name: "Atorvastatin", dueTimes: ["20:00"], status: "Not due yet (20:00)" },
    ]);
  });

  it("US5-4 / FR-017: a missed low-risk shared dose shows 'missed' but sends Rachel nothing", () => {
    const s = tick(setShared(setSafetyContact(start(), true), "atorvastatin", true), at("22:00"));
    expect(rachelView(s).medications[0].status).toBe("Missed (20:00)");
    expect(alertsFor(s, "rachel").some((a) => a.flagId.includes("atorvastatin"))).toBe(false);
  });

  it("US5-5: after Harold removes the designation, a later high-risk flag sends Rachel nothing", () => {
    let s = tick(setSafetyContact(start(), true), at("09:00"));
    const before = alertsFor(s, "rachel").length;
    s = tick(setSafetyContact(s, false), at("21:00")); // Metoprolol 20:00 missed, high risk
    expect(s.flags.some((f) => f.doseId.includes("T20:00"))).toBe(true);
    expect(alertsFor(s, "rachel")).toHaveLength(before);
  });
});
