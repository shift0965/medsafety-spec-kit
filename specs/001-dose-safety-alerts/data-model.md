# Data Model: Dose Confirmation and Risk-Based Alerts

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-14

All data is mock data held in app state (see [research.md](./research.md) R2). Times are
simulated-clock times (R3).

## Entities

### Person

| Field | Type | Notes |
|---|---|---|
| id | `"harold" \| "rachel" \| "nguyen"` | Fixed roles for the prototype |
| displayName | string | "Harold", "Rachel", "Dr. Nguyen" |
| role | `"patient" \| "family" \| "prescriber"` | |

### Medication (G-38, G-33)

| Field | Type | Rules |
|---|---|---|
| id | string | unique |
| name | string | e.g. "Warfarin" |
| scheduleTimes | `"HH:MM"[]` | at least one due time per day |
| windowMinutes | number \| null | 5–240 when set; `null` → default 60 (FR-011) |
| riskLevel | `"high" \| "low"` \| null | `null` → default `"low"` (FR-011) |
| sharedWithRachel | boolean | default `false` (FR-019, FR-022) |

Derived: `effectiveWindow`, `effectiveRisk`, `usesDefaults` (shown in Dr. Nguyen's view, FR-011).

### Dose (G-4, G-7, G-8, G-43)

One scheduled intake of a medication on a given day.

| Field | Type | Rules |
|---|---|---|
| id | string | `${medicationId}@${date}T${time}` |
| medicationId | string | → Medication |
| dueAt | datetime | |
| windowMinutes | number | **snapshot** of the effective window when the dose was created (edge case: later changes do not affect pending doses) |
| riskLevel | `"high" \| "low"` | snapshot, as above |
| status | DoseStatus | see state machine |
| confirmations | datetime[] | each "I took it" time; length 2+ means duplicate (FR-009) |
| unsureAt | datetime \| null | set by "I'm not sure" (FR-007) |
| reminderShownAt | datetime \| null | set once; never re-set (FR-001) |

Derived: `windowClosesAt = dueAt + windowMinutes`; `lastTakenAt` per medication = latest
confirmation across its doses (FR-005).

### Flag (G-22)

| Field | Type | Rules |
|---|---|---|
| id | string | |
| doseId | string | → Dose |
| reason | `"missed" \| "duplicate" \| "unsure"` | |
| raisedAt | datetime | |
| riskLevel | `"high" \| "low"` | copied from dose |
| note | string \| null | e.g. "taken late at 09:15" (FR-015) |

At most one flag per (dose, reason).

### Alert (G-24, G-25, G-42)

| Field | Type | Rules |
|---|---|---|
| id | string | |
| flagId | string | → Flag |
| recipient | Person id | |
| urgency | `"urgent" \| "routine"` | |
| contentLevel | `"full" \| "checkInOnly"` | `checkInOnly` for Rachel as safety contact (FR-021) |
| createdAt | datetime | = flag.raisedAt (R10) |
| read | boolean | |

Alerts are never deleted or withdrawn (FR-015).

### ConsentSettings (G-42, G-33)

| Field | Type | Default |
|---|---|---|
| rachelIsSafetyContact | boolean | `false` |
| (per-medication) `Medication.sharedWithRachel` | boolean | `false` |

### DemoClock

| Field | Type | Notes |
|---|---|---|
| now | datetime | single time source for all rules (R3) |

## Dose state machine

```text
            reminder shown at dueAt (once)
 scheduled ───────────────────────────────▶ due
    │  confirm before dueAt                  │
    ▼                                        ├── confirm (inside window) ──────▶ taken
  taken                                      ├── "I'm not sure" ───────────────▶ unsure      [flag: unsure]
                                             └── now ≥ windowClosesAt ────────▶ missed      [flag: missed]
 taken  ── confirm again + explicit yes ──────────────────────────────────────▶ duplicate   [flag: duplicate]
 taken  ── confirm again + cancel ────────────────────────────────────────────▶ taken (no change)
 unsure ── confirm ───────────────────────────────────────────────────────────▶ taken      (unsure flag kept)
 missed ── confirm ───────────────────────────────────────────────────────────▶ takenLate  (missed flag kept, note added)
```

`DoseStatus = "scheduled" | "due" | "taken" | "takenLate" | "unsure" | "missed" | "duplicate"`

## Rules (validation and routing)

| Rule | Source |
|---|---|
| No flag and no alert while `now < windowClosesAt` and the dose is not unsure/duplicate | FR-014 |
| Missed flag raised when `now ≥ windowClosesAt` and no confirmation and no unsure mark | FR-012 |
| Unsure and duplicate flags raised at the moment of the action | FR-013 |
| High-risk flag → urgent alerts to Harold and Dr. Nguyen, `contentLevel: full` | FR-016 |
| High-risk flag and `rachelIsSafetyContact` → urgent alert to Rachel, `contentLevel: checkInOnly` | FR-021 |
| Low-risk flag → routine notice to Harold only | FR-017, FR-023 |
| Rachel's view lists only medications with `sharedWithRachel` (name, due time, status) | FR-019, FR-022 |
| Rachel's view never shows flag reason or details of unshared medications | FR-019, FR-021 |

## Seed data (mock)

| Medication | Times | Window | Risk | Shared |
|---|---|---|---|---|
| Warfarin | 08:00 | 60 | high | no |
| Atorvastatin | 20:00 | 120 | low | no |
| Levothyroxine | 07:00 | 30 | low | no |
| Metoprolol | 08:00, 20:00 | not set (default) | not set (default) | no |

Demo clock starts at 06:45 on the current day (before the first due dose, so no window has closed yet). Rachel is not a safety contact.
