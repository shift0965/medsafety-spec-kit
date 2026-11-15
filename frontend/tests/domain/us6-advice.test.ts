import { describe, expect, it } from "vitest";
import { tick } from "../../src/domain/clock";
import { confirmDose, ensureDosesForDay, markUnsure, resolveDuplicateChoice } from "../../src/domain/doses";
import { acknowledgeAdvice, giveAdvice, respondToLateCheck } from "../../src/domain/advice";
import { setSafetyContact } from "../../src/domain/consent";
import { haroldView, nguyenView } from "../../src/domain/views";
import type { AppState } from "../../src/domain/types";
import { DAY, alertsFor, at, dose, doseId, expectInvariants, start } from "./helpers";

const L = doseId("levothyroxine", "07:00");
const W = doseId("warfarin", "08:00");
const M8 = doseId("metoprolol", "08:00");
const M20 = doseId("metoprolol", "20:00");
const WAIT_ANOTHER = "Please wait for Dr. Nguyen's advice before taking another.";
const WAIT_IT = "Please wait for Dr. Nguyen's advice before taking it.";

const card = (s: AppState, medId: string) => haroldView(s).cards.find((c) => c.medicationId === medId)!;
const flagId = (dId: string, reason: string) => `flag:${dId}:${reason}`;

/** Levothyroxine marked "I'm not sure" at 07:05 (US6-1). */
const levoUnsure = () => markUnsure(tick(start(), at("07:05")), L);

/** Metoprolol 08:00 taken late at 15:00, then "Yes, I took another" at 18:30 (US6-3). */
function metoprololDuplicate(): AppState {
  let s = tick(start(), at("15:00"));
  s = respondToLateCheck(s, M8, "alreadyTook");
  s = tick(s, at("18:30"));
  expect(confirmDose(s, M20).needsDuplicateChoice).toBe(true);
  return resolveDuplicateChoice(s, M20, "tookAnother");
}

/** Warfarin missed at 09:00, "Ask Dr. Nguyen" at 09:15 (US6-6). */
const warfarinAsked = () => respondToLateCheck(tick(start(), at("09:15")), W, "ask");

