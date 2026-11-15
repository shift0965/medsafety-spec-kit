# Requirements Traceability Matrix — Prototype V1 and V2

Spec: [`spec.md`](../specs/001-dose-safety-alerts/spec.md) · Goal model: [`goal-model.md`](goal-model.md)

Evidence codes: T1 Harold, T2 Rachel, T3 Dr. Nguyen, F1/F2 follow-ups. Code paths are relative to
`frontend/src/`; tests are in `frontend/tests/domain/`. The first table describes V1 (branch
`v1-release`, commit `c20caf5`); V2 rows below point at the current code. Status is based on our V1 walkthrough
of `quickstart.md`.

| Requirement | Interview Evidence | Goal Model Reference | Code / Implementation | Status |
|---|---|---|---|---|
| FR-001 One neutral, non-repeating reminder | T1:48; F1:6, F1:12 | G-4 | `clock.ts` `tick`; `MedicationCard.tsx` | Fully |
| FR-002 Reminder removed after confirm/unsure | F1:6 | G-4 | `doses.ts` `confirmDose`, `markUnsure` | Fully |
| FR-003 One-tap confirm; early up to 2 h | T1:14, T1:30; F1:37; F2:36 | G-7 | `doses.ts` `confirmDose`; `MedicationCard.tsx` | Fully |
| FR-004 Store confirmation time | F1:37; T2:17 | G-8 | `doses.ts` `confirmDose` | Fully |
| FR-005 Show last-taken time | T1:44 | G-17 | `views.ts` `lastTakenAt` | Fully |
| FR-006 Large text and buttons | F1:12, F1:41 | G-36 | `styles/app.css` (24 px text, 64 px buttons) | Fully |
| FR-007 "I'm not sure" in one tap | T1:44; F2:20, F2:22 | G-43 | `doses.ts` `markUnsure` | Fully |
| FR-008 After unsure: last-taken time + advise waiting | T1:44; F2:22 | G-43, G-17 | `views.ts` `unsureAdvice` | Partially: "wait" is shown even with no record, and no one can resolve the check (G-18/G-19 out of scope) |
| FR-009 Three-choice duplicate prompt | T2:14, T2:17 | G-22, G-17 | `doses.ts` `resolveDuplicateChoice`; `ConfirmDuplicateDialog.tsx` | Partially: after "Yes, I took another" in the 6-hour case, the next reminder and a missed alert still fire |
| FR-010 Dr. Nguyen sets window and risk | T3:39, T3:59, T3:70 | G-38 | `medications.ts` `setMedicationSettings`; `NguyenView.tsx` | Fully |
| FR-011 Default 60 min / high risk, shown | T3:59 | G-38 | `medications.ts` `usesDefaults` | Fully |
| FR-012 Missed flag when window closes | T2:17; T3:57, T3:70 | G-22 | `clock.ts` `tick`; `flags.ts` `raiseFlag` | Fully |
| FR-013 Duplicate/unsure flagged immediately | T2:14; T3:88 | G-22 | `doses.ts` → `flags.ts` `raiseFlag` | Fully |
| FR-014 No missed flag inside window | T1:46; F1:29, F1:49 | G-34 | `clock.ts` `tick` | Fully |
| FR-015 Taken late; "Check with Dr. Nguyen" first | T3:55; T1:44; F2:26 | G-8, G-22 | `doses.ts` `confirmDose`; `LateDoseDialog.tsx` | Partially: Harold can't reach Dr. Nguyen and she gets no new alert, so the check can't happen |
| FR-016 High risk → urgent alert to Harold and Dr. Nguyen | T2:45; T3:59, T3:88 | G-24 | `alerts.ts` `routeFlag`; `AlertList.tsx` | Fully |
| FR-017 Low risk → routine notice to Harold only | T3:59, T3:86 | G-25 | `alerts.ts` `routeFlag` | Fully |
| FR-018 Alerts show medication, reason, time | T2:17 | G-22, G-24 | `views.ts` `alertViews`; `AlertList.tsx` | Fully |
| FR-019 Rachel sees nothing by default | T3:33; F1:23 | G-30, G-33 | `consent.ts` `rachelView` | Fully |
| FR-020 Designate/remove safety contact | T1:46; T3:33 | G-42 | `consent.ts` `setSafetyContact`; `SharingSettings.tsx` | Fully (removing it also hides Rachel's past messages; not specified) |
| FR-021 "Please check in" with no details | T2:45; T3:33 | G-42, G-24 | `alerts.ts` `routeFlag`; `RachelView.tsx` | Fully (two flags at once send two identical messages) |
| FR-022 Share individual medications | T1:28; F1:23 | G-33 | `consent.ts` `setShared`, `rachelView` | Fully |

**Summary:** 19 Fully, 3 Partially, 0 Not satisfied. All 41 domain tests pass.

## V2 changes

V2 revises FR-008, FR-009 and FR-015 and adds FR-024–FR-028 (goals G-18, G-19, G-20). FR-023 is
retired and not reused. Rows above keep the V1 status; the V2 status comes from walking through
`quickstart.md` section F (steps 21–27) in the running app as Harold, Rachel and Dr. Nguyen. Tests: `us6-advice.test.ts` (plus the updated US2-1 and M4 tests in
`us2-unsure-duplicate.test.ts`).

| Requirement | Interview Evidence | Goal Model Reference | Code / Implementation | V2 Status |
|---|---|---|---|---|
| FR-008 *(revised)* After unsure: last-taken time, "Please wait for Dr. Nguyen's advice before taking another.", next dose held, advice shown | T1:44; F2:22, F2:34 | G-43, G-17, G-20, G-19 | `views.ts` `waitingMessage`; `advice.ts` `heldDose`; `clock.ts` `tick` | Fully (the wait message still says "before taking another" when nothing was recorded) |
| FR-009 *(revised)* After "Yes, I took another" the next dose is held: no reminder, no missed flag, "Waiting for Dr. Nguyen's advice" | T2:14, T2:17; T1:44 | G-22, G-17, G-20 (supports G-16) | `advice.ts` `heldDose`, `isHeldDose`; `clock.ts` `tick`; `views.ts` `statusLabelForHarold` | Fully |
| FR-015 *(revised)* "This dose is late. Ask Dr. Nguyen before taking it."; both choices send an urgent advice request | T3:55; T1:44; F2:26, F2:34 | G-8, G-22, G-19, G-20 | `advice.ts` `respondToLateCheck`; `LateDoseDialog.tsx` | Fully |
| FR-024 Dr. Nguyen lists every open flag (low-risk without an alert) | F2:22, F2:34 (low-risk listing: team assumption) | G-19, G-18 | `views.ts` `nguyenView` `openFlags`; `AdvicePanel.tsx` | Fully (every missed low-risk dose also waits here; a dose with a missed and a duplicate flag needs two answers) |
| FR-025 Advice from a fixed list of four options | T1:44; F2:34 (list: team assumption) | G-19 | `types.ts` `AdviceOption`; `advice.ts` `giveAdvice`; `AdvicePanel.tsx` | Fully (the same four options appear for every reason, e.g. "Take it now" on a duplicate) |
| FR-026 "Dr. Nguyen: <advice>" on the card and as a notice until OK | T1:44 | G-19, G-20 | `views.ts` `adviceNotices`; `advice.ts` `acknowledgeAdvice`; `MedicationCard.tsx`, `HaroldView.tsx` | Fully |
| FR-027 Advice resolves the flag, lifts the hold, "Skip your next dose" skips it; next confirm has no FR-009/FR-015 prompt | T1:44; F2:22 | G-18 | `advice.ts` `giveAdvice`, `advisedSinceLastConfirmation`; `doses.ts` `confirmDose` | Partially: "Please call me" lifts the hold, so Harold gets the reminder and **I took it** before any call (G-20); with no answer the dose stays held (open question) |
| FR-028 No dosing advice from the app; only the waiting message while a flag awaits advice | F2:26; T1:44 | G-20, G-19 | `views.ts` `waitingMessage`; `LateDoseDialog.tsx` | Fully |

**Summary:** V1: 19 Fully / 3 Partially / 0 Not satisfied (22 requirements) → V2: 26 Fully /
1 Partially / 0 Not satisfied (27 requirements). FR-008, FR-009 and FR-015 moved from Partially to
Fully; FR-027 is Partially.

**V2 checks:** 58 domain tests pass (41 V1, with US2-1 and M4 updated for the revised FR-008 and
FR-009, plus 17 for US6), and all 30 local walkthrough checks pass (quickstart steps 1–27).
