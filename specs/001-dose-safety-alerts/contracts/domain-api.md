# Contract: Domain Functions

**Feature**: [../spec.md](../spec.md) | **Data model**: [../data-model.md](../data-model.md)

Pure functions in `frontend/src/domain/`. The UI changes state only through these. Each takes the
current `AppState` and returns a new `AppState` (no mutation, no reading the device clock).

`AppState = { clock, medications, doses, flags, alerts, consent }`

## Actions

| Function | Input | Effect | Errors / no-ops | FR |
|---|---|---|---|---|
| `tick(state, now)` | new simulated time | Sets clock; creates today's doses; marks doses `due` and sets `reminderShownAt` once at `dueAt`; raises `missed` flags (and their alerts) for doses whose window closed | `now` earlier than clock → no-op | FR-001, FR-012, FR-014, FR-016, FR-017, FR-021 |
| `confirmDose(state, doseId)` | dose | If no confirmation: records time, status `taken` (or `takenLate` if missed; keeps unsure flag). If already confirmed: returns state unchanged plus `needsDuplicateConfirm: true` | unknown dose → error | FR-002, FR-003, FR-004, FR-009, FR-015 |
| `confirmDuplicate(state, doseId)` | dose already taken | Adds second confirmation, status `duplicate`, raises `duplicate` flag + alerts | dose not taken → error | FR-009, FR-013 |
| `markUnsure(state, doseId)` | due dose | Sets `unsureAt`, status `unsure`, raises `unsure` flag + alerts | dose already taken → error (use confirm path) | FR-007, FR-008, FR-013 |
| `setMedicationSettings(state, medId, {windowMinutes, riskLevel})` | Dr. Nguyen input | Updates medication; future doses use new values; pending doses unchanged | window outside 5–240 → error | FR-010, FR-011 |
| `setSafetyContact(state, enabled)` | Harold input | Sets `consent.rachelIsSafetyContact` | — | FR-020 |
| `setShared(state, medId, shared)` | Harold input | Sets `sharedWithRachel` | — | FR-022 |
| `markAlertRead(state, alertId)` | recipient | Sets `read` | — | — |
| `resetDemo()` | — | Returns seed state | — | — |

## Queries

| Function | Returns | FR |
|---|---|---|
| `lastTakenAt(state, medId)` | latest confirmation time or `null` | FR-005 |
| `haroldView(state)` | medication cards (name, next/current dose, status, last taken, reminder?), routine notices, urgent alerts | FR-001–FR-008, FR-017 |
| `nguyenView(state)` | all medications with effective window/risk and `usesDefaults`; urgent alerts with full details | FR-010, FR-011, FR-016, FR-018 |
| `rachelView(state)` | shared medications only (name, due time, status); her alerts (`checkInOnly` content); `nothingShared` flag | FR-019, FR-021, FR-022, FR-023 |

## Alert routing (internal, `routeFlag(state, flag)`)

```text
flag.riskLevel = high → urgent/full → Harold, Dr. Nguyen
                       + urgent/checkInOnly → Rachel   (only if consent.rachelIsSafetyContact)
flag.riskLevel = low  → routine/full → Harold only
```

## Invariants (must hold after every action; covered by unit tests)

1. No flag exists for a dose with `now < windowClosesAt` unless its reason is `unsure` or
   `duplicate` (FR-014).
2. Every high-risk flag has exactly one urgent alert for Harold and one for Dr. Nguyen (FR-016).
3. No alert for Dr. Nguyen or Rachel exists for a low-risk flag (FR-017, FR-023).
4. Every alert to Rachel has `contentLevel: checkInOnly` (FR-021).
5. `rachelView` never includes a medication with `sharedWithRachel = false` (FR-019, FR-022).
6. `reminderShownAt` is set at most once per dose (FR-001).
7. Alerts are never removed except by `resetDemo` (FR-015).
