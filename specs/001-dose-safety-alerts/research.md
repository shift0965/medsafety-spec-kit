# Phase 0 Research: Dose Confirmation and Risk-Based Alerts

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-14

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
- **Rationale**: The rules are the requirement-critical part (FR-007–FR-023). Pure functions can
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
