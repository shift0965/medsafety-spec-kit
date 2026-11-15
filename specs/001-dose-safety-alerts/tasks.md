---

description: "Task list for Dose Confirmation and Risk-Based Missed/Duplicate-Dose Alerts (V1 and V2)"
---

# Tasks: Dose Confirmation and Risk-Based Missed/Duplicate-Dose Alerts

**Input**: Design documents from `specs/001-dose-safety-alerts/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/domain-api.md](./contracts/domain-api.md),
[contracts/ui-views.md](./contracts/ui-views.md), [quickstart.md](./quickstart.md)

**Tests**: Included for the domain rules only. The plan (R8) and quickstart require `npm test`
to cover the domain invariants and rule-based acceptance scenarios before tagging `v1`. UI
scenarios are checked by the manual quickstart walkthrough.

**Traceability (Constitution I)**: Every domain function gets a one-line comment naming its FR
IDs (e.g. `// FR-012, FR-014`). Every test name starts with the scenario or FR ID it proves
(e.g. `"US4-2 / FR-012: flags missed when window closes"`).

**Organization**: Tasks are grouped by user story so each story can be built and checked on its
own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story the task belongs to (US1–US6)
- All paths are relative to the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the static front-end project described in plan.md.

- [X] T001 Create `frontend/package.json` for a Vite + React 18 + TypeScript app with scripts `dev` (`vite`), `build` (`tsc -b && vite build`), `preview` (`vite preview`) and `test` (`vitest run`); dependencies `react@^18`, `react-dom@^18`; devDependencies `vite@^5`, `@vitejs/plugin-react`, `typescript@^5`, `vitest`, `@types/react`, `@types/react-dom`; then run `npm install` in `frontend/`
- [X] T002 [P] Create `frontend/tsconfig.json` (strict mode, `jsx: react-jsx`, `moduleResolution: bundler`, includes `src` and `tests`) and `frontend/vite.config.ts` (React plugin; Vitest `test.include: ["tests/**/*.test.ts"]`, `environment: "node"`)
- [X] T003 [P] Create `frontend/index.html` (title "Medication Safety Prototype", viewport meta, `<div id="root">`) and `frontend/src/main.tsx` rendering `<App />` from `frontend/src/App.tsx` (App can return a placeholder for now)
- [X] T004 [P] Add `node_modules/` and `frontend/dist/` to the root `.gitignore`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Entities, seed data, clock, state store and app shell used by every story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Define all entity types from data-model.md in `frontend/src/domain/types.ts`: `PersonId = "harold" | "rachel" | "nguyen"`; `Medication { id, name, scheduleTimes: string[] /* "HH:MM" */, windowMinutes: number | null /* 5–240 when set; null → default 60 (FR-011) */, riskLevel: "high" | "low" | null /* null → default "high" (FR-011) */, sharedWithRachel: boolean /* default false */ }`; `DoseStatus = "scheduled" | "due" | "taken" | "takenLate" | "unsure" | "missed" | "duplicate"`; `Dose { id /* `${medicationId}@${date}T${time}` */, medicationId, dueAt, windowMinutes /* snapshot */, riskLevel /* snapshot */, status, confirmations: string[], unsureAt: string | null, reminderShownAt: string | null }`; `Flag { id, doseId, reason: "missed" | "duplicate" | "unsure", raisedAt, riskLevel, note: string | null }`; `Alert { id, flagId, recipient: PersonId, urgency: "urgent" | "routine", contentLevel: "full" | "checkInOnly", createdAt, read }`; `ConsentSettings { rachelIsSafetyContact: boolean }`; `AppState { clock: string, medications, doses, flags, alerts, consent }`. Export constants `DEFAULT_WINDOW_MINUTES = 60` and `DEFAULT_RISK = "high"`. Times are ISO strings of the simulated clock
- [X] T006 [P] Create seed data in `frontend/src/domain/seed.ts`: Warfarin 08:00 / 60 / high; Atorvastatin 20:00 / 120 / low; Levothyroxine 07:00 / 30 / low; Metoprolol 08:00 and 20:00 / window null / risk null; none shared; `rachelIsSafetyContact: false`; clock = today 06:45; empty doses, flags, alerts. Export `createSeedState(): AppState`
- [X] T007 [P] Create time helpers in `frontend/src/domain/time.ts`: `atTime(dateISO, "HH:MM")`, `addMinutes(iso, n)`, `formatHHMM(iso)`, `isSameDay(a, b)`; no use of the device clock anywhere in `domain/` (research R3)
- [X] T008 Implement dose generation in `frontend/src/domain/doses.ts`: `ensureDosesForDay(state, dayISO)` creates one `Dose` per medication per schedule time if missing, with status `scheduled` and `windowMinutes`/`riskLevel` set to `null`; plus `snapshotSettings(state, doseId)`, which copies the medication's effective values (`windowMinutes ?? 60`, `riskLevel ?? "high"`) onto the dose and is called whenever a dose leaves `scheduled` (M1); plus `effectiveWindow(med)`, `effectiveRisk(med)`, `usesDefaults(med)` helpers (FR-011)
- [X] T009 Implement `tick(state, now)` in `frontend/src/domain/clock.ts`: if `now` < clock return state unchanged; set clock; call `ensureDosesForDay`; for each `scheduled` dose with `dueAt <= now`, call `snapshotSettings`, set status `due` and set `reminderShownAt` only if it is null (FR-001: reminder once, never repeated). Leave a clearly marked hook point for missed-dose flagging (added in US4)
- [X] T010 Implement flag and alert primitives in `frontend/src/domain/flags.ts` and `frontend/src/domain/alerts.ts`: `raiseFlag(state, doseId, reason, at)` creates at most one flag per (dose, reason), copies the dose's `riskLevel`, then calls `routeFlag`; `routeFlag(state, flag)` for high risk adds urgent/full alerts for `harold` and `nguyen` (FR-016), for low risk adds a routine/full alert for `harold` only (FR-017). Alert `createdAt = flag.raisedAt` (research R10). Leave a marked spot for the Rachel safety-contact branch (added in US5)
- [X] T011 Create the state store in `frontend/src/state/store.tsx`: React context + `useReducer` whose actions call only domain functions (`tick`, `resetDemo`, plus story actions added later); load initial state from `localStorage` key `medsafety-v1` inside try/catch, fall back to `createSeedState()` and call `tick(state, state.clock)`; save on every change inside try/catch (research R2)
- [X] T012 [P] Create `frontend/src/components/DemoBar.tsx` (labelled "Demo controls", visually separate): shows simulated time as HH:MM; buttons +5 min, +15 min, +1 h, a time input to set a later time, "Reset demo"; and `frontend/src/components/RoleSwitcher.tsx` with Harold · Rachel · Dr. Nguyen tabs (research R3, R6)
- [X] T013 [P] Create `frontend/src/styles/app.css` with base styles and a `.harold` scope where body text is ≥ 24 px, buttons ≥ 64 px tall with full-width layout on small screens, and high-contrast colors (research R7, SC-006); import it in `frontend/src/main.tsx`
- [X] T014 Build the app shell in `frontend/src/App.tsx`: store provider, `RoleSwitcher`, `DemoBar`, and the active role view (placeholders until each story adds its view)
- [X] T015 Write foundation tests in `frontend/tests/domain/foundation.test.ts`: seed has 4 medications and clock 06:45; `tick` to 08:00 marks Warfarin and both 08:00 doses `due` with `reminderShownAt` set; a later `tick` does not change `reminderShownAt` (invariant 6, FR-001); Metoprolol doses have `null` window/risk before 08:00 and snapshot 60 / high when they become due (FR-011, M1); `tick` to an earlier time is a no-op

