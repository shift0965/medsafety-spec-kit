# Implementation Plan: Dose Confirmation and Risk-Based Missed/Duplicate-Dose Alerts

**Branch**: `main` (spec folder `001-dose-safety-alerts`) | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-dose-safety-alerts/spec.md`

## Summary

Build Prototype V1 of the remind → confirm → record → flag → alert safety loop for Harold
(G-4, G-7, G-8, G-17, G-43, G-38, G-22, G-24, G-25, G-34, G-33, G-42, G-36). It is a static
single-page web app with three role views (Harold, Rachel, Dr. Nguyen), mock seed data and a
simulated clock. All safety rules (window-based missed flags with settings snapshotted when a
dose becomes due, immediate duplicate/unsure flags, the 2-hour early-dose limit and 6-hour
repeat check, confirming after "unsure", urgency-based routing, and Rachel's consent tiers) live in pure, unit-tested domain functions,
each tagged with its FR ID so that `docs/traceability.md` can point to them.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20 LTS for tooling

**Primary Dependencies**: React 18, Vite 5 (build/dev server); no UI or state libraries

**Storage**: In-memory app state persisted to browser `localStorage`; mock seed data in a typed
module (research R2)

**Testing**: Vitest unit tests for `frontend/src/domain/`; manual walkthrough per
[quickstart.md](./quickstart.md)

**Target Platform**: Modern browsers; Harold's view designed for a tablet-sized screen

**Project Type**: Static front-end web application (single page, no backend)

**Performance Goals**: Any action or clock change updates all views without perceptible delay
(< 100 ms for the seed data size)

**Constraints**: No backend, no real notifications, no real patient data, no sign-in; must build
to static files deployable at two separate URLs (v1, v2); large-print rules for Harold (≥ 24 px
text, ≥ 64 px buttons)

**Scale/Scope**: 1 patient, 3 roles, 4 mock medications, 1 simulated day at a time, 3 views + demo bar

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Pre-research | Post-design |
|---|---|---|---|
| I. Stakeholder Traceability | Every FR in spec cites goal ID + evidence; domain functions and tests are tagged with FR IDs ([contracts/domain-api.md](./contracts/domain-api.md)); UI elements map to FRs ([contracts/ui-views.md](./contracts/ui-views.md)); quickstart steps map to scenarios | PASS | PASS |
| II. Sprint Scope Discipline | Only the 13 sprint goals are planned; out-of-scope list in spec respected; FR-009 and FR-015 additions are recorded as assumptions to validate | PASS | PASS |
| III. Preserve Conflicts and Decisions | C1 → routing table; C2 → consent tiers and `checkInOnly` content; C3 → window snapshot + state machine; G-26 kept as rejected in spec; consent open question kept open (in-app toggle is demo-only) | PASS | PASS |
| IV. Specification Before Implementation | Plan derives only from spec; every requirement has acceptance scenarios; quickstart exercises all of them; v1 tag before V2 work | PASS | PASS |
| V. Simple, Accessible, Mock-Data Prototype | Static Vite build, mock data, no backend/auth/real messaging; large-print rules (R7) | PASS | PASS |
| Safety, Privacy and Consent Constraints | Routing and Rachel-view invariants 1–5 in domain contract | PASS | PASS |
| Workflow and Quality Gates | Repo layout `frontend/`, `specs/`, `docs/`; learning log left to the team; `v1` tagged only after the quickstart passes on the deployed URL | PASS | PASS |

No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-dose-safety-alerts/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── domain-api.md    # Pure domain functions and invariants
│   └── ui-views.md      # Role views, demo bar, wording rules
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # role switcher + demo bar + active view
│   ├── domain/
│   │   ├── types.ts            # entities from data-model.md
│   │   ├── seed.ts             # mock medications, start clock
│   │   ├── clock.ts            # tick / next-event helpers
│   │   ├── doses.ts            # confirm, duplicate, unsure, status transitions
│   │   ├── flags.ts            # missed / duplicate / unsure flag rules
│   │   ├── alerts.ts           # routeFlag: urgency + recipients + content level
│   │   ├── consent.ts          # safety contact, sharing, rachelView filter
│   │   └── views.ts            # haroldView, nguyenView, rachelView queries
│   ├── state/
│   │   └── store.tsx           # React context + reducer calling domain functions, localStorage
│   ├── views/
│   │   ├── HaroldView.tsx
│   │   ├── NguyenView.tsx
│   │   └── RachelView.tsx
│   ├── components/
│   │   ├── DemoBar.tsx
│   │   ├── RoleSwitcher.tsx
│   │   ├── MedicationCard.tsx
│   │   ├── AlertList.tsx
│   │   └── ConfirmDuplicateDialog.tsx
│   └── styles/
│       └── app.css             # large-print tokens for Harold's view
└── tests/
    └── domain/                 # Vitest, one describe block per user story, FR IDs in test names

docs/
├── goal-model.md               # existing
├── traceability.md             # RTM (filled during evaluation)
└── learning-log.md             # team-authored, no AI (constitution)

README.md                       # links to v1/v2, deployments, learning log, roles
```

**Structure Decision**: Single static front-end project in `frontend/`, matching the
assignment's recommended layout and Constitution V. Domain rules are kept separate from React in
`src/domain/` so they can be unit-tested and traced to FR IDs; views only render query results.

## Complexity Tracking

No constitution violations to justify.
