# Data Model: Dose Confirmation and Risk-Based Alerts

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-14, V2 revision 2026-11-15

All data is mock data held in app state (see [research.md](./research.md) R2). Times are
simulated-clock times (R3).

## Entities

### Person

| Field | Type | Notes |
|---|---|---|
| id | `"harold" \| "rachel" \| "nguyen"` | Fixed roles for the prototype |
| displayName | string | "Harold", "Rachel", "Dr. Nguyen" |
| role | `"patient" \| "family" \| "pharmacist"` | Dr. Nguyen is Harold's community pharmacist (T3:4) |

### Medication (G-38, G-33)

| Field | Type | Rules |
|---|---|---|
| id | string | unique |
| name | string | e.g. "Warfarin" |
| scheduleTimes | `"HH:MM"[]` | at least one due time per day |
| windowMinutes | number \| null | 5–240 when set; `null` → default 60 (FR-011) |
| riskLevel | `"high" \| "low"` \| null | `null` → default `"high"` (FR-011) |
| sharedWithRachel | boolean | default `false` (FR-019, FR-022) |

Derived: `effectiveWindow`, `effectiveRisk`, `usesDefaults` (shown in Dr. Nguyen's view, FR-011).

### Dose (G-4, G-7, G-8, G-43)

One scheduled intake of a medication on a given day.

| Field | Type | Rules |
|---|---|---|
| id | string | `${medicationId}@${date}T${time}` |
| medicationId | string | → Medication |
| dueAt | datetime | |
| windowMinutes | number \| null | **snapshot** of the effective window, taken when the dose leaves `scheduled` (becomes due, or is confirmed early or marked unsure); `null` before that. Settings changed later do not affect it (spec edge case) |
| riskLevel | `"high" \| "low"` \| null | snapshot, as above |
| status | DoseStatus | see state machine |
| confirmations | datetime[] | each "I took it" time; length 2+ means duplicate (FR-009) |
| unsureAt | datetime \| null | set by "I'm not sure" (FR-007) |
| reminderShownAt | datetime \| null | set once; never re-set (FR-001) |
| releasedAt | datetime \| null | V2: when a held dose was released after its due time; its window counts from here (R13) |

Derived: `windowClosesAt = (releasedAt ?? dueAt) + windowMinutes`; `lastTakenAt` per medication =
latest confirmation across its doses (FR-005); V2 `heldDose(flag)` = while a `duplicate` or
`unsure` flag is open, the first dose of that medication due after the flagged dose; only that
dose is held (R11).

### Flag (G-22)

| Field | Type | Rules |
|---|---|---|
| id | string | |
| doseId | string | → Dose |
| reason | `"missed" \| "duplicate" \| "unsure"` | |
| raisedAt | datetime | |
| riskLevel | `"high" \| "low"` | copied from dose |
| note | string \| null | e.g. "taken late at 09:15" (FR-015) |
| status | `"open" \| "resolved"` | V2: `open` until Dr. Nguyen gives advice (FR-027) |
| resolvedAt | datetime \| null | V2 |
| adviceRequestedAt | datetime \| null | V2: set by Harold's late-dose check (FR-015) |
| takenBeforeRequest | boolean \| null | V2: "I already took it" (true) or "Ask Dr. Nguyen" (false) |

At most one flag per (dose, reason).

### Advice (V2; G-19, G-20)

| Field | Type | Rules |
|---|---|---|
| id | string | |
| flagId | string | → Flag; exactly one advice per resolved flag |
| option | `"takeNow" \| "skipNextDose" \| "takeNextAsUsual" \| "callMe"` | fixed list (FR-025, team assumption) |
| givenAt | datetime | |
| acknowledged | boolean | Harold's notice shows until `true` (FR-026) |

Display text: "Take it now", "Skip your next dose", "Take your next dose as usual",
"Please call me", always shown as "Dr. Nguyen: <text>".

### Alert (G-24, G-25, G-42)

| Field | Type | Rules |
|---|---|---|
| id | string | |
| flagId | string | → Flag |
| recipient | Person id | |
| urgency | `"urgent" \| "routine"` | |
| contentLevel | `"full" \| "checkInOnly"` | `checkInOnly` for Rachel as safety contact (FR-021) |
| kind | `"flag" \| "adviceRequest"` | V2: `adviceRequest` = urgent alert to Dr. Nguyen from FR-015 |
| createdAt | datetime | = flag.raisedAt (R10); for `adviceRequest`, the request time |
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
    │  confirm ≤ 2 h before dueAt (early)    │
    ▼                                        ├── confirm (inside window) ──────▶ taken
  taken                                      ├── "I'm not sure" ───────────────▶ unsure      [flag: unsure]
                                             └── now ≥ windowClosesAt ────────▶ missed      [flag: missed]
 taken  ── confirm again + "Yes, I took another" ────────────────────────────▶ duplicate   [flag: duplicate]
 taken  ── confirm again + "No, I tapped by mistake" ────────────────────────▶ taken (no change)
 taken  ── confirm again + "I'm not sure" ───────────────────────────────────▶ unsure      [flag: unsure]
 unsure ── confirm ───────────────────────────────────────────────────────────▶ taken      (unsure flag kept)
 missed ── confirm ───────────────────────────────────────────────────────────▶ takenLate  (missed flag kept, note added;
                                                                                   high risk: late check + advice request first)

 V2 holds and advice (R11, R13):
 scheduled ── dueAt reached while it is an open flag's heldDose ──────────────▶ held       (no reminder, no missed flag)
 held / scheduled ── advice "Skip your next dose" ───────────────────────────▶ skipped    (no reminder, no missed flag)
 held ── hold released, dueAt passed ───────────────────────────────────────▶ due        (releasedAt = now, reminder now)
 held ── hold released, dueAt not passed ───────────────────────────────────▶ scheduled
```

`DoseStatus = "scheduled" | "due" | "taken" | "takenLate" | "unsure" | "missed" | "duplicate" | "held" | "skipped"`

Flag: `open ── giveAdvice ──▶ resolved` (one-way; resolved flags and their alerts stay visible).

**Early dose** (spec edge case, T1:30, T1:32): confirming before `dueAt` applies to the *next*
due dose of that medication that has no confirmation (for twice-daily medications, the next of the
two), and is allowed only when `now ≥ dueAt − 120 min`. If the medication's latest confirmation is
less than 6 hours old, the tap opens the FR-009 three-choice prompt instead of recording. An early
dose never shows a reminder.

**Confirm after unsure** (spec edge case "unsure then later remembers"): an `unsure` dose with no
confirmation can still be confirmed with **I took it**, which stays visible; the dose becomes
`taken` and the unsure flag is kept. An `unsure` dose that already has a confirmation (unsure
chosen in the FR-009 prompt) opens the FR-009 prompt again.

## Rules (validation and routing)

| Rule | Source |
|---|---|
| No flag and no alert while `now < windowClosesAt` and the dose is not unsure/duplicate | FR-014 |
| Missed flag raised when `now ≥ windowClosesAt` and no confirmation and no unsure mark | FR-012 |
| Unsure and duplicate flags raised at the moment of the action | FR-013 |
| High-risk flag → urgent alerts to Harold and Dr. Nguyen, `contentLevel: full` | FR-016 |
| High-risk flag and `rachelIsSafetyContact` → urgent alert to Rachel, `contentLevel: checkInOnly` | FR-021 |
| Low-risk flag → routine notice to Harold only | FR-017 |
| Rachel's view lists only medications with `sharedWithRachel` (name, due time, status) | FR-019, FR-022 |
| Rachel's view never shows flag reason or details of unshared medications | FR-019, FR-021 |
| Early confirmation only when `now ≥ dueAt − 120 min` | Spec edge case (team assumption) |
| Medication confirmed less than 6 h ago → FR-009 prompt, never a silent second record | FR-009 |
| Window and risk are snapshotted when a dose leaves `scheduled` | FR-010, spec edge case |
| V2: an open `duplicate`/`unsure` flag holds only the medication's next dose (`heldDose`): it becomes `held`, not `due`; later doses follow the V1 rules | FR-008, FR-009 |
| V2: Dr. Nguyen's list shows every open flag (any reason, any risk); low-risk ones add no alert | FR-024, FR-017 |
| V2: advice only on an `open` flag; it resolves the flag and releases that flag's held dose unless another open flag holds it | FR-025, FR-027 |
| V2: after advice given since the medication's latest confirmation, the next confirm skips the FR-009 and FR-015 prompts | FR-027 |
| V2: "Skip your next dose" skips the flag's `heldDose` (held or still scheduled) | FR-027 |
| V2: late high-risk check (either choice) → one urgent `adviceRequest` alert to Dr. Nguyen | FR-015 |
| V2: all dosing instructions come from an `Advice` record; the app's own text is only the waiting message | FR-028 |

## Seed data (mock)

| Medication | Times | Window | Risk | Shared |
|---|---|---|---|---|
| Warfarin | 08:00 | 60 | high | no |
| Atorvastatin | 20:00 | 120 | low | no |
| Levothyroxine | 07:00 | 30 | low | no |
| Metoprolol | 08:00, 20:00 | not set (default 60) | not set (default high) | no |

Demo clock starts at 06:45 on the current day (before the first due dose, so no window has closed yet). Rachel is not a safety contact.
