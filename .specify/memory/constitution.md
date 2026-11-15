<!--
Sync Impact Report
- Version change: 1.0.1 → 1.1.0 (MINOR, 2026-11-15)
- Modified: Principle II scope expanded for V2: V2 may also build the goals in the goal model's
  "Added in V2" table (G-18, G-19, G-20); G-19 removed from the out-of-scope example.
- Templates: none modified
- Deferred TODOs: none

Previous report (1.0.1)
- Version change: 1.0.0 → 1.0.1 (PATCH, 2026-11-14)
- Modified: Principle V large-print bullet clarified ("confirm a due dose with a single tap");
  safety prompts for repeated doses (FR-009) and missed high-risk doses (FR-015) explicitly
  allowed. No principle added, removed or redefined.
- Templates: none modified
- Deferred TODOs: none

Previous report (1.0.0)
- Version change: (unversioned template) → 1.0.0
- Modified principles (all newly defined from template placeholders):
  - [PRINCIPLE_1_NAME] → I. Stakeholder Traceability (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] → II. Sprint Scope Discipline
  - [PRINCIPLE_3_NAME] → III. Preserve Conflicts and Decisions
  - [PRINCIPLE_4_NAME] → IV. Specification Before Implementation
  - [PRINCIPLE_5_NAME] → V. Simple, Accessible, Mock-Data Prototype
- Added sections:
  - Safety, Privacy and Consent Constraints (was [SECTION_2_NAME])
  - Development Workflow and Quality Gates (was [SECTION_3_NAME])
  - Governance rules
- Removed sections: none
- Templates: none modified (dependent templates read this file at runtime)
- Deferred TODOs: none
-->

# Medication Safety Prototype Constitution

## Core Principles

### I. Stakeholder Traceability (NON-NEGOTIABLE)

- Every functional requirement in a spec MUST cite at least one goal ID from
  `docs/goal-model.md` (e.g. G-22) and at least one interview transcript reference
  (e.g. T2:14, F1:37).
- Every requirement MUST have a stable identifier (REQ-NN / FR-NNN) that is reused unchanged
  in plans, tasks, code comments or test names, and `docs/traceability.md`.
- Every implemented behavior MUST trace back to a requirement; code that serves no requirement
  MUST be removed or justified in the spec as a validated additional need.
- The Requirements Traceability Matrix MUST record, per requirement: interview evidence, goal ID,
  code component/function, and status (fully / partially / not satisfied).

**Rationale**: The assignment is graded on evidence-based traceability from interviews to goals,
requirements and code; an untraceable feature cannot be evaluated or defended.

### II. Sprint Scope Discipline

- Each prototype version MUST implement only the goals listed in the "Goals to build" table of
  that version's `docs/goal-model.md` (V1: G-4, G-7, G-8, G-17, G-43, G-38, G-22, G-24, G-25,
  G-34, G-33, G-42, G-36). V2 MAY also build the goals in the goal model's "Added in V2" table
  (G-18, G-19, G-20), chosen from the V1 evaluation.
- Goals outside the sprint scope (e.g. regimen changes G-9/G-15) MUST NOT be implemented, even if
  an agent proposes them.
- Any "additional need" an agent or developer anticipates MUST be recorded as an assumption or
  open question in the spec and validated by the team before it is built.

**Rationale**: The sprint scope was chosen deliberately (core, user-facing, high-uncertainty);
scope creep dilutes the evaluation and hides whether the selected goals are satisfied.

### III. Preserve Conflicts and Decisions

- Documented conflicts and trade-offs (C1 alert urgency, C2 consent vs. alerting, C3 definition
  of "missed", G-22 vs. G-31) MUST be carried into specs with the decision and its rationale.
- Rejected alternatives (e.g. G-26 "alert Rachel immediately") MUST remain in the goal model and
  spec as rejected, never silently deleted.
- Unresolved questions (e.g. whether in-app opt-in counts as written consent) MUST be marked
  as open questions in the spec, not resolved by the implementation.
- Implementations MUST follow the recorded decision; an agent MUST NOT re-decide a conflict.

**Rationale**: Conflict resolution is a human requirements-engineering judgment; preserving it
keeps the reasoning auditable across V1 and V2.

