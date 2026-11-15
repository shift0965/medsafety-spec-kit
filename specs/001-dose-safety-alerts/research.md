# Phase 0 Research: Dose Confirmation and Risk-Based Alerts

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-14, V2 additions R11–R14 2026-11-15

The spec has no `[NEEDS CLARIFICATION]` markers. The unknowns below come from the Technical
Context and the constitution's prototype constraints (Principle V).

## R1. Application type and stack

- **Decision**: A static single-page web app built with Vite + React 18 + TypeScript, in
  `frontend/`.
- **Rationale**: Constitution V requires a static, front-end-only prototype that can be
  deployed twice (V1, V2). Three role views that share one changing state (doses, flags, consent)
  are easier to keep consistent with a component and state model than with hand-written DOM
  updates. TypeScript types make the entities in `data-model.md` explicit, which helps
  traceability. Vite builds to plain static files.
- **Alternatives considered**: Plain HTML/JS (simpler toolchain, but manual re-rendering of three
  views makes consistency bugs likely); Next.js (adds server features that are not needed);
  native tablet app (cannot be deployed to a URL for grading).

## R2. Data and persistence

- **Decision**: Mock seed data loaded from a typed module, held in an in-memory store, and saved
  to browser `localStorage` so a page reload keeps the demo state. A "Reset demo" control
  restores the seed.
- **Rationale**: Constitution V and the assignment ask for mock data and no real patient data.
  `localStorage` lets an evaluator reload without losing state; reset makes scenarios
  repeatable.
- **Alternatives considered**: A backend database (out of scope, needs hosting and a
  justification); no persistence (a reload in the middle of a walkthrough would lose state).

## R3. Simulating time

- **Decision**: All logic reads time from a single **simulated clock** in app state, not the
  device clock. A demo control bar lets the evaluator set the time and advance it (+5 min,
  +15 min, +1 h, jump to next due/window close). Whenever the clock changes, the flagging engine
  re-evaluates every dose.
- **Rationale**: The spec assumes evaluators can simulate the passage of time (spec Assumptions)
  so window closes (FR-012) and "slightly late" (FR-014) can be shown in minutes, not hours.
  A single time source makes the logic deterministic and testable.
- **Alternatives considered**: Real clock with short windows (not repeatable, distorts realistic
  windows); timers per dose (harder to test, prone to drift).

## R4. Flagging and alert logic placement

- **Decision**: Put all rules (dose status, flagging, alert routing, consent filtering) in pure
  TypeScript functions in `frontend/src/domain/`, independent of React. Views only call these
  functions and render the result.
- **Rationale**: The rules are the requirement-critical part (FR-007–FR-022). Pure functions can
  be unit-tested against each acceptance scenario and named with their FR IDs (Constitution I).
- **Alternatives considered**: Logic inside components (hard to test and trace).

## R5. Showing alerts without real messaging

- **Decision**: Alerts and notices are records in app state, shown in an inbox/banner in the
  recipient's view (Harold, Dr. Nguyen, Rachel), with an unread badge on the role switcher.
- **Rationale**: Constitution V forbids real SMS/email/push. A per-role inbox makes "who received
  what" directly checkable for SC-004 and SC-005.
- **Alternatives considered**: Browser notifications (permission prompts, unreliable in demos).

## R6. Role switching

- **Decision**: A top-level role switcher (Harold / Rachel / Dr. Nguyen) with no authentication.
- **Rationale**: Spec assumption: no real sign-in. Evaluators need to move between views quickly.
- **Alternatives considered**: Separate URLs per role with mock login (more steps, no
  requirement benefits it).

## R7. Large text and tap targets (G-36, SC-006)

- **Decision**: Harold's view uses a base font of at least 24 px (≈18 pt) and buttons at least
  64 px tall (≈1.7 cm on typical tablets), high contrast, one primary action per medication card.