**Checkpoint**: `npm test` passes and `npm run dev` shows the role switcher and demo bar.

---

## Phase 3: User Story 1 - Harold confirms a dose with one tap (Priority: P1) 🎯 MVP

**Goal**: One neutral reminder per dose, one-tap confirm, stored time, last-taken display, large print (G-4, G-7, G-8, G-17, G-36).

**Independent Test**: Reset, advance to 08:00, tap **I took it** on Warfarin; the dose shows as taken with its time, the reminder is gone, and "Last taken" shows that time (quickstart steps 1–3).

### Tests for User Story 1

- [X] T016 [P] [US1] Write `frontend/tests/domain/us1-confirm.test.ts`: US1-2 / FR-003, FR-004 confirming a `due` dose records the clock time and sets status `taken`; FR-002 a taken dose has no active reminder in `haroldView`; US1-3 / FR-005 `lastTakenAt` returns the latest confirmation; US1-4 reminder not repeated after further ticks; edge case early dose: confirming at 18:00 marks Atorvastatin's next unconfirmed dose (20:00) `taken` and no reminder appears at 20:00, while confirming at 17:59 throws and `haroldView` gives no `confirmTargetId` before 18:00 (H1); 6-hour check: a state built directly in the test with Metoprolol's 08:00 dose confirmed at 15:00, then `confirmDose` on its 20:00 dose at 18:30 returns `needsDuplicateChoice: true` (H1, FR-009); edge case two due at once: confirming Warfarin leaves Metoprolol 08:00 `due`

### Implementation for User Story 1

