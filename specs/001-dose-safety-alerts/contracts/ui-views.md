# Contract: User Interface Views

**Feature**: [../spec.md](../spec.md) | **Domain**: [domain-api.md](./domain-api.md)

The prototype exposes one page with a role switcher and a demo control bar. No authentication.

## Global elements

| Element | Contents | Notes |
|---|---|---|
| Role switcher | Harold · Rachel · Dr. Nguyen, each with unread-alert count | R6 |
| Demo bar | Current simulated time; set time; +5 min, +15 min, +1 h; "Next event" (next due time or window close); Reset demo | R3; visually separate from the role views, labelled "Demo controls" |

## Harold's view (patient, large print)

Applies G-36: base text ≥ 24 px, buttons ≥ 64 px tall, high contrast (SC-006).

| Element | Contents | Interaction | FR |
|---|---|---|---|
| Urgent alert banner | Medication, reason, time; "OK" to mark read | tap OK | FR-016, FR-018 |
| Routine notices | Calm wording, e.g. "Atorvastatin 20:00 wasn't recorded." | tap OK | FR-017 |
| Medication card (one per medication) | Name, next due time, status, "Last taken: …" | — | FR-005 |
| Reminder state on card | Neutral text "Time for your Warfarin" plus two large buttons: **I took it**, **I'm not sure** | single tap each | FR-001, FR-003, FR-007 |
| After "I took it" | Reminder disappears; status "Taken at 08:04" | — | FR-002, FR-004 |
| After "I'm not sure" | Shows last-taken time and "Please wait before taking another. Dr. Nguyen has been told." (high risk) / "…has been noted." (low risk). **I took it** stays visible so Harold can confirm if he remembers | tap I took it → taken, unsure flag kept | FR-008, edge case |
| Second "I took it" on a taken dose | Dialog: "You recorded this at 08:04." with three large buttons: **Yes, I took another** / **No, I tapped by mistake** / **I'm not sure** | another → duplicate; mistake → nothing; not sure → unsure (as above) | FR-009 |
| "I took it" on a missed high-risk dose | Message first: "Check with Dr. Nguyen about this late dose." No dosing advice. Buttons: **Record that I took it** / **Go back** | record → "Taken late at 09:15", flag stays | FR-015 |
| "I took it" before the due time | Shown only within 2 hours before the next due time; records an early dose, so no reminder appears for it. If the medication was confirmed less than 6 hours ago, opens the duplicate dialog instead | single tap | FR-003, FR-004, FR-009 (edge case) |
| Sharing settings | "Rachel is my safety contact" toggle; per-medication "Share with Rachel" toggles; plain-language explanation of each tier | toggle | FR-020, FR-022 |

## Dr. Nguyen's view (community pharmacist)

| Element | Contents | Interaction | FR |
|---|---|---|---|
| Medication settings table | Name, times, window (min), risk (high/low), "default" badge when unset (default = 60 min, high) | edit window and risk, save | FR-010, FR-011 |
| Alerts list | Urgent alerts: medication, reason, dose time, raised time | mark read | FR-016, FR-018 |
| Dose log (read-only) | Today's doses with status, confirmation times, flags | — | FR-004, FR-015 |

## Rachel's view (family)

| Element | Contents | Interaction | FR |
|---|---|---|---|
| Empty state | "Harold hasn't shared anything with you." when not safety contact and nothing shared | — | FR-019 |
| Safety messages | "Please check in with Harold." + time only; no medication info | mark read | FR-021 |
| Shared medications | For shared ones only: name, due time, status | — | FR-017, FR-022 |

## Wording rules

- Harold's reminders and notices use neutral, non-blaming wording (FR-001; C1 trade-off).
- Rachel never sees the words "missed", "duplicate" or "unsure" for unshared medications or in
  safety messages (FR-021).