### IV. Specification Before Implementation

- Behavior changes MUST be made to the spec first, then propagated through plan and tasks via
  Spec Kit, then implemented. Code MUST NOT drift ahead of the spec.
- Every requirement MUST have at least one Given/When/Then acceptance scenario that can be
  checked by interacting with the prototype.
- Evaluation findings MUST be classified as either an **implementation defect** (spec was clear,
  code is wrong → fix code) or a **requirements issue** (spec missing/ambiguous/incorrect → revise
  spec, and goal model if relationships changed).
- V1 artifacts (goal model, spec, Spec Kit artifacts, source) MUST be preserved via a `v1`
  branch/tag before V2 work begins; V2 MUST build on V1 so history is retained.

**Rationale**: Spec-driven development only keeps requirements and code consistent if the spec
remains the source of truth.

### V. Simple, Accessible, Mock-Data Prototype

- Prototypes MUST use mock data and simplified interactions; no real patient data, real
  notifications (SMS/email/push), or external health-record integrations.
- Prototypes MUST be deployable as a static/front-end application from `frontend/` so V1 and V2
  can be hosted at separate, persistent URLs.
- Harold's views MUST use large text and large tap targets (G-36) and confirm a due dose with a
  single tap (G-7). Safety prompts for repeated doses (FR-009) and missed high-risk doses
  (FR-015) are allowed.
- Complexity (backends, auth providers, frameworks beyond what the scope needs) MUST be
  justified in the plan's complexity tracking; otherwise the simplest option wins.

**Rationale**: Grading emphasizes requirements and traceability over polish; simple deployable
prototypes keep effort on stakeholder goals.

## Safety, Privacy and Consent Constraints

- Consent is a hard constraint (C2): Rachel MUST receive nothing by default. She receives an
  urgent "please check in" message without medication details only after Harold designates her
  as safety contact (G-42), and medication name/due time/status only for medications Harold has
  shared (G-33).
- Harold and Dr. Nguyen MUST always receive urgent alerts for high-risk flagged doses (G-24).
- Low-risk flags MUST produce only a routine notice to Harold (G-25); Rachel MUST NOT be alerted
  when Harold is slightly late, i.e. while a dose is still inside its window (G-34).
- Each medication MUST carry a window and a risk level (high/low) set by Dr. Nguyen (G-38);
  missed-dose flags fire only when the window closes, while duplicate and "unsure" flags fire
  immediately (C3).
- User-facing wording MUST be neutral and non-alarming toward Harold; reminders fire once
  without repeats (C1 trade-off with G-31).

## Development Workflow and Quality Gates

- Workflow per version: `/speckit-specify` → `/speckit-clarify` (as needed) → `/speckit-plan`
  → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`.
- Repository layout MUST follow: `frontend/` (source), `specs/` (Spec Kit artifacts),
  `docs/goal-model.md`, `docs/traceability.md`, `docs/learning-log.md`, and a root `README.md`
  linking V1 and V2 versions, both deployment URLs, the learning log, and a Roles and
  Responsibilities section.
- Gate before implementation: plan passes the Constitution Check against Principles I–V.
- Gate before tagging a version: every in-scope requirement appears in the traceability matrix
  with a status, and each acceptance scenario has been exercised against the deployed prototype.
- `docs/learning-log.md` MUST be authored by the team without AI assistance; agents MUST NOT
  write, edit, or generate content for it.

## Governance

- This constitution supersedes other project practices; specs, plans, tasks and reviews MUST
  verify compliance with it.
- Amendments require: a change to this file via `/speckit-constitution`, a Sync Impact Report,
  agreement of the team, and propagation to any affected specs or plans.
- Versioning follows semantic versioning: MAJOR for removing or redefining a principle, MINOR
  for adding a principle/section or materially expanding guidance, PATCH for clarifications.
- Compliance is reviewed at each Spec Kit gate (plan Constitution Check, `/speckit-analyze`)
  and before tagging V1 and V2. Violations MUST be fixed or explicitly justified in the plan.

**Version**: 1.1.0 | **Ratified**: 2026-11-14 | **Last Amended**: 2026-11-15
