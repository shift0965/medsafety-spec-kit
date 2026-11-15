---

description: "Task list for Dose Confirmation and Risk-Based Missed/Duplicate-Dose Alerts (V1)"
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
- **[Story]**: User story the task belongs to (US1–US5)
- All paths are relative to the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the static front-end project described in plan.md.

- [ ] T001 Create `frontend/package.json` for a Vite + React 18 + TypeScript app with scripts `dev` (`vite`), `build` (`tsc -b && vite build`), `preview` (`vite preview`) and `test` (`vitest run`); dependencies `react@^18`, `react-dom@^18`; devDependencies `vite@^5`, `@vitejs/plugin-react`, `typescript@^5`, `vitest`, `@types/react`, `@types/react-dom`; then run `npm install` in `frontend/`
- [ ] T002 [P] Create `frontend/tsconfig.json` (strict mode, `jsx: react-jsx`, `moduleResolution: bundler`, includes `src` and `tests`) and `frontend/vite.config.ts` (React plugin; Vitest `test.include: ["tests/**/*.test.ts"]`, `environment: "node"`)
- [ ] T003 [P] Create `frontend/index.html` (title "Medication Safety Prototype", viewport meta, `<div id="root">`) and `frontend/src/main.tsx` rendering `<App />` from `frontend/src/App.tsx` (App can return a placeholder for now)
- [ ] T004 [P] Add `node_modules/` and `frontend/dist/` to the root `.gitignore`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Entities, seed data, clock, state store and app shell used by every story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Define all entity types from data-model.md in `frontend/src/domain/types.ts`: `PersonId = "harold" | "rachel" | "nguyen"`; `Medication { id, name, scheduleTimes: string[] /* "HH:MM" */, windowMinutes: number | null /* 5–240 when set; null → default 60 (FR-011) */, riskLevel: "high" | "low" | null /* null → default "high" (FR-011) */, sharedWithRachel: boolean /* default false */ }`; `DoseStatus = "scheduled" | "due" | "taken" | "takenLate" | "unsure" | "missed" | "duplicate"`; `Dose { id /* `${medicationId}@${date}T${time}` */, medicationId, dueAt, windowMinutes /* snapshot */, riskLevel /* snapshot */, status, confirmations: string[], unsureAt: string | null, reminderShownAt: string | null }`; `Flag { id, doseId, reason: "missed" | "duplicate" | "unsure", raisedAt, riskLevel, note: string | null }`; `Alert { id, flagId, recipient: PersonId, urgency: "urgent" | "routine", contentLevel: "full" | "checkInOnly", createdAt, read }`; `ConsentSettings { rachelIsSafetyContact: boolean }`; `AppState { clock: string, medications, doses, flags, alerts, consent }`. Export constants `DEFAULT_WINDOW_MINUTES = 60` and `DEFAULT_RISK = "high"`. Times are ISO strings of the simulated clock
- [ ] T006 [P] Create seed data in `frontend/src/domain/seed.ts`: Warfarin 08:00 / 60 / high; Atorvastatin 20:00 / 120 / low; Levothyroxine 07:00 / 30 / low; Metoprolol 08:00 and 20:00 / window null / risk null; none shared; `rachelIsSafetyContact: false`; clock = today 06:45; empty doses, flags, alerts. Export `createSeedState(): AppState`
- [ ] T007 [P] Create time helpers in `frontend/src/domain/time.ts`: `atTime(dateISO, "HH:MM")`, `addMinutes(iso, n)`, `formatHHMM(iso)`, `isSameDay(a, b)`; no use of the device clock anywhere in `domain/` (research R3)
- [ ] T008 Implement dose generation in `frontend/src/domain/doses.ts`: `ensureDosesForDay(state, dayISO)` creates one `Dose` per medication per schedule time if missing, with status `scheduled` and `windowMinutes`/`riskLevel` **snapshotted** from the medication's effective values (`windowMinutes ?? 60`, `riskLevel ?? "high"`) at creation; plus `effectiveWindow(med)`, `effectiveRisk(med)`, `usesDefaults(med)` helpers (FR-011)
- [ ] T009 Implement `tick(state, now)` in `frontend/src/domain/clock.ts`: if `now` < clock return state unchanged; set clock; call `ensureDosesForDay`; for each `scheduled` dose with `dueAt <= now`, set status `due` and set `reminderShownAt` only if it is null (FR-001: reminder once, never repeated). Leave a clearly marked hook point for missed-dose flagging (added in US4)
- [ ] T010 Implement flag and alert primitives in `frontend/src/domain/flags.ts` and `frontend/src/domain/alerts.ts`: `raiseFlag(state, doseId, reason, at)` creates at most one flag per (dose, reason), copies the dose's `riskLevel`, then calls `routeFlag`; `routeFlag(state, flag)` for high risk adds urgent/full alerts for `harold` and `nguyen` (FR-016), for low risk adds a routine/full alert for `harold` only (FR-017). Alert `createdAt = flag.raisedAt` (research R10). Leave a marked spot for the Rachel safety-contact branch (added in US5)
- [ ] T011 Create the state store in `frontend/src/state/store.tsx`: React context + `useReducer` whose actions call only domain functions (`tick`, `resetDemo`, plus story actions added later); load initial state from `localStorage` key `medsafety-v1` inside try/catch, fall back to `createSeedState()` and call `tick(state, state.clock)`; save on every change inside try/catch (research R2)
- [ ] T012 [P] Create `frontend/src/components/DemoBar.tsx` (labelled "Demo controls", visually separate): shows simulated time as HH:MM; buttons +5 min, +15 min, +1 h, a time input to set a later time, "Reset demo"; and `frontend/src/components/RoleSwitcher.tsx` with Harold · Rachel · Dr. Nguyen tabs (research R3, R6)
- [ ] T013 [P] Create `frontend/src/styles/app.css` with base styles and a `.harold` scope where body text is ≥ 24 px, buttons ≥ 64 px tall with full-width layout on small screens, and high-contrast colors (research R7, SC-006); import it in `frontend/src/main.tsx`
- [ ] T014 Build the app shell in `frontend/src/App.tsx`: store provider, `RoleSwitcher`, `DemoBar`, and the active role view (placeholders until each story adds its view)
- [ ] T015 Write foundation tests in `frontend/tests/domain/foundation.test.ts`: seed has 4 medications and clock 06:45; `tick` to 08:00 marks Warfarin and both 08:00 doses `due` with `reminderShownAt` set; a later `tick` does not change `reminderShownAt` (invariant 6, FR-001); Metoprolol doses snapshot window 60 and risk high (FR-011); `tick` to an earlier time is a no-op

