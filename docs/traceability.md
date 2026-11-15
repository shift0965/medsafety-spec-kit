# Requirements Traceability Matrix — Prototype V1

**Spec**: [`specs/001-dose-safety-alerts/spec.md`](../specs/001-dose-safety-alerts/spec.md) ·
**Goal model**: [`docs/goal-model.md`](goal-model.md) ·
**Walkthrough**: [`specs/001-dose-safety-alerts/quickstart.md`](../specs/001-dose-safety-alerts/quickstart.md)

Interview evidence uses the transcript codes from the spec (T1 Harold, T2 Rachel, T3 Dr. Nguyen;
F1, F2 follow-ups). Code paths are relative to `frontend/`. Domain tests are in
`frontend/tests/domain/`; each test name starts with the scenario or FR ID it checks.

**Status** is left as "To evaluate" for the team's V1 evaluation (fully / partially / not
satisfied).

| Requirement | Interview Evidence | Goal Model Reference | Code / Implementation | Status |
|---|---|---|---|---|
| FR-001 One non-repeating, neutral reminder per due dose | T1:48; F1:6, F1:12 | G-4 | `src/domain/clock.ts` `tick` (sets `reminderShownAt` once); `src/domain/views.ts` `haroldView` (`showReminder`); `src/components/MedicationCard.tsx`; tests `foundation`, `us1-confirm` (US1-1, US1-4) | To evaluate |
| FR-002 Reminder removed once confirmed or marked unsure | F1:6 | G-4 (merged HW2 G-32) | `src/domain/doses.ts` `confirmDose`, `markUnsure`; `views.ts` `showReminder`; test `us1-confirm` (US1-2 / FR-002) | To evaluate |
| FR-003 One-tap confirm; early confirm up to 2 h before due | T1:14, T1:30; F1:37; F2:36 | G-7 | `doses.ts` `confirmDose` (2-hour limit); `views.ts` `confirmTarget`; `MedicationCard.tsx` **I took it**; test `us1-confirm` (US1-2, early dose) | To evaluate |
| FR-004 Store the time each dose is confirmed | F1:37; T2:17 | G-8 | `doses.ts` `confirmDose` (`confirmations`); test `us1-confirm` (US1-2) | To evaluate |
| FR-005 Show when each medication was last taken | T1:44 | G-17 | `views.ts` `lastTakenAt`, `lastTakenText`; test `us1-confirm` (US1-3) | To evaluate |
| FR-006 Large text and tap targets in Harold's view | F1:12, F1:41 | G-36 | `src/styles/app.css` `.harold` (24 px text, 64 px buttons); checked in browser (T042) | To evaluate |
| FR-007 "I'm not sure" with one tap | T1:44; F2:20, F2:22 | G-43 | `doses.ts` `markUnsure`; `MedicationCard.tsx` **I'm not sure**; test `us2-unsure-duplicate` (US2-1) | To evaluate |
| FR-008 After "unsure": show last-taken time, advise waiting | T1:44; F2:22 | G-43, G-17 (supports G-20) | `views.ts` `unsureAdvice`; `MedicationCard.tsx`; test `us2-unsure-duplicate` (US2-1) | To evaluate |
| FR-009 Three-choice prompt for an already-recorded dose or a confirmation < 6 h ago | T2:14, T2:17 | G-22, G-17 (supports G-16) | `doses.ts` `confirmDose` (`needsDuplicateChoice`), `resolveDuplicateChoice`; `src/components/ConfirmDuplicateDialog.tsx`; `src/views/HaroldView.tsx`; tests `us1-confirm` (6-hour check), `us2-unsure-duplicate` (US2-2…5, H2, M4) | To evaluate |
| FR-010 Dr. Nguyen sets window and risk per medication | T3:39, T3:59, T3:70 | G-38 | `src/domain/medications.ts` `setMedicationSettings`; `src/views/NguyenView.tsx`; test `us3-settings` (US3-1, US3-2, M1) | To evaluate |
| FR-011 Defaults 60 min / high risk, visibly indicated | T3:59 | G-38 | `medications.ts` `effectiveWindow`, `effectiveRisk`, `usesDefaults`; `doses.ts` `snapshotSettings`; `NguyenView.tsx` "default" badge; tests `foundation`, `us3-settings` (US3-3) | To evaluate |
| FR-012 Flag missed when the window closes unrecorded | T2:17; T3:57, T3:70 | G-22 | `clock.ts` `tick` (missed flagging); `src/domain/flags.ts` `raiseFlag`; test `us4-urgency` (US4-2) | To evaluate |
| FR-013 Flag duplicate and unsure immediately | T2:14; T3:88 | G-22 | `doses.ts` `markUnsure`, `resolveDuplicateChoice` → `raiseFlag`; test `us2-unsure-duplicate` (US2-1, US2-3) | To evaluate |
| FR-014 No missed flag or alert inside the window | T1:46; F1:29, F1:49 | G-34 | `clock.ts` `tick` (window-close check); test `us4-urgency` (US4-1, invariants) | To evaluate |
| FR-015 Taken late recorded; flag and alerts kept; high-risk "Check with Dr. Nguyen" first | T3:55; T1:44; F2:26 | G-8, G-22 (supports G-20) | `doses.ts` `confirmDose` (missed → `takenLate`, flag note); `views.ts` `needsLateCheck`; `src/components/LateDoseDialog.tsx`; test `us4-urgency` (US4-5, US4-6) | To evaluate |
| FR-016 High-risk flag → urgent alert to Harold and Dr. Nguyen | T2:45; T3:59, T3:88 | G-24 | `src/domain/alerts.ts` `routeFlag`; `src/components/AlertList.tsx`; tests `us2-unsure-duplicate` (US4-4), `us4-urgency` (US4-2) | To evaluate |
| FR-017 Low-risk flag → routine notice to Harold only | T3:59, T3:86 | G-25 | `alerts.ts` `routeFlag`; tests `us4-urgency` (US4-3), `us5-consent` (US5-4) | To evaluate |
| FR-018 Flags and alerts state medication, reason and time | T2:17 | G-22, G-24 | `views.ts` `alertViews`, `nguyenView`; `AlertList.tsx`; browser walkthrough steps 5, 11 | To evaluate |
| FR-019 Rachel sees nothing by default | T3:33; F1:23 | G-30, G-33 | `src/domain/consent.ts` `rachelView` (`nothingShared`); `src/views/RachelView.tsx`; test `us5-consent` (US5-1) | To evaluate |
| FR-020 Harold designates / un-designates Rachel as safety contact | T1:46; T3:33 | G-42 | `consent.ts` `setSafetyContact`; `src/components/SharingSettings.tsx`; test `us5-consent` (US5-2, US5-5) | To evaluate |
| FR-021 Safety contact gets "please check in" with no medication details | T2:45; T3:33 | G-42, G-24 | `alerts.ts` `routeFlag` (`checkInOnly`); `consent.ts` `rachelView` (messages carry only a time); `RachelView.tsx`; test `us5-consent` (US5-2) | To evaluate |
| FR-022 Per-medication sharing: name, due time, status only | T1:28; F1:23 | G-33 | `consent.ts` `setShared`, `rachelView`; `SharingSettings.tsx`; `RachelView.tsx`; test `us5-consent` (US5-3, US5-4) | To evaluate |

## Automated and manual evidence (2026-11-14)

- `npm test` in `frontend/`: 41 domain tests pass (6 files: foundation, US1–US5).
- Browser walkthrough of all quickstart steps (1–20, 7a, 9a, 15a) against a local production
  build: 23 of 23 checks pass. To be repeated against the deployed V1 URL before tagging `v1`.
