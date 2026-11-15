# Quickstart & Validation: Dose Confirmation and Risk-Based Alerts

**Feature**: [spec.md](./spec.md) | **Contracts**: [contracts/](./contracts/) |
**Data model**: [data-model.md](./data-model.md)

## Prerequisites

- Node.js 20 LTS or later, npm
- A modern browser (tablet-sized window recommended for Harold's view)

## Run locally

```bash
cd frontend
npm install
npm run dev        # open the printed local URL
npm test           # domain unit tests (Vitest)
npm run build      # static build in frontend/dist for deployment
```

Start each walkthrough with **Reset demo** (clock 06:45, seed data from data-model.md).

## Validation walkthrough

Each step lists the spec scenario it proves. Record results in `docs/traceability.md`.

### A. Confirm and record (US1)

1. Advance to 07:00 and tap **I took it** on Levothyroxine (so its 07:30 window close raises no
   flag). Advance to 08:00. Harold's view shows one reminder each for Warfarin and Metoprolol, with
   **I took it** / **I'm not sure**. → US1-1, edge case "two due at once"
2. Tap **I took it** on Warfarin. Reminder disappears; "Last taken: today 08:00". Metoprolol
   reminder remains. → US1-2, US1-3
3. Advance +15 min. No repeated Metoprolol reminder. → US1-4

### B. Unsure and duplicate (US2)

4. Tap **I took it** on Warfarin again. Dialog shows "You recorded this at 08:00". Tap
   **No, I tapped by mistake** → no flag. → US2-2, US2-4
5. Repeat, tap **Yes, I took another** → duplicate flag; urgent alert in Harold's and
   Dr. Nguyen's views. → US2-3, US4-4
6. Tap **I took it** on Metoprolol, then tap it again and choose **I'm not sure** → dose marked
   unsure and flagged immediately (Metoprolol uses the default high risk, so urgent alerts). → US2-5
7. Reset. Advance to 07:00, tap **I'm not sure** on Levothyroxine → last-taken shown and "please
   wait" advice; routine notice only (low risk). → US2-1, US4-3
   7a. **I took it** is still shown on Levothyroxine; tap it → status taken, the unsure flag stays
   visible. → edge case "unsure then later remembers"

### C. Settings (US3)

8. In Dr. Nguyen's view, Metoprolol shows a "default" badge (60 min, high). → US3-3
9. Set Levothyroxine to 30 min / low and Warfarin to high; values are saved and shown. → US3-1,
   US3-2
   9a. Reset. Before 08:00, set Warfarin's window to 90 min; advance to 08:00, then set it to
   30 min. Advance to 09:15: no Warfarin flag, because today's dose kept the 90-min window it had
   when it became due (it closes at 09:30). → edge case "window changed while a dose is pending"

### D. Windows and urgency (US4)

10. Reset. Advance to 08:30 without confirming Warfarin: no Warfarin flag and no urgent alerts.
   (Levothyroxine's window closed at 07:30, so one low-risk routine notice to Harold is expected
   and also confirms US4-3.) → US4-1
11. Advance to 09:00: Warfarin flagged missed; urgent alerts for Harold and Dr. Nguyen; nothing
    for Rachel. (Metoprolol, default high risk, is also flagged missed with urgent alerts.) → US4-2
12. Advance to 09:15 and tap **I took it** on Warfarin: "Check with Dr. Nguyen about this late
    dose" appears first, with no dosing advice. → US4-5
13. Tap **Record that I took it**: status "taken late 09:15"; flag and alerts still present. → US4-6
14. Advance to 22:00 without confirming Atorvastatin: routine notice to Harold only. → US4-3
15. Reset. At 17:30 Atorvastatin shows no **I took it** button (more than 2 h early). At 18:00
    tap **I took it** on Atorvastatin (early dose). Advance to 20:00: no reminder for Atorvastatin;
    last taken shows 18:00. → edge case "dose confirmed before due time"
    15a. Reset. Advance to 15:00 (Metoprolol 08:00 missed), tap **I took it**, then **Record that
    I took it**: "taken late 15:00".
    Advance to 18:30 and tap **I took it** on Metoprolol: the duplicate dialog opens instead of
    recording, because the last confirmation was less than 6 h ago. → FR-009, edge case

### E. Rachel's access (US5)

16. Reset. Open Rachel's view: "Harold hasn't shared anything with you." → US5-1
17. In Harold's view turn on **Rachel is my safety contact**. Advance to 09:00 (as in step 11):
    Rachel gets "Please check in with Harold." with no medication details. → US5-2
18. Share Atorvastatin only. Rachel's view shows Atorvastatin name, due time, status; nothing
    else. → US5-3
19. Turn off safety contact. Advance to 21:00 so Metoprolol's 20:00 dose (default high risk) is
    flagged missed: Rachel receives no new message. → US5-5
20. Advance to 22:00 (as in step 14): Rachel sees "missed" status on Atorvastatin but no
    alert. → US5-4

## Expected automated checks

`npm test` covers the invariants in [contracts/domain-api.md](./contracts/domain-api.md) and
the rule-based acceptance scenarios (US2, US4, US5). All must pass before tagging `v1`.

## Deploy

Build `frontend/` and deploy `frontend/dist` as a static site (research R9). Record the URL in
`README.md`, repeat this walkthrough against the deployed URL, and only then tag `v1`. Later,
create a separate deployment for `v2` and record its URL too.
