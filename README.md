# Medication Safety Prototype

17-626 Requirements for Information Systems, Assignment 3: Spec-Driven Development.

A prototype of the remind → confirm → record → flag → alert safety loop for Harold, his
daughter Rachel and his pharmacist Dr. Nguyen. It covers dose confirmation and risk-based
missed/duplicate-dose alerts (Sprint 1 goals G-4, G-7, G-8, G-17, G-43, G-38, G-22, G-24,
G-25, G-34, G-33, G-42, G-36). V2 adds Dr. Nguyen's advice to resolve flagged doses (G-18,
G-19, G-20). It uses mock data only.

## Deliverables

| Deliverable | Link |
|---|---|
| 1. GitHub Version 1 | TODO: link to the `v1` tag |
| 2. GitHub Version 2 | TODO: link to the `v2` tag |
| 3. Prototype V1 URL | TODO: deployed V1 URL |
| 4. Prototype V2 URL | TODO: deployed V2 URL |
| 5. Requirements Analysis and Learning Log | TODO: [`docs/learning-log.md`](docs/learning-log.md) (written by the team) |

## Repository

```text
frontend/      Prototype source (Vite + React + TypeScript, static build)
specs/         Spec Kit artifacts (spec, plan, research, data model, contracts, quickstart, tasks)
docs/
  goal-model.md      Goal model and decisions
  traceability.md    Requirements Traceability Matrix
  learning-log.md    Requirements analysis and reflection (team-authored)
```

## Run locally

Requires Node.js 20 or later.

```bash
cd frontend
npm install
npm run dev        # open the printed local URL
npm test           # domain unit tests
npm run build      # static site in frontend/dist
```

Use the **Demo controls** bar to move the simulated clock and **Reset demo** to start over.
Switch between Harold, Rachel and Dr. Nguyen with the tabs at the top. The full validation
walkthrough is in [`specs/001-dose-safety-alerts/quickstart.md`](specs/001-dose-safety-alerts/quickstart.md).

## Deploying

Deploy `frontend/` as a static site: build command `npm run build`, output directory `dist`.
V1 and V2 are deployed separately so both stay available.

## Roles and Responsibilities

TODO: list each group member and their contributions.

| Member | Contributions |
|---|---|
| | |
