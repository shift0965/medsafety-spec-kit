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
| After "I'm not sure" *(V2)* | Shows last-taken time and "Please wait for Dr. Nguyen's advice before taking another." (both risk levels). **I took it** stays visible so Harold can confirm if he remembers; the flag stays open | tap I took it → taken, unsure flag kept | FR-008, FR-028, edge case |
| Second "I took it" on a taken dose | Dialog: "You recorded this at 08:04." with three large buttons: **Yes, I took another** / **No, I tapped by mistake** / **I'm not sure** | another → duplicate; mistake → nothing; not sure → unsure (as above) | FR-009 |
| "I took it" on a missed high-risk dose *(V2)* | Message first: "This dose is late. Ask Dr. Nguyen before taking it." No dosing advice. Buttons: **Ask Dr. Nguyen** / **I already took it** / **Go back** | ask → nothing recorded, card shows "Please wait for Dr. Nguyen's advice before taking it."; already took → "Taken late at 09:15"; both send Dr. Nguyen an advice request. After advice, **I took it** records the dose directly, with no late-dose or duplicate dialog | FR-015, FR-027, FR-028 |
| Held dose *(V2)* | Status "Waiting for Dr. Nguyen's advice"; no reminder, no **I took it** for that dose | — | FR-009 |
| Advice from Dr. Nguyen *(V2)* | On the card and as a notice: "Dr. Nguyen: Take it now" (etc.) with **OK**; after OK it stays in the card's flag history as "resolved" | tap OK → acknowledged | FR-026, FR-027 |
| Skipped dose *(V2)* | Status "Skipped (Dr. Nguyen's advice)" | — | FR-027 |
| "I took it" before the due time | Shown only within 2 hours before the next due time; records an early dose, so no reminder appears for it. If the medication was confirmed less than 6 hours ago, opens the duplicate dialog instead | single tap | FR-003, FR-004, FR-009 (edge case) |
| Sharing settings | "Rachel is my safety contact" toggle; per-medication "Share with Rachel" toggles; plain-language explanation of each tier | toggle | FR-020, FR-022 |

## Dr. Nguyen's view (community pharmacist)

| Element | Contents | Interaction | FR |
|---|---|---|---|
| Medication settings table | Name, times, window (min), risk (high/low), "default" badge when unset (default = 60 min, high) | edit window and risk, save | FR-010, FR-011 |
| Alerts list | Urgent alerts: medication, reason, dose time, raised time | mark read | FR-016, FR-018 |
| Dose log (read-only) | Today's doses with status, confirmation times, flags (V2: open/resolved and the advice given) | — | FR-004, FR-015, FR-027 |
| Flags awaiting advice *(V2)* | Every open flag, any reason and risk: medication, reason, dose time, risk, dose record; "Harold asked for advice (already taken: yes/no)" when requested; low-risk flags listed without an alert | four buttons: **Take it now**, **Skip your next dose**, **Take your next dose as usual**, **Please call me** | FR-024, FR-025 |
| Advice request alert *(V2)* | Urgent: "<medication> — advice requested — due HH:MM (already taken: yes/no)" | mark read | FR-015 |

## Rachel's view (family)

| Element | Contents | Interaction | FR |
|---|---|---|---|
| Empty state | "Harold hasn't shared anything with you." when not safety contact and nothing shared | — | FR-019 |
| Safety messages | "Please check in with Harold." + time only; no medication info | mark read | FR-021 |
| Shared medications | For shared ones only: name, due time, status (V2: held → "On hold", skipped → "Skipped"; never the advice itself) | — | FR-017, FR-022, C2 |

## Wording rules

- Harold's reminders and notices use neutral, non-blaming wording (FR-001; C1 trade-off).
- Rachel never sees the words "missed", "duplicate" or "unsure" for unshared medications or in
  safety messages (FR-021).
- *(V2)* The app's own words never tell Harold to take, skip or double a dose. The only app
  instruction is the waiting message; every dosing instruction is shown as "Dr. Nguyen: …" (FR-028).