describe("US6: Dr. Nguyen's advice resolves a flagged dose", () => {
  it("US6-1 / FR-008, FR-024, FR-028: unsure shows only the waiting message and is listed without an alert", () => {
    const s = levoUnsure();
    const c = card(s, "levothyroxine");
    expect(c.waitingForAdvice).toBe(WAIT_ANOTHER);
    expect(c.lastTakenText).toBe("Not taken yet");
    const open = nguyenView(s).openFlags;
    expect(open.map((f) => f.flagId)).toEqual([flagId(L, "unsure")]);
    expect(open[0]).toEqual(expect.objectContaining({ medicationName: "Levothyroxine", reason: "unsure", dueTime: "07:00", riskLevel: "low" }));
    expect(alertsFor(s, "nguyen")).toHaveLength(0);
    expectInvariants(s);
  });

  it("US6-2 / FR-025, FR-026, FR-027: 'Take it now' resolves the flag and Harold sees it until OK", () => {
    let s = giveAdvice(tick(levoUnsure(), at("07:20")), flagId(L, "unsure"), "takeNow");
    const flag = s.flags.find((f) => f.id === flagId(L, "unsure"))!;
    expect(flag).toEqual(expect.objectContaining({ status: "resolved", resolvedAt: at("07:20") }));
    expect(s.advice).toHaveLength(1);
    expect(card(s, "levothyroxine").advice.map((a) => a.text)).toEqual(["Dr. Nguyen: Take it now"]);
    expect(card(s, "levothyroxine").waitingForAdvice).toBeNull();
    expect(haroldView(s).adviceNotices.map((n) => n.text)).toEqual(["Dr. Nguyen: Take it now"]);
    expect(nguyenView(s).openFlags).toHaveLength(0);
    expectInvariants(s);
    s = acknowledgeAdvice(s, s.advice[0].id);
    expect(haroldView(s).adviceNotices).toHaveLength(0);
    expect(card(s, "levothyroxine").advice).toHaveLength(0);
    expect(card(s, "levothyroxine").flags.join(" ")).toContain("resolved — Dr. Nguyen: Take it now at 07:20");
  });

  it("US6-3 / FR-009: after 'Yes, I took another' the 20:00 dose is held: no reminder, no missed flag", () => {
    let s = metoprololDuplicate();
    expect(card(s, "metoprolol").waitingForAdvice).toBe(WAIT_ANOTHER);
    s = tick(s, at("20:00"));
    expect(dose(s, "metoprolol", "20:00").status).toBe("held");
    expect(dose(s, "metoprolol", "20:00").reminderShownAt).toBeNull();
    expect(card(s, "metoprolol").statusText).toBe("Waiting for Dr. Nguyen's advice");
    expect(card(s, "metoprolol").showReminder).toBe(false);
    expect(card(s, "metoprolol").confirmTargetId).toBeNull();
    s = tick(s, at("21:00"));
    expect(s.flags.some((f) => f.doseId === M20 && f.reason === "missed")).toBe(false);
    expectInvariants(s);
  });

  it("US6-4 / FR-027: 'Skip your next dose' skips the held dose and resolves the duplicate flag", () => {
    let s = tick(metoprololDuplicate(), at("20:30"));
    s = giveAdvice(s, flagId(M8, "duplicate"), "skipNextDose");
    expect(dose(s, "metoprolol", "20:00").status).toBe("skipped");
    s = tick(s, at("22:00"));
    expect(dose(s, "metoprolol", "20:00").reminderShownAt).toBeNull();
    expect(s.flags.some((f) => f.doseId === M20)).toBe(false);
    expect(s.flags.find((f) => f.id === flagId(M8, "duplicate"))!.status).toBe("resolved");
    expect(card(s, "metoprolol").statusText).toBe("Skipped (Dr. Nguyen's advice)");
    expectInvariants(s);
  });

  it("US6-5 / FR-027: 'Take your next dose as usual' at 19:00 lifts the hold; confirming at 20:00 has no prompt", () => {
    let s = giveAdvice(tick(metoprololDuplicate(), at("19:00")), flagId(M8, "duplicate"), "takeNextAsUsual");
    s = tick(s, at("20:00"));
    expect(dose(s, "metoprolol", "20:00").status).toBe("due");
    expect(dose(s, "metoprolol", "20:00").reminderShownAt).toBe(at("20:00"));
    expect(card(s, "metoprolol").showReminder).toBe(true);
    const r = confirmDose(s, M20); // the 18:30 confirmation is less than 6 h old
    expect(r.needsDuplicateChoice).toBe(false);
    expect(dose(r.state, "metoprolol", "20:00").status).toBe("taken");
    expectInvariants(r.state);
  });

  it("US6-6 / FR-015: 'Ask Dr. Nguyen' records nothing and sends her one urgent advice request", () => {
    let s = setSafetyContact(tick(start(), at("09:15")), true);
    const rachelBefore = alertsFor(s, "rachel").length;
    s = respondToLateCheck(s, W, "ask");
    expect(dose(s, "warfarin", "08:00").confirmations).toEqual([]);
    const requests = s.alerts.filter((a) => a.kind === "adviceRequest");
    expect(requests).toEqual([expect.objectContaining({ recipient: "nguyen", urgency: "urgent", createdAt: at("09:15") })]);
    expect(s.flags.find((f) => f.id === flagId(W, "missed"))!.takenBeforeRequest).toBe(false);
    expect(alertsFor(s, "rachel")).toHaveLength(rachelBefore);
    expect(card(s, "warfarin").waitingForAdvice).toBe(WAIT_IT);
    expect(nguyenView(s).alerts.map((a) => a.text)).toContain("Warfarin — advice requested — due 08:00 (already taken: no)");
    // a repeat request adds no alert
    expect(respondToLateCheck(s, W, "ask").alerts.filter((a) => a.kind === "adviceRequest")).toHaveLength(1);
    expectInvariants(s);
  });

  it("US6-6 / FR-015: 'I already took it' records taken late and still asks for advice", () => {
    const s = respondToLateCheck(tick(start(), at("09:15")), W, "alreadyTook");
    expect(dose(s, "warfarin", "08:00").status).toBe("takenLate");
    expect(s.flags.find((f) => f.id === flagId(W, "missed"))).toEqual(
      expect.objectContaining({ takenBeforeRequest: true, adviceRequestedAt: at("09:15"), note: "taken late at 09:15" }),
    );
    expect(s.alerts.filter((a) => a.kind === "adviceRequest")).toHaveLength(1);
    expect(card(s, "warfarin").waitingForAdvice).toBeNull(); // an open missed flag shows only its status
    expect(card(s, "warfarin").statusText).toBe("Taken late at 09:15");
    expectInvariants(s);
  });

  it("US6-7 / FR-027: resolved flags stay visible and earlier alerts are kept", () => {
    const before = warfarinAsked();
    const s = giveAdvice(before, flagId(W, "missed"), "callMe");
    expect(s.flags).toHaveLength(before.flags.length);
    expect(s.alerts).toEqual(before.alerts);
    const row = nguyenView(s).doseLog.find((d) => d.id === W)!;
    expect(row.flags.join(" ")).toContain("resolved — Dr. Nguyen: Please call me at 09:15");
    expectInvariants(s);
  });

  it("US6-8 / FR-028: while a flag awaits advice the card's only instruction is the waiting message", () => {
    const unsure = card(levoUnsure(), "levothyroxine");
    expect(unsure.waitingForAdvice).toBe(WAIT_ANOTHER);
    expect(unsure.advice).toEqual([]);
    const dup = card(metoprololDuplicate(), "metoprolol");
    expect(dup.waitingForAdvice).toBe(WAIT_ANOTHER);
    // an open missed flag without a request shows only its status
    const missed = card(tick(start(), at("09:05")), "warfarin");
    expect(missed.waitingForAdvice).toBeNull();
    expect(missed.statusText).toBe("Not recorded (due 08:00)");
    expect(card(warfarinAsked(), "warfarin").waitingForAdvice).toBe(WAIT_IT);
  });

  it("FR-027: after advice on a missed high-risk dose, 'I took it' records it directly", () => {
    const s = giveAdvice(warfarinAsked(), flagId(W, "missed"), "takeNow");
    expect(card(s, "warfarin").needsLateCheck).toBe(false);
    const r = confirmDose(s, W);
    expect(r.needsDuplicateChoice).toBe(false);
    expect(dose(r.state, "warfarin", "08:00").status).toBe("takenLate");
    expectInvariants(r.state);
  });

  it("FR-027: 'Take it now' on an unsure dose that already has a confirmation records it once more with no prompt", () => {
    let s = confirmDose(tick(start(), at("08:04")), W).state;
    s = resolveDuplicateChoice(tick(s, at("08:15")), W, "unsure");
    s = giveAdvice(tick(s, at("08:30")), flagId(W, "unsure"), "takeNow");
    const r = confirmDose(s, W);
    expect(r.needsDuplicateChoice).toBe(false);
    expect(dose(r.state, "warfarin", "08:00").confirmations).toEqual([at("08:04"), at("08:30")]);
    expect(r.state.flags.filter((f) => f.doseId === W).map((f) => f.reason)).toEqual(["unsure"]);
    // the exemption is used up: the next tap shows the FR-009 prompt again
    expect(confirmDose(tick(r.state, at("08:40")), W).needsDuplicateChoice).toBe(true);
    expectInvariants(r.state);
  });

  it("R11: only the next dose is held, not later ones", () => {
    let s = tick(metoprololDuplicate(), at("20:00"));
    s = ensureDosesForDay(s, "2026-11-15");
    s = tick(s, "2026-11-15T08:00");
    expect(dose(s, "metoprolol", "20:00").status).toBe("held");
    expect(s.doses.find((d) => d.id === "metoprolol@2026-11-15T08:00")!.status).toBe("due");
    expectInvariants(s);
  });

  it("R13 edge case: advice after the held dose's due time makes it due from then", () => {
    let s = tick(metoprololDuplicate(), at("20:30"));
    s = giveAdvice(s, flagId(M8, "duplicate"), "takeNextAsUsual");
    const d = dose(s, "metoprolol", "20:00");
    expect(d).toEqual(expect.objectContaining({ status: "due", releasedAt: at("20:30"), reminderShownAt: at("20:30") }));
    s = tick(s, at("21:29"));
    expect(dose(s, "metoprolol", "20:00").status).toBe("due");
    s = tick(s, at("21:30"));
    expect(dose(s, "metoprolol", "20:00").status).toBe("missed");
    expect(s.flags.find((f) => f.id === flagId(M20, "missed"))!.raisedAt).toBe(at("21:30"));
    expectInvariants(s);
  });

  it("edge case: advice on an unsure dose that was later confirmed resolves the flag and records nothing", () => {
    let s = confirmDose(tick(levoUnsure(), at("07:10")), L).state;
    s = giveAdvice(tick(s, at("07:20")), flagId(L, "unsure"), "takeNextAsUsual");
    expect(dose(s, "levothyroxine", "07:00").confirmations).toEqual([at("07:10")]);
    expect(s.flags.find((f) => f.id === flagId(L, "unsure"))!.status).toBe("resolved");
    expectInvariants(s);
  });

  it("giveAdvice on a resolved flag throws", () => {
    const s = giveAdvice(levoUnsure(), flagId(L, "unsure"), "takeNow");
    expect(() => giveAdvice(s, flagId(L, "unsure"), "callMe")).toThrow();
  });

  it("respondToLateCheck throws for a low-risk or not-missed dose", () => {
    expect(() => respondToLateCheck(tick(start(), at("08:30")), W, "ask")).toThrow();
    const s = tick(start(), at("07:40")); // Levothyroxine (low risk) missed at 07:30
    expect(() => respondToLateCheck(s, L, "ask")).toThrow();
  });

  it(`a full simulated day on ${DAY} keeps invariants 1–13`, () => {
    let s = metoprololDuplicate();
    s = markUnsure(tick(s, at("20:05")), doseId("atorvastatin", "20:00"));
    for (const t of ["20:30", "21:00", "22:00", "23:59"]) {
      s = tick(s, at(t));
      expectInvariants(s);
    }
  });
});
