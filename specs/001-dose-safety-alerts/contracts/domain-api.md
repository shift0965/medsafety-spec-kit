# Contract: Domain Functions

**Feature**: [../spec.md](../spec.md) | **Data model**: [../data-model.md](../data-model.md)

Pure functions in `frontend/src/domain/`. The UI changes state only through these. Each takes the
current `AppState` and returns a new `AppState` (no mutation, no reading the device clock).

`AppState = { clock, medications, doses, flags, alerts, consent }`

## Actions

| Function | Input | Effect | Errors / no-ops | FR |
|---|---|---|---|---|
| `tick(state, now)` | new simulated time | Sets clock; creates today's doses; marks doses `due` and sets `reminderShownAt` once at `dueAt`; raises `missed` flags (and their alerts) for doses whose window closed | `now` earlier than clock → no-op | FR-001, FR-012, FR-014, FR-016, FR-017, FR-021 |
| `confirmDose(state, doseId)` | dose (scheduled, due, unsure or missed) | If the dose already has a confirmation, **or** the medication's latest confirmation is less than 6 h old: returns state unchanged plus `needsDuplicateChoice: true`. Otherwise records time, status `taken` (or `takenLate` if missed, adding the note "taken late at HH:MM" to the missed flag; an unsure dose becomes `taken` and keeps its unsure flag). A `scheduled` dose is an early dose: allowed only when `now ≥ dueAt − 120 min`, snapshots window/risk, status `taken`, no reminder later | unknown dose → error; early dose more than 120 min before `dueAt` → error | FR-002, FR-003, FR-004, FR-009, FR-015 |
| `resolveDuplicateChoice(state, doseId, choice)` | dose that triggered `needsDuplicateChoice`; `choice: "tookAnother" \| "mistake" \| "unsure"` | `tookAnother` → adds the confirmation, status `duplicate`, raises `duplicate` flag + alerts; `mistake` → no change; `unsure` → same effect as `markUnsure` | dose that would not trigger the prompt → error | FR-009, FR-013 |
| `markUnsure(state, doseId)` | due or taken dose | Sets `unsureAt`, status `unsure`, raises `unsure` flag + alerts (keeps existing confirmations) | dose already unsure → no-op | FR-007, FR-008, FR-013 |
| `setMedicationSettings(state, medId, {windowMinutes, riskLevel})` | Dr. Nguyen (pharmacist) input | Updates medication; doses still `scheduled` use the new values when they become due; doses that already left `scheduled` keep their snapshot | window outside 5–240 → error | FR-010, FR-011 |
| `setSafetyContact(state, enabled)` | Harold input | Sets `consent.rachelIsSafetyContact` | — | FR-020 |
| `setShared(state, medId, shared)` | Harold input | Sets `sharedWithRachel` | — | FR-022 |
| `markAlertRead(state, alertId)` | recipient | Sets `read` | — | — |
| `resetDemo()` | — | Returns seed state | — | — |

## Queries

| Function | Returns | FR |
|---|---|---|
| `lastTakenAt(state, medId)` | latest confirmation time or `null` | FR-005 |
| `haroldView(state)` | medication cards (name, next/current dose, status, last taken, reminder?, `confirmTargetId` for **I took it** — the next `scheduled` dose if it is within 2 h, else today's current dose in any status, else none; `needsLateCheck` when the target is missed and high-risk), routine notices, urgent alerts. **I took it** stays available on an unsure dose | FR-001–FR-008, FR-015, FR-017 |
| `nguyenView(state)` | all medications with effective window/risk and `usesDefaults`; urgent alerts with full details | FR-010, FR-011, FR-016, FR-018 |
| `rachelView(state)` | shared medications only (name, due time, status); her alerts (`checkInOnly` content); `nothingShared` flag | FR-019, FR-021, FR-022 |

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
3. No alert for Dr. Nguyen or Rachel exists for a low-risk flag (FR-017).
4. Every alert to Rachel has `contentLevel: checkInOnly` (FR-021).
5. `rachelView` never includes a medication with `sharedWithRachel = false` (FR-019, FR-022).
6. `reminderShownAt` is set at most once per dose (FR-001).
7. Alerts are never removed except by `resetDemo` (FR-015).
8. A dose never gains a second confirmation, and no dose is confirmed within 6 h of the
   medication's previous confirmation, except through `resolveDuplicateChoice` (FR-009).
9. A dose's `windowMinutes`/`riskLevel` never change after it leaves `scheduled` (spec edge case).