- [X] T017 [US1] Implement `confirmDose(state, doseId)` in `frontend/src/domain/doses.ts` for doses with no confirmation: `scheduled` (early dose: allowed only when `clock ≥ dueAt − 120 min`, otherwise throws; calls `snapshotSettings`) or `due` → append clock time to `confirmations`, status `taken` (FR-002, FR-003, FR-004). If the medication's latest confirmation is less than 6 h old, return `{ state, needsDuplicateChoice: true }` unchanged instead (H1, FR-009). Otherwise return `{ state, needsDuplicateChoice: false }`; unknown dose throws. Leave marked branches for already-confirmed (US2) and `missed` (US4)
- [X] T018 [US1] Implement `lastTakenAt(state, medId)` and `haroldView(state)` in `frontend/src/domain/views.ts`: one card per medication with name, the current or next dose (current = the latest of today's doses with dueAt ≤ now, in any status including taken, else next `scheduled`), status label, "Last taken: today HH:MM" or "Not taken yet", `showReminder` true only when the current dose is `due` (FR-001, FR-005), and `confirmTargetId`: the next `scheduled` dose if it is within 2 h, else today's current dose in any status (including `unsure`, M2), else none (H1)
- [X] T019 [P] [US1] Create `frontend/src/components/MedicationCard.tsx`: shows name, next due time, status, last taken; when `showReminder` shows neutral text "Time for your {name}" and two large buttons **I took it** and **I'm not sure** (the second wired in US2); otherwise shows an **I took it** button only when `confirmTargetId` is set, so it is hidden more than 2 h before the next due time (H1) and stays visible on an unsure dose (M2) (FR-001, FR-003, FR-006; contracts/ui-views.md)
- [X] T020 [US1] Create `frontend/src/views/HaroldView.tsx` (wrapped in `.harold` class) rendering `haroldView` cards; add a `CONFIRM_DOSE` action to `frontend/src/state/store.tsx`; render HaroldView for the Harold role in `frontend/src/App.tsx`

**Checkpoint**: Quickstart steps 1–3 pass; US1 tests pass. This is the MVP.

---

## Phase 4: User Story 2 - Harold says he is unsure, and a second dose is caught (Priority: P1)

**Goal**: "I'm not sure" and the three-choice duplicate prompt, both flagged immediately (G-43, G-17, G-22).

**Independent Test**: Confirm Warfarin, tap **I took it** again and try each of the three choices; separately tap **I'm not sure** on Levothyroxine (quickstart steps 4–7).

### Tests for User Story 2

- [X] T021 [P] [US2] Write `frontend/tests/domain/us2-unsure-duplicate.test.ts`: US2-1 / FR-007, FR-013 `markUnsure` sets `unsureAt`, status `unsure`, raises an `unsure` flag at the current clock time; US2-2 / FR-009 `confirmDose` on a taken dose returns `needsDuplicateChoice: true` and does not change state; US2-3 `resolveDuplicateChoice(..., "tookAnother")` adds a second confirmation, status `duplicate`, raises a `duplicate` flag; US2-4 `"mistake"` changes nothing and raises no flag; US2-5 `"unsure"` behaves like `markUnsure` and keeps the existing confirmation; M2 / edge case "unsure then later remembers": after `markUnsure` on an unconfirmed dose, `haroldView` still gives a `confirmTargetId` and `confirmDose` sets status `taken` while the unsure flag stays; `confirmDose` on an unsure dose that already has a confirmation returns `needsDuplicateChoice: true`; invariant 8 holds; H2: after confirming Warfarin at 08:04, `haroldView` still gives the taken dose as `confirmTargetId`, and `confirmDose` on it returns `needsDuplicateChoice: true`; US4-4 / FR-016 a duplicate flag on high-risk Warfarin creates urgent alerts for harold and nguyen before the window closes; invariant 1 holds (only unsure/duplicate flags exist inside the window)

### Implementation for User Story 2

- [X] T022 [US2] Implement `markUnsure(state, doseId)` in `frontend/src/domain/doses.ts`: allowed on `due` or `taken` doses; sets `unsureAt`, status `unsure`, keeps confirmations, calls `raiseFlag(..., "unsure", clock)`; already-unsure → no-op (FR-002, FR-007, FR-013)
- [X] T023 [US2] Extend `confirmDose` in `frontend/src/domain/doses.ts` so an already-confirmed dose returns `{ state, needsDuplicateChoice: true }` unchanged, and extend it so an `unsure` dose with no confirmation is confirmed normally (status `taken`, unsure flag kept, M2); add `resolveDuplicateChoice(state, doseId, choice: "tookAnother" | "mistake" | "unsure")` per contracts/domain-api.md, which also handles the 6-hour case (dose not yet confirmed but the medication was confirmed less than 6 h ago); `tookAnother` and `unsure` act on the most recent confirmed dose, and the triggering dose stays `scheduled` (M4); throw if the dose would not trigger the prompt (FR-009, FR-013)
- [X] T024 [P] [US2] Create `frontend/src/components/ConfirmDuplicateDialog.tsx`: text "You recorded this at {HH:MM}." and three large buttons **Yes, I took another** / **No, I tapped by mistake** / **I'm not sure** (FR-009)
- [X] T025 [P] [US2] Create `frontend/src/components/AlertList.tsx`: lists alerts for one recipient, urgent ones as a prominent banner and routine ones as calm notices, each with medication name, reason (missed / taken twice / not sure) and time, and an **OK** button that marks it read; supports a `checkInOnly` display mode that shows only "Please check in with Harold." and the time (FR-016–FR-018, FR-021); add `markAlertRead` to `frontend/src/domain/alerts.ts`
- [X] T026 [US2] Update `frontend/src/views/HaroldView.tsx` and `frontend/src/state/store.tsx`: wire **I'm not sure** (`MARK_UNSURE`), open `ConfirmDuplicateDialog` when `needsDuplicateChoice` is returned (`RESOLVE_DUPLICATE`), after an unsure mark show the last-taken time and "Please wait before taking another. Dr. Nguyen has been told." (high risk) or "…It has been noted." (low risk) (FR-008) while keeping **I took it** visible (M2), and render `AlertList` for `harold` (`MARK_ALERT_READ`)

**Checkpoint**: Quickstart steps 4–7 pass; US1 and US2 tests pass.

---

## Phase 5: User Story 3 - Dr. Nguyen sets a window and risk level per medication (Priority: P2)

**Goal**: Per-medication window and risk settings with visible defaults (G-38).

**Independent Test**: In Dr. Nguyen's view, see Metoprolol's "default" badge (60 min, high), set Levothyroxine to 30 min / low and Warfarin to high, and see the values saved (quickstart steps 8–9).

### Tests for User Story 3

- [X] T027 [P] [US3] Write `frontend/tests/domain/us3-settings.test.ts`: US3-1 / FR-010 `setMedicationSettings` saves window and risk; window outside 5–240 throws; US3-3 / FR-011 `nguyenView` reports `usesDefaults: true` with 60 / high for Metoprolol; edge case (M1): changing Warfarin's window before 08:00 applies to today's dose; changing it after 08:00 (dose already due) leaves today's snapshot unchanged and applies from the next dose; invariant 9 holds; US3-2 a Warfarin flag after setting high risk has `riskLevel: "high"`

### Implementation for User Story 3

- [X] T028 [US3] Implement `setMedicationSettings(state, medId, { windowMinutes, riskLevel })` in `frontend/src/domain/doses.ts` (or a new `frontend/src/domain/medications.ts`): validates `windowMinutes` is an integer 5–240 and `riskLevel` is "high" | "low"; updates only the medication; doses still `scheduled` pick up the new values when they become due, and doses that already left `scheduled` keep their snapshot (FR-010, M1)
- [X] T029 [US3] Implement `nguyenView(state)` in `frontend/src/domain/views.ts`: medications with schedule times, effective window, effective risk and `usesDefaults`; today's dose log (status, confirmation times, flags with notes); alerts for `nguyen` (FR-010, FR-011, FR-016, FR-018)
- [X] T030 [US3] Create `frontend/src/views/NguyenView.tsx` (heading "Dr. Nguyen — community pharmacist"): editable settings table with a "default (60 min, high)" badge when unset and a Save button per row (`SET_MEDICATION_SETTINGS` action in `frontend/src/state/store.tsx`), read-only dose log, and `AlertList` for `nguyen`; render it for the Dr. Nguyen role in `frontend/src/App.tsx`

**Checkpoint**: Quickstart steps 8–9 pass; US3 tests pass.

---

## Phase 6: User Story 4 - Flagged doses are alerted by urgency, not on every slip (Priority: P2)

**Goal**: Missed flags only at window close, urgent vs. routine routing, late high-risk check (G-22, G-24, G-25, G-34).

**Independent Test**: Reset; at 08:30 nothing is flagged for Warfarin; at 09:00 Warfarin is flagged with urgent alerts for Harold and Dr. Nguyen; confirming at 09:15 shows "Check with Dr. Nguyen…" then records "taken late"; Atorvastatin at 22:00 gives Harold a routine notice only (quickstart steps 10–15).

### Tests for User Story 4

- [X] T031 [P] [US4] Write `frontend/tests/domain/us4-urgency.test.ts`: US4-1 / FR-014 no missed flag and no alert at 08:30 for Warfarin; US4-2 / FR-012, FR-016 at 09:00 Warfarin has a `missed` flag and urgent alerts for harold and nguyen, none for rachel; US4-3 / FR-017 Atorvastatin at 22:00 gives one routine alert for harold and none for nguyen or rachel; US4-5 / FR-015 `haroldView` marks the missed high-risk Warfarin card `needsLateCheck: true` and a low-risk missed card `false`; US4-6 `confirmDose` on the missed dose at 09:15 sets status `takenLate`, adds note "taken late at 09:15" to the flag, and leaves all alerts in place (invariant 7); invariants 1, 2, 3 hold after a full simulated day

### Implementation for User Story 4

- [X] T032 [US4] Add missed-dose flagging to `tick` in `frontend/src/domain/clock.ts`: for each dose with status `due` (no confirmation, no unsure mark) and `now >= dueAt + windowMinutes`, set status `missed` and call `raiseFlag(..., "missed", windowClosesAt)` so the flag and alerts carry the window-close time (FR-012, FR-014, FR-016, FR-017); add `nextEvent(state)` returning the next due time or window close after the clock
- [X] T033 [US4] Extend `confirmDose` in `frontend/src/domain/doses.ts` for `missed` doses: append the confirmation, set status `takenLate`, set the missed flag's `note` to `taken late at HH:MM`, never remove alerts (FR-015); and add `needsLateCheck` (status `missed` and `riskLevel` high) to each card in `haroldView` in `frontend/src/domain/views.ts`
- [X] T034 [P] [US4] Create `frontend/src/components/LateDoseDialog.tsx`: message "Check with Dr. Nguyen about this late dose." with no dosing advice, and large buttons **Record that I took it** / **Go back** (FR-015; contracts/ui-views.md)
- [X] T035 [US4] Update `frontend/src/views/HaroldView.tsx` so **I took it** on a card with `needsLateCheck` opens `LateDoseDialog` first and only dispatches `CONFIRM_DOSE` on **Record that I took it**; show "Taken late at HH:MM" status; add a **Next event** button using `nextEvent` to `frontend/src/components/DemoBar.tsx`

**Checkpoint**: Quickstart steps 10–15 pass; US1–US4 tests pass.

---

## Phase 7: User Story 5 - Harold controls what Rachel sees (Priority: P3)

**Goal**: Consent tiers: nothing by default, safety-contact "check in" messages, per-medication sharing (G-42, G-33, supports G-30).

**Independent Test**: With nothing shared Rachel sees only the empty note; as safety contact she gets "Please check in with Harold." with no details on a high-risk flag; sharing Atorvastatin shows only its name, due time and status (quickstart steps 16–20).

### Tests for User Story 5

- [X] T036 [P] [US5] Write `frontend/tests/domain/us5-consent.test.ts`: US5-1 / FR-019 default `rachelView` has no medications, no alerts and `nothingShared: true`; US5-2 / FR-021 with safety contact on, a high-risk flag creates one urgent `checkInOnly` alert for rachel (invariant 4); US5-3 / FR-022 sharing Atorvastatin shows only Atorvastatin with name, due time and status (invariant 5); US5-4 / FR-017 a low-risk missed Atorvastatin shows status "missed" for rachel but creates no rachel alert; US5-5 after turning safety contact off, a later high-risk flag creates no rachel alert; low-risk flag with safety contact on still creates no rachel alert

### Implementation for User Story 5

- [X] T037 [US5] Implement `setSafetyContact(state, enabled)`, `setShared(state, medId, shared)` and `rachelView(state)` in `frontend/src/domain/consent.ts`: `rachelView` returns only medications with `sharedWithRachel` (name, today's due times, current status), alerts where `recipient === "rachel"`, and `nothingShared` when no medication is shared and safety contact is off (FR-019, FR-020, FR-022)
- [X] T038 [US5] Add the Rachel branch to `routeFlag` in `frontend/src/domain/alerts.ts`: high-risk flag and `consent.rachelIsSafetyContact` → one urgent alert to `rachel` with `contentLevel: "checkInOnly"`; never for low-risk flags (FR-017, FR-021)
- [X] T039 [P] [US5] Create `frontend/src/components/SharingSettings.tsx` for Harold's view: a large toggle "Rachel is my safety contact" with the explanation "She gets a 'please check in' message for serious problems. She does not see your medicines.", and one "Share with Rachel" toggle per medication with "She sees the name, time and whether it was taken." (FR-020, FR-022)
- [X] T040 [US5] Create `frontend/src/views/RachelView.tsx`: empty state "Harold hasn't shared anything with you." when `nothingShared`; safety messages via `AlertList` in `checkInOnly` mode; list of shared medications only; never show the words "missed", "duplicate" or "unsure" outside the shared-medication status (ui-views wording rules). Add `SET_SAFETY_CONTACT` and `SET_SHARED` actions to `frontend/src/state/store.tsx`, render `SharingSettings` in `frontend/src/views/HaroldView.tsx`, and render RachelView for the Rachel role in `frontend/src/App.tsx`
- [X] T041 [US5] Show unread alert counts per role on the tabs in `frontend/src/components/RoleSwitcher.tsx` (research R5)

**Checkpoint**: Quickstart steps 16–20 pass; all domain tests pass.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Version-gate items from the constitution (traceability, README, deployment).

- [X] T042 [P] Check Harold's view against SC-006 and the ui-views wording rules in `frontend/src/styles/app.css` and `frontend/src/views/HaroldView.tsx`: body text ≥ 24 px, every button ≥ 64 px tall, no blaming or alarming words in reminders and routine notices
- [X] T043 [P] Create `docs/traceability.md` with a Requirements Traceability Matrix: one row per FR-001–FR-022 with columns Requirement, Interview Evidence (copied from the FR's citation in spec.md), Goal Model Reference, Code / Implementation (domain function + component + test file), Status (leave as "To evaluate" for the team's V1 evaluation)
- [X] T044 [P] Create the root `README.md` with sections: project summary; links table for GitHub Version 1 (v1 tag), GitHub Version 2 (v2 tag), Prototype V1 URL, Prototype V2 URL, Requirements Analysis and Learning Log (`docs/learning-log.md`), each with a `TODO` placeholder link; how to run (from quickstart.md); and an empty "Roles and Responsibilities" section for the team to fill in. Do NOT create or write `docs/learning-log.md` (constitution: team-authored without AI)
- [X] T045 Run `npm test` and `npm run build` in `frontend/`; confirm `frontend/dist/` contains a static site that works with `npm run preview` (deployable per research R9 with project root `frontend/`, build command `npm run build`, output `dist`)
- [X] T046 Walk through all steps of `specs/001-dose-safety-alerts/quickstart.md` (including 7a, 9a, 15a) locally and record any failures as implementation defects or requirements issues for the V1 evaluation

### Deploy and tag V1 (D2)

- [ ] T047 Deploy `frontend/dist` as a static site (project root `frontend/`, build command `npm run build`, output `dist`; research R9) and note the V1 URL
- [ ] T048 Replace the "Prototype V1 URL" `TODO` in `README.md` with the deployed URL
- [ ] T049 Walk through all steps of `specs/001-dose-safety-alerts/quickstart.md` against the deployed URL; fix and redeploy if any step fails
- [ ] T050 Tag `v1` at the V1 commit (`git tag v1 c20caf5 && git push origin v1`) and replace the "GitHub Version 1" `TODO` in `README.md` with the link to the tag

---

# V2 revision (G-18, G-19, G-20)

**Input**: V2 changes in [spec.md](./spec.md) (FR-008, FR-009, FR-015 revised; FR-024–FR-028;
User Story 6) and research R11–R14. V1 tasks above stay as history; V2 keeps the V1 stack and
adds only what V2 needs.

**Prerequisite**: V1 is deployed and tagged (T047–T050) before any V2 code is committed, so the
V1 URL and `v1` tag keep showing V1.

---

## Phase 9: V2 Foundational (Blocking Prerequisites)

**Purpose**: New fields and the advice record that every V2 task uses.

- [X] T051 Extend `frontend/src/domain/types.ts` per data-model.md: `DoseStatus` adds `"held" | "skipped"`; `Dose` adds `releasedAt: string | null` ("when a held dose was released after its due time; its window counts from here"); `Flag` adds `status: "open" | "resolved"`, `resolvedAt: string | null`, `adviceRequestedAt: string | null`, `takenBeforeRequest: boolean | null`; new `AdviceOption = "takeNow" | "skipNextDose" | "takeNextAsUsual" | "callMe"` and `Advice { id, flagId, option, givenAt, acknowledged: boolean }` ("exactly one advice per resolved flag"); `Alert` adds `kind: "flag" | "adviceRequest"`; `AppState` adds `advice: Advice[]`. Export `ADVICE_TEXT` mapping the options to "Take it now", "Skip your next dose", "Take your next dose as usual", "Please call me" (FR-025)
- [X] T052 Fill the new fields where records are created: `createSeedState` in `frontend/src/domain/seed.ts` (`advice: []`), `ensureDosesForDay` in `frontend/src/domain/doses.ts` (`releasedAt: null`), `raiseFlag` in `frontend/src/domain/flags.ts` (`status: "open"`, other new fields `null`), `routeFlag` in `frontend/src/domain/alerts.ts` (`kind: "flag"`); change `windowClosesAt` in `frontend/src/domain/doses.ts` to `(releasedAt ?? dueAt) + windowMinutes` (R13)
- [X] T053 Change `STORAGE_KEY` in `frontend/src/state/store.tsx` to `"medsafety-v2"` so a browser that ran V1 starts from the seed instead of loading state without the V2 fields
- [X] T054 Run `npm test` in `frontend/`: all 41 V1 tests still pass before US6 work starts

**Checkpoint**: V1 behaviour unchanged; types compile.

---

## Phase 10: User Story 6 - Dr. Nguyen's advice resolves a flagged dose (Priority: P1, V2) 🎯

**Goal**: Holds, advice requests, advice and resolved flags (G-18, G-19, G-20).

**Independent Test**: Raise an unsure flag and a duplicate flag, answer both in Dr. Nguyen's view;
Harold sees the advice, the flags show as resolved, and the held dose is released or skipped as
advised (quickstart section F, steps 21–27).

### Tests for User Story 6

- [X] T055 [US6] Add invariants 10–13 from contracts/domain-api.md to `expectInvariants` in `frontend/tests/domain/helpers.ts`: 10 no `held`/`skipped` dose has a missed flag and no dose gets `reminderShownAt` while `held`; 11 while a `duplicate`/`unsure` flag is open, the medication's next dose after the flagged one is never `due` once its due time is reached, and no other dose is `held`; 12 every `resolved` flag has exactly one `Advice` and every `Advice` belongs to a flag that was open when given; 13 no `rachel` alert has `kind: "adviceRequest"` and `rachelView` contains no advice
- [X] T056 [US6] Write `frontend/tests/domain/us6-advice.test.ts` (fails until T057–T061 exist): US6-1 / FR-008, FR-024, FR-028 Levothyroxine unsure at 07:05 → `haroldView` card shows the last-taken line and "Please wait for Dr. Nguyen's advice before taking another." as its only instruction, `nguyenView.openFlags` lists it, no `nguyen` alert; US6-2 / FR-025–FR-027 `giveAdvice(..., "takeNow")` → flag `resolved` with `resolvedAt`, one `Advice`, card and notice show "Dr. Nguyen: Take it now" until `acknowledgeAdvice`; US6-3 / FR-009 Metoprolol 08:00 confirmed at 15:00, "Yes, I took another" at 18:30 → at 20:00 the 20:00 dose is `held`, no `reminderShownAt`, card shows "Waiting for Dr. Nguyen's advice"; at 21:00 no missed flag; US6-4 "Skip your next dose" → 20:00 dose `skipped`, no reminder or missed flag by 22:00, flag resolved; US6-5 "Take your next dose as usual" at 19:00 → 20:00 dose `due` with a reminder at 20:00, and `confirmDose` on it returns `needsDuplicateChoice: false` and records `taken` (FR-027; the 18:30 confirmation is less than 6 h old); "Take it now" on an unsure dose that already has a confirmation → `confirmDose` adds the confirmation with no prompt and no new flag; after that confirmation the next tap within 6 h shows the FR-009 prompt again; US6-6 / FR-015 Warfarin missed at 09:00, `respondToLateCheck(..., "ask")` at 09:15 → nothing recorded, one urgent `adviceRequest` alert to `nguyen` with `takenBeforeRequest: false`, no new `rachel` alert even with safety contact on, card shows "Please wait for Dr. Nguyen's advice before taking it."; a repeat request adds no alert; `"alreadyTook"` records `takenLate` and sets `takenBeforeRequest: true`; US6-7 / FR-027 resolved flags and all earlier alerts are still present; US6-8 / FR-028 while an unsure or duplicate flag is open the card's instruction text equals the waiting message exactly, and an open missed flag shows only its status label (no instruction); FR-027 after "Take it now" on the missed Warfarin flag, `needsLateCheck` is false and `confirmDose` records `takenLate` directly; R11 only the next dose is held: after a Metoprolol duplicate, tomorrow's 08:00 dose is not `held` when `ensureDosesForDay` creates it while the 20:00 dose is still held; R13 edge case: advice at 20:30 on a held 20:00 dose → `due`, `releasedAt` 20:30, reminder at 20:30, missed only at `releasedAt + window`; edge case advice on an already-confirmed unsure dose → flag resolved, dose unchanged; `giveAdvice` on a resolved flag throws; invariants 1–13 hold after each scenario

### Implementation for User Story 6

- [X] T057 [US6] Create `frontend/src/domain/advice.ts` with `heldDose(state, flag)` (`// FR-008, FR-009`): for an `open` flag with reason `duplicate` or `unsure`, the first dose of the same medication with `dueAt` after the flagged dose's `dueAt` (it may not exist yet), else `null`; and `isHeldDose(state, doseId)` = some open flag's `heldDose` is this dose (R11: only the next dose is held)
- [X] T058 [US6] Update `tick` in `frontend/src/domain/clock.ts`: when a `scheduled` dose reaches `dueAt` and `isHeldDose` is true, snapshot settings and set status `held` with no `reminderShownAt`; missed flagging stays limited to `due` doses, so `held` and `skipped` never get one (FR-008, FR-009, invariant 10); `nextEvent` skips held and skipped doses and uses `windowClosesAt` (from `releasedAt` when set) for window closes
- [X] T059 [US6] Implement `giveAdvice(state, flagId, option)` and `acknowledgeAdvice(state, adviceId)` in `frontend/src/domain/advice.ts` (`// FR-025, FR-026, FR-027`): throw if the flag is not `open`; add `Advice { id: "advice:" + flagId, givenAt: clock, acknowledged: false }`; set flag `resolved` / `resolvedAt`; compute `heldDose` before resolving; `skipNextDose` → that dose (held or still `scheduled`) becomes `skipped`; any other option → if that dose is `held` and no other open flag holds it: `dueAt <= clock` → `due` with `releasedAt = clock` and `reminderShownAt = clock`, else `scheduled` (R13). Never remove alerts or flags. Also add `advisedSinceLastConfirmation(state, medId)` (an `Advice` on a flag of that medication with `givenAt` later than its latest confirmation, or any advice if it has none) and use it in `confirmDose` in `frontend/src/domain/doses.ts` to skip the already-recorded and 6-hour checks (`// FR-027`); update invariant 8 in `frontend/tests/domain/helpers.ts` to allow this case
- [X] T060 [US6] Implement `respondToLateCheck(state, doseId, choice: "ask" | "alreadyTook")` in `frontend/src/domain/advice.ts` (`// FR-015`): throw unless the dose is `missed`, high-risk and its missed flag is `open`; `alreadyTook` → `confirmDose` (taken late); both → set `adviceRequestedAt = clock` and `takenBeforeRequest` on the missed flag and, only if it was not already requested, add one alert `{ id: "alert:" + flagId + ":adviceRequest", recipient: "nguyen", urgency: "urgent", contentLevel: "full", kind: "adviceRequest", createdAt: clock, read: false }` (R14). Never alert `rachel` (invariant 13)
- [X] T061 [US6] Update `frontend/src/domain/views.ts` per contracts: `statusLabelForHarold` adds `held` → "Waiting for Dr. Nguyen's advice" and `skipped` → "Skipped (Dr. Nguyen's advice)"; `statusLabelForRachel` adds `held` → "On hold", `skipped` → "Skipped"; `haroldView` cards add `waitingForAdvice` (an open unsure/duplicate flag on the medication, or a missed flag after "Ask Dr. Nguyen"; open missed flags otherwise show only their status: "Please wait for Dr. Nguyen's advice before taking another." for unsure/duplicate, "Please wait for Dr. Nguyen's advice before taking it." after "Ask Dr. Nguyen"), replacing the V1 "Please wait before taking another. Dr. Nguyen has been told. / It has been noted." text (FR-008, FR-028); `onHold`; unacknowledged advice as "Dr. Nguyen: <ADVICE_TEXT>" on the card and in a notices list; no `confirmTargetId` or reminder for a `held` or `skipped` dose; `needsLateCheck` only while the missed flag is `open` (FR-027); `nguyenView` adds `openFlags` (medication, reason, dose time, risk, dose record, advice request with "already taken: yes/no") for every open flag of any risk (FR-024) and shows resolved flags with their advice and time in the dose log; `alertViews` renders `adviceRequest` alerts as "<medication> — advice requested — due HH:MM (already taken: yes/no)"
- [X] T062 [P] [US6] Create `frontend/src/components/AdvicePanel.tsx` ("Flags awaiting advice"): one row per `openFlags` item with medication, reason, dose time, risk and record, "Harold asked for advice (already taken: yes/no)" when requested, and four large buttons **Take it now**, **Skip your next dose**, **Take your next dose as usual**, **Please call me** (FR-024, FR-025)
- [X] T063 [P] [US6] Rewrite `frontend/src/components/LateDoseDialog.tsx`: message "This dose is late. Ask Dr. Nguyen before taking it." with no dosing advice, buttons **Ask Dr. Nguyen** / **I already took it** / **Go back** (FR-015, FR-028)
- [X] T064 [US6] Update `frontend/src/components/MedicationCard.tsx`: show the `waitingForAdvice` message as the card's only instruction, the held / skipped status, and the "Dr. Nguyen: …" advice with an **OK** button; after OK the advice stays in the card's flag history as "resolved" (FR-026, FR-027; contracts/ui-views.md)
- [X] T065 [US6] Add `RESPOND_LATE_CHECK`, `GIVE_ADVICE` and `ACKNOWLEDGE_ADVICE` actions to `frontend/src/state/store.tsx`; in `frontend/src/views/HaroldView.tsx` wire the new LateDoseDialog buttons to `RESPOND_LATE_CHECK` (`"ask"` / `"alreadyTook"`), show advice notices with OK (`ACKNOWLEDGE_ADVICE`), and confirm directly when `needsLateCheck` is false (FR-027)
- [X] T066 [US6] Render `AdvicePanel` in `frontend/src/views/NguyenView.tsx` above the dose log, dispatching `GIVE_ADVICE`; show resolved flags with "Dr. Nguyen: <advice> at HH:MM" in the dose log; check that `RachelView.tsx` shows "On hold" / "Skipped" for shared medications and never the advice (C2)

**Checkpoint**: Quickstart section F (steps 21–27) and the updated steps 7, 12, 13, 15a pass; all domain tests pass.

---

## Phase 11: V2 Polish, Deploy and Tag

- [X] T067 [P] Update `docs/traceability.md` for V2: retitle "Prototype V1 and V2"; rows for revised FR-008, FR-009, FR-015 and new FR-024–FR-028 with evidence and goals copied from spec.md (G-18, G-19, G-20), code in `advice.ts` / `AdvicePanel.tsx` / `LateDoseDialog.tsx` and tests in `us6-advice.test.ts`; note FR-023 as retired; V2 status column "To evaluate" for the team. Do not edit `docs/learning-log.md` (team-authored)
- [X] T068 [P] Update the summary in `README.md` to name the V2 goals (G-18, G-19, G-20: Dr. Nguyen's advice resolves flagged doses); keep the V1 links and TODOs as they are
- [X] T069 Run `npm test` and `npm run build` in `frontend/`; check Harold's new texts and dialog against SC-006 and the ui-views wording rules (≥ 24 px text, ≥ 64 px buttons, no app dosing advice)
- [X] T070 Walk through all of `specs/001-dose-safety-alerts/quickstart.md` locally (A–F, steps 1–27) and record failures as implementation defects or requirements issues for the V2 evaluation
- [ ] T071 Deploy V2 as a separate static site (V1 URL stays live; research R9) and replace the "Prototype V2 URL" `TODO` in `README.md`
- [ ] T072 Walk through `quickstart.md` against the deployed V2 URL; fix and redeploy if any step fails
- [ ] T073 Tag `v2` (`git tag v2 && git push origin v2`) and replace the "GitHub Version 2" `TODO` in `README.md` with the link to the tag

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; blocks all user stories.
- **US1 (Phase 3)**: depends on Foundational.
- **US2 (Phase 4)**: depends on Foundational and on `confirmDose` from US1 (T017), which it extends.
- **US3 (Phase 5)**: depends on Foundational only.
- **US4 (Phase 6)**: depends on Foundational and on `confirmDose` (T017) and `AlertList` (T025).
- **US5 (Phase 7)**: depends on Foundational and on `AlertList` (T025).
- **Polish (Phase 8)**: after the stories to be shipped in V1.
- **V2 Foundational (Phase 9)**: after T047–T050 (V1 deployed and tagged); blocks US6.
- **US6 (Phase 10)**: depends on Phase 9 and on V1 US2 (`resolveDuplicateChoice`, `markUnsure`), US3 (`nguyenView`) and US4 (`confirmDose` taken late, LateDoseDialog).
- **V2 Polish (Phase 11)**: after US6; T071–T073 in order.

### Story completion order

```text
Setup → Foundational → US1 (MVP) → US2 → { US3, US4 } → US5 → Polish → V1 tag
                                  └──── US3 can start right after Foundational
V1 tag → V2 Foundational → US6 → V2 Polish → V2 tag
```

### Within each story

- Write the story's test file first and see it fail, then implement domain functions, then UI.
- Domain (`frontend/src/domain/`) before store actions before views.
- Shared files touched by several stories, worked on in order: `doses.ts` (T008 → T017 → T022/T023 → T033), `alerts.ts` (T010 → T025 → T038), `clock.ts` (T009 → T032), `HaroldView.tsx` (T020 → T026 → T035 → T040), `store.tsx` (T011 → T020 → T026 → T030 → T040).
- V2 shared files: `advice.ts` (T057 → T059 → T060), `views.ts` (T061 after T057), `store.tsx` (T053 → T065), `helpers.ts` (T055 before T056).

### Parallel Opportunities

- Setup: T002, T003, T004.
- Foundational: T006, T007 together after T005; T012, T013 alongside T008–T011.
- Each story's test task is [P] with that story's [P] UI components.
- US3 (T027–T030) can run alongside US1/US2 work since it touches different files except `views.ts`, `store.tsx` and `App.tsx`.

---

## Parallel Example: User Story 2

```bash
# After T017 is done:
Task: "T021 Write frontend/tests/domain/us2-unsure-duplicate.test.ts"
Task: "T024 Create frontend/src/components/ConfirmDuplicateDialog.tsx"
Task: "T025 Create frontend/src/components/AlertList.tsx"
# Then sequentially: T022 → T023 → T026
```

## Parallel Example: User Story 6

```bash
# After T055–T056:
Task: "T062 Create frontend/src/components/AdvicePanel.tsx"
Task: "T063 Rewrite frontend/src/components/LateDoseDialog.tsx"
# Then sequentially: T057 → T058 → T059 → T060 → T061 → T064 → T065 → T066
```

## Parallel Example: User Story 5

```bash
Task: "T036 Write frontend/tests/domain/us5-consent.test.ts"
Task: "T039 Create frontend/src/components/SharingSettings.tsx"
# Then: T037 → T038 → T040 → T041
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → Phase 2 Foundational.
2. Phase 3 US1.
3. **Stop and check**: quickstart steps 1–3, `npm test`.

### Incremental delivery

1. US1 → one-tap confirm and last-taken time (MVP).
2. US2 → unsure and duplicate safety checks (completes the P1 double-dose protection).
3. US3 + US4 → windows, risk levels and urgency-based alerts (C1, C3).
4. US5 → Rachel's consent tiers (C2).
5. Polish → traceability matrix, README, build, local walkthrough, deploy, walkthrough on the deployed URL, then tag `v1`.
6. V2 → Phase 9, US6, then V2 polish, deploy and tag `v2`. Stop and check after US6: quickstart section F and `npm test`.

---

## Notes

- [P] tasks touch different files and have no dependency on incomplete tasks.
- Keep every rule inside `frontend/src/domain/`; components must not compute flags or routing.
- The in-app safety-contact toggle stands in for consent for the demo only; the C2 open question
  stays open (Constitution III).
- Commit after each task or logical group; do not tag `v1` (T050) until T045–T049 are done, or
  `v2` (T073) until T069–T072 are done.
- V2: the "if Dr. Nguyen doesn't answer" question stays open; holds simply stay until advice.