**Checkpoint**: `npm test` passes and `npm run dev` shows the role switcher and demo bar.

---

## Phase 3: User Story 1 - Harold confirms a dose with one tap (Priority: P1) 🎯 MVP

**Goal**: One neutral reminder per dose, one-tap confirm, stored time, last-taken display, large print (G-4, G-7, G-8, G-17, G-36).

**Independent Test**: Reset, advance to 08:00, tap **I took it** on Warfarin; the dose shows as taken with its time, the reminder is gone, and "Last taken" shows that time (quickstart steps 1–3).

### Tests for User Story 1

- [ ] T016 [P] [US1] Write `frontend/tests/domain/us1-confirm.test.ts`: US1-2 / FR-003, FR-004 confirming a `due` dose records the clock time and sets status `taken`; FR-002 a taken dose has no active reminder in `haroldView`; US1-3 / FR-005 `lastTakenAt` returns the latest confirmation; US1-4 reminder not repeated after further ticks; edge case early dose: confirming at 18:00 marks Atorvastatin's next unconfirmed dose (20:00) `taken` and no reminder appears at 20:00; edge case two due at once: confirming Warfarin leaves Metoprolol 08:00 `due`

### Implementation for User Story 1

- [ ] T017 [US1] Implement `confirmDose(state, doseId)` in `frontend/src/domain/doses.ts` for doses with no confirmation: `scheduled` (early dose: applies to that dose, which is the medication's next unconfirmed one) or `due` → append clock time to `confirmations`, status `taken` (FR-002, FR-003, FR-004). Return `{ state, needsDuplicateChoice: false }`; unknown dose throws. Leave marked branches for already-confirmed (US2) and `missed` (US4)
- [ ] T018 [US1] Implement `lastTakenAt(state, medId)` and `haroldView(state)` in `frontend/src/domain/views.ts`: one card per medication with name, the current or next dose (current = `due`/`unsure`/`missed` dose for today, else next `scheduled`), status label, "Last taken: today HH:MM" or "Not taken yet", and `showReminder` true only when the current dose is `due` (FR-001, FR-005)
- [ ] T019 [P] [US1] Create `frontend/src/components/MedicationCard.tsx`: shows name, next due time, status, last taken; when `showReminder` shows neutral text "Time for your {name}" and two large buttons **I took it** and **I'm not sure** (the second wired in US2); otherwise shows an **I took it** button for the next due dose (early dose) (FR-001, FR-003, FR-006; contracts/ui-views.md)
- [ ] T020 [US1] Create `frontend/src/views/HaroldView.tsx` (wrapped in `.harold` class) rendering `haroldView` cards; add a `CONFIRM_DOSE` action to `frontend/src/state/store.tsx`; render HaroldView for the Harold role in `frontend/src/App.tsx`

**Checkpoint**: Quickstart steps 1–3 pass; US1 tests pass. This is the MVP.

---

## Phase 4: User Story 2 - Harold says he is unsure, and a second dose is caught (Priority: P1)

**Goal**: "I'm not sure" and the three-choice duplicate prompt, both flagged immediately (G-43, G-17, G-22).

**Independent Test**: Confirm Warfarin, tap **I took it** again and try each of the three choices; separately tap **I'm not sure** on Levothyroxine (quickstart steps 4–7).

### Tests for User Story 2

- [ ] T021 [P] [US2] Write `frontend/tests/domain/us2-unsure-duplicate.test.ts`: US2-1 / FR-007, FR-013 `markUnsure` sets `unsureAt`, status `unsure`, raises an `unsure` flag at the current clock time; US2-2 / FR-009 `confirmDose` on a taken dose returns `needsDuplicateChoice: true` and does not change state; US2-3 `resolveDuplicateChoice(..., "tookAnother")` adds a second confirmation, status `duplicate`, raises a `duplicate` flag; US2-4 `"mistake"` changes nothing and raises no flag; US2-5 `"unsure"` behaves like `markUnsure` and keeps the existing confirmation; US4-4 / FR-016 a duplicate flag on high-risk Warfarin creates urgent alerts for harold and nguyen before the window closes; invariant 1 holds (only unsure/duplicate flags exist inside the window)

### Implementation for User Story 2

- [ ] T022 [US2] Implement `markUnsure(state, doseId)` in `frontend/src/domain/doses.ts`: allowed on `due` or `taken` doses; sets `unsureAt`, status `unsure`, keeps confirmations, calls `raiseFlag(..., "unsure", clock)`; already-unsure → no-op (FR-002, FR-007, FR-013)
- [ ] T023 [US2] Extend `confirmDose` in `frontend/src/domain/doses.ts` so an already-confirmed dose returns `{ state, needsDuplicateChoice: true }` unchanged, and add `resolveDuplicateChoice(state, doseId, choice: "tookAnother" | "mistake" | "unsure")` per contracts/domain-api.md; throw if the dose has no confirmation (FR-009, FR-013)
- [ ] T024 [P] [US2] Create `frontend/src/components/ConfirmDuplicateDialog.tsx`: text "You recorded this at {HH:MM}." and three large buttons **Yes, I took another** / **No, I tapped by mistake** / **I'm not sure** (FR-009)
- [ ] T025 [P] [US2] Create `frontend/src/components/AlertList.tsx`: lists alerts for one recipient, urgent ones as a prominent banner and routine ones as calm notices, each with medication name, reason (missed / taken twice / not sure) and time, and an **OK** button that marks it read; supports a `checkInOnly` display mode that shows only "Please check in with Harold." and the time (FR-016–FR-018, FR-021); add `markAlertRead` to `frontend/src/domain/alerts.ts`
- [ ] T026 [US2] Update `frontend/src/views/HaroldView.tsx` and `frontend/src/state/store.tsx`: wire **I'm not sure** (`MARK_UNSURE`), open `ConfirmDuplicateDialog` when `needsDuplicateChoice` is returned (`RESOLVE_DUPLICATE`), after an unsure mark show the last-taken time and "Please wait before taking another. Dr. Nguyen has been told." (high risk) or "…It has been noted." (low risk) (FR-008), and render `AlertList` for `harold` (`MARK_ALERT_READ`)

**Checkpoint**: Quickstart steps 4–7 pass; US1 and US2 tests pass.

---

## Phase 5: User Story 3 - Dr. Nguyen sets a window and risk level per medication (Priority: P2)

**Goal**: Per-medication window and risk settings with visible defaults (G-38).

**Independent Test**: In Dr. Nguyen's view, see Metoprolol's "default" badge (60 min, high), set Levothyroxine to 30 min / low and Warfarin to high, and see the values saved (quickstart steps 8–9).

### Tests for User Story 3

- [ ] T027 [P] [US3] Write `frontend/tests/domain/us3-settings.test.ts`: US3-1 / FR-010 `setMedicationSettings` saves window and risk; window outside 5–240 throws; US3-3 / FR-011 `nguyenView` reports `usesDefaults: true` with 60 / high for Metoprolol; edge case: changing Warfarin's window while today's dose is pending leaves that dose's snapshot unchanged and applies to doses created later; US3-2 a Warfarin flag after setting high risk has `riskLevel: "high"`

### Implementation for User Story 3

- [ ] T028 [US3] Implement `setMedicationSettings(state, medId, { windowMinutes, riskLevel })` in `frontend/src/domain/doses.ts` (or a new `frontend/src/domain/medications.ts`): validates `windowMinutes` is an integer 5–240 and `riskLevel` is "high" | "low"; updates only the medication, never existing doses (FR-010, data-model "snapshot")
- [ ] T029 [US3] Implement `nguyenView(state)` in `frontend/src/domain/views.ts`: medications with schedule times, effective window, effective risk and `usesDefaults`; today's dose log (status, confirmation times, flags with notes); alerts for `nguyen` (FR-010, FR-011, FR-016, FR-018)
- [ ] T030 [US3] Create `frontend/src/views/NguyenView.tsx` (heading "Dr. Nguyen — community pharmacist"): editable settings table with a "default (60 min, high)" badge when unset and a Save button per row (`SET_MEDICATION_SETTINGS` action in `frontend/src/state/store.tsx`), read-only dose log, and `AlertList` for `nguyen`; render it for the Dr. Nguyen role in `frontend/src/App.tsx`

**Checkpoint**: Quickstart steps 8–9 pass; US3 tests pass.

---

## Phase 6: User Story 4 - Flagged doses are alerted by urgency, not on every slip (Priority: P2)

**Goal**: Missed flags only at window close, urgent vs. routine routing, late high-risk check (G-22, G-24, G-25, G-34).

**Independent Test**: Reset; at 08:30 nothing is flagged for Warfarin; at 09:00 Warfarin is flagged with urgent alerts for Harold and Dr. Nguyen; confirming at 09:15 shows "Check with Dr. Nguyen…" then records "taken late"; Atorvastatin at 22:00 gives Harold a routine notice only (quickstart steps 10–15).

### Tests for User Story 4

- [ ] T031 [P] [US4] Write `frontend/tests/domain/us4-urgency.test.ts`: US4-1 / FR-014 no missed flag and no alert at 08:30 for Warfarin; US4-2 / FR-012, FR-016 at 09:00 Warfarin has a `missed` flag and urgent alerts for harold and nguyen, none for rachel; US4-3 / FR-017 Atorvastatin at 22:00 gives one routine alert for harold and none for nguyen or rachel; US4-5 / FR-015 `haroldView` marks the missed high-risk Warfarin card `needsLateCheck: true` and a low-risk missed card `false`; US4-6 `confirmDose` on the missed dose at 09:15 sets status `takenLate`, adds note "taken late at 09:15" to the flag, and leaves all alerts in place (invariant 7); invariants 1, 2, 3 hold after a full simulated day

### Implementation for User Story 4

- [ ] T032 [US4] Add missed-dose flagging to `tick` in `frontend/src/domain/clock.ts`: for each dose with status `due` (no confirmation, no unsure mark) and `now >= dueAt + windowMinutes`, set status `missed` and call `raiseFlag(..., "missed", windowClosesAt)` so the flag and alerts carry the window-close time (FR-012, FR-014, FR-016, FR-017); add `nextEvent(state)` returning the next due time or window close after the clock
- [ ] T033 [US4] Extend `confirmDose` in `frontend/src/domain/doses.ts` for `missed` doses: append the confirmation, set status `takenLate`, set the missed flag's `note` to `taken late at HH:MM`, never remove alerts (FR-015); and add `needsLateCheck` (status `missed` and `riskLevel` high) to each card in `haroldView` in `frontend/src/domain/views.ts`
- [ ] T034 [P] [US4] Create `frontend/src/components/LateDoseDialog.tsx`: message "Check with Dr. Nguyen about this late dose." with no dosing advice, and large buttons **Record that I took it** / **Go back** (FR-015; contracts/ui-views.md)
- [ ] T035 [US4] Update `frontend/src/views/HaroldView.tsx` so **I took it** on a card with `needsLateCheck` opens `LateDoseDialog` first and only dispatches `CONFIRM_DOSE` on **Record that I took it**; show "Taken late at HH:MM" status; add a **Next event** button using `nextEvent` to `frontend/src/components/DemoBar.tsx`

**Checkpoint**: Quickstart steps 10–15 pass; US1–US4 tests pass.

---

## Phase 7: User Story 5 - Harold controls what Rachel sees (Priority: P3)

**Goal**: Consent tiers: nothing by default, safety-contact "check in" messages, per-medication sharing (G-42, G-33, supports G-30).

**Independent Test**: With nothing shared Rachel sees only the empty note; as safety contact she gets "Please check in with Harold." with no details on a high-risk flag; sharing Atorvastatin shows only its name, due time and status (quickstart steps 16–20).

### Tests for User Story 5

- [ ] T036 [P] [US5] Write `frontend/tests/domain/us5-consent.test.ts`: US5-1 / FR-019 default `rachelView` has no medications, no alerts and `nothingShared: true`; US5-2 / FR-021 with safety contact on, a high-risk flag creates one urgent `checkInOnly` alert for rachel (invariant 4); US5-3 / FR-022 sharing Atorvastatin shows only Atorvastatin with name, due time and status (invariant 5); US5-4 / FR-017 a low-risk missed Atorvastatin shows status "missed" for rachel but creates no rachel alert; US5-5 after turning safety contact off, a later high-risk flag creates no rachel alert; low-risk flag with safety contact on still creates no rachel alert

### Implementation for User Story 5

- [ ] T037 [US5] Implement `setSafetyContact(state, enabled)`, `setShared(state, medId, shared)` and `rachelView(state)` in `frontend/src/domain/consent.ts`: `rachelView` returns only medications with `sharedWithRachel` (name, today's due times, current status), alerts where `recipient === "rachel"`, and `nothingShared` when no medication is shared and safety contact is off (FR-019, FR-020, FR-022)
- [ ] T038 [US5] Add the Rachel branch to `routeFlag` in `frontend/src/domain/alerts.ts`: high-risk flag and `consent.rachelIsSafetyContact` → one urgent alert to `rachel` with `contentLevel: "checkInOnly"`; never for low-risk flags (FR-017, FR-021)
- [ ] T039 [P] [US5] Create `frontend/src/components/SharingSettings.tsx` for Harold's view: a large toggle "Rachel is my safety contact" with the explanation "She gets a 'please check in' message for serious problems. She does not see your medicines.", and one "Share with Rachel" toggle per medication with "She sees the name, time and whether it was taken." (FR-020, FR-022)
- [ ] T040 [US5] Create `frontend/src/views/RachelView.tsx`: empty state "Harold hasn't shared anything with you." when `nothingShared`; safety messages via `AlertList` in `checkInOnly` mode; list of shared medications only; never show the words "missed", "duplicate" or "unsure" outside the shared-medication status (ui-views wording rules). Add `SET_SAFETY_CONTACT` and `SET_SHARED` actions to `frontend/src/state/store.tsx`, render `SharingSettings` in `frontend/src/views/HaroldView.tsx`, and render RachelView for the Rachel role in `frontend/src/App.tsx`
- [ ] T041 [US5] Show unread alert counts per role on the tabs in `frontend/src/components/RoleSwitcher.tsx` (research R5)

**Checkpoint**: Quickstart steps 16–20 pass; all domain tests pass.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Version-gate items from the constitution (traceability, README, deployment).

- [ ] T042 [P] Check Harold's view against SC-006 and the ui-views wording rules in `frontend/src/styles/app.css` and `frontend/src/views/HaroldView.tsx`: body text ≥ 24 px, every button ≥ 64 px tall, no blaming or alarming words in reminders and routine notices
- [ ] T043 [P] Create `docs/traceability.md` with a Requirements Traceability Matrix: one row per FR-001–FR-022 with columns Requirement, Interview Evidence (copied from the FR's citation in spec.md), Goal Model Reference, Code / Implementation (domain function + component + test file), Status (leave as "To evaluate" for the team's V1 evaluation)
- [ ] T044 [P] Create the root `README.md` with sections: project summary; links table for GitHub Version 1 (v1 tag), GitHub Version 2 (v2 tag), Prototype V1 URL, Prototype V2 URL, Requirements Analysis and Learning Log (`docs/learning-log.md`), each with a `TODO` placeholder link; how to run (from quickstart.md); and an empty "Roles and Responsibilities" section for the team to fill in. Do NOT create or write `docs/learning-log.md` (constitution: team-authored without AI)
- [ ] T045 Run `npm test` and `npm run build` in `frontend/`; confirm `frontend/dist/` contains a static site that works with `npm run preview` (deployable per research R9 with project root `frontend/`, build command `npm run build`, output `dist`)
- [ ] T046 Walk through all 20 steps of `specs/001-dose-safety-alerts/quickstart.md` in the browser and record any failures as implementation defects or requirements issues for the V1 evaluation

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

### Story completion order

```text
Setup → Foundational → US1 (MVP) → US2 → { US3, US4 } → US5 → Polish
                                  └──── US3 can start right after Foundational
```

### Within each story

- Write the story's test file first and see it fail, then implement domain functions, then UI.
- Domain (`frontend/src/domain/`) before store actions before views.
- Shared files touched by several stories, worked on in order: `doses.ts` (T008 → T017 → T022/T023 → T033), `alerts.ts` (T010 → T025 → T038), `clock.ts` (T009 → T032), `HaroldView.tsx` (T020 → T026 → T035 → T040), `store.tsx` (T011 → T020 → T026 → T030 → T040).

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
5. Polish → traceability matrix, README, build, full walkthrough, then tag `v1` and deploy.

---

## Notes

- [P] tasks touch different files and have no dependency on incomplete tasks.
- Keep every rule inside `frontend/src/domain/`; components must not compute flags or routing.
- The in-app safety-contact toggle stands in for consent for the demo only; the C2 open question
  stays open (Constitution III).
- Commit after each task or logical group; do not tag `v1` until T045 and T046 are done.