- **Rationale**: Meets SC-006 with margin; based on common large-print and touch-target guidance.
- **Alternatives considered**: Browser zoom only (not guaranteed, does not enlarge tap targets
  proportionally on all devices).

## R8. Testing

- **Decision**: Vitest unit tests for `domain/` functions, one test (or more) per acceptance
  scenario that involves rules, named with the FR/scenario ID. Manual walkthrough of
  `quickstart.md` against the deployed prototype for UI scenarios.
- **Rationale**: Gives evidence for the traceability matrix (Constitution I) and the version
  gate (all acceptance scenarios exercised) at low cost.
- **Alternatives considered**: End-to-end browser tests (more setup than the sprint needs; can be
  added in V2 if evaluation shows UI regressions).

## R9. Deployment

- **Decision**: Deploy the built static site to Vercel (or Netlify) as two separate projects:
  one from the `v1` tag/branch and one from `v2`, each with its own persistent URL.
- **Rationale**: The repository is private; GitHub Pages on a private repo requires a paid plan,
  while Vercel and Netlify deploy from private repos on free tiers. Two projects keep both
  versions live for grading.
- **Alternatives considered**: GitHub Pages (plan restriction for private repos); a single
  deployment with a version switch (risks V1 changing when V2 is built).

## R10. Timing of urgent alerts relative to flags

- **Decision**: Alerts are created in the same state update that creates the flag, so they
  appear as soon as the simulated clock reaches the window close or Harold taps
  duplicate/unsure.
- **Rationale**: FR-016 requires urgent alerts at the moment the flag is raised; this avoids any
  delay that would blur the C1 decision.

## V2 additions

## R11. Representing a hold (FR-008, FR-009)

- **Decision**: A hold is derived, not stored, and covers only the medication's **next** dose, as
  FR-008 and FR-009 say. While a `duplicate` or `unsure` flag is open, the held dose is the first
  dose of that medication due after the flagged dose. When `tick` would make that dose due, it
  becomes `held` instead (no reminder, no missed flag). Later doses are not held and follow the V1
  rules. Resolving the flag releases its held dose (R13).
- **Rationale**: One source of truth (the flag) means a hold can never outlive its flag or be
  forgotten. It also covers a next dose that doesn't exist yet (tomorrow's Warfarin).
- **Alternatives considered**: A `holds` list or a per-dose flag (two things to keep in sync);
  holding every later dose until advice (rejected: the spec holds only the next dose).

## R12. Advice records and the fixed list (FR-025, FR-026, FR-027)

- **Decision**: Advice is a separate `Advice` record (flag, option, time, acknowledged). The four
  options are a TypeScript union. Only `skipNextDose` changes dose state; every option resolves
  the flag and releases holds. Harold's advice notice is driven by `acknowledged`, not by alerts.
- **Rationale**: Keeps the spec's fixed list (team assumption) explicit and testable; keeps alert
  rules (FR-016, FR-017, invariant 7) unchanged.
- **Alternatives considered**: Free text (out of scope in spec); reusing alerts for advice
  (would mix FR-017 routing with advice display).

## R13. A held dose released after its due time

- **Decision**: On release, a held dose whose due time has passed becomes `due` with
  `releasedAt = now` and a reminder at that time; its window counts from `releasedAt`. If the
  due time has not passed, it goes back to `scheduled`.
- **Rationale**: Implements the spec edge case (team assumption) and keeps FR-001's single
  reminder.

## R14. Advice requests for late high-risk doses (FR-015)

- **Decision**: "Ask Dr. Nguyen" and "I already took it" both set `adviceRequestedAt` and
  `takenBeforeRequest` on the missed flag and add one urgent alert to Dr. Nguyen with
  `kind: "adviceRequest"`. Rachel gets nothing extra (C2 unchanged).
- **Rationale**: Reuses the alert list and unread badge Dr. Nguyen already has; the request is
  visible on the flag in her advice panel.
