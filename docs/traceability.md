# Requirements Traceability Matrix — Prototype V1

Spec: [`spec.md`](../specs/001-dose-safety-alerts/spec.md) · Goal model: [`goal-model.md`](goal-model.md)

Evidence codes: T1 Harold, T2 Rachel, T3 Dr. Nguyen, F1/F2 follow-ups. Code paths are relative to
`frontend/src/`; tests are in `frontend/tests/domain/`. Status is based on our V1 walkthrough
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
