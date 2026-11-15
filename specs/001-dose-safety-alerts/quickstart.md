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
Steps marked *(V2)* changed in the V2 revision; section F is new in V2.

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
7. *(V2)* Reset. Advance to 07:00, tap **I'm not sure** on Levothyroxine → last-taken shown and
   "Please wait for Dr. Nguyen's advice before taking another."; routine notice only (low risk).
   → US2-1, US4-3
   7a. **I took it** is still shown on Levothyroxine; tap it → status taken, the unsure flag stays
   open until Dr. Nguyen answers. → edge case "unsure then later remembers"

### C. Settings (US3)

8. In Dr. Nguyen's view, Metoprolol shows a "default" badge (60 min, high). → US3-3
9. Set Levothyroxine to 30 min / low and Warfarin to high; values are saved and shown. *(V2)* These
   match the seed, so also set Atorvastatin to 45 min / high and check that it saves and shows.
   → US3-1, US3-2
   9a. Reset. Before 08:00, set Warfarin's window to 90 min; advance to 08:00, then set it to
   30 min. Advance to 09:15: no Warfarin flag, because today's dose kept the 90-min window it had
   when it became due (it closes at 09:30). → edge case "window changed while a dose is pending"

### D. Windows and urgency (US4)

10. Reset. Advance to 08:30 without confirming Warfarin: no Warfarin flag and no urgent alerts.
   (Levothyroxine's window closed at 07:30, so one low-risk routine notice to Harold is expected
   and also confirms US4-3.) → US4-1
11. Advance to 09:00: Warfarin flagged missed; urgent alerts for Harold and Dr. Nguyen; nothing
    for Rachel. (Metoprolol, default high risk, is also flagged missed with urgent alerts.) → US4-2
12. *(V2)* Advance to 09:15 and tap **I took it** on Warfarin: "This dose is late. Ask Dr. Nguyen
    before taking it." appears first with **Ask Dr. Nguyen** / **I already took it**, and no dosing
    advice. → US4-5
13. *(V2)* Tap **I already took it**: status "taken late 09:15"; flag and alerts still present;
    Dr. Nguyen has a new urgent "advice requested" alert. → US4-6
14. Advance to 22:00 without confirming Atorvastatin: routine notice to Harold only. → US4-3
15. Reset. At 17:30 Atorvastatin shows no **I took it** button (more than 2 h early). At 18:00
    tap **I took it** on Atorvastatin (early dose). Advance to 20:00: no reminder for Atorvastatin;
    last taken shows 18:00. → edge case "dose confirmed before due time"
    15a. Reset. Advance to 15:00 (Metoprolol 08:00 missed), tap **I took it**, then **I already
    took it**: "taken late 15:00".
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

### F. Advice resolves a flag (US6, V2)

21. Reset. Advance to 07:05 and tap **I'm not sure** on Levothyroxine. Its card shows the
    last-taken line and "Please wait for Dr. Nguyen's advice before taking another." and no other
    instruction. Dr. Nguyen's **Flags awaiting advice** lists it, with no new alert badge.
    → US6-1, US6-8
22. In Dr. Nguyen's view choose **Take it now** for that flag. Harold's Levothyroxine card and a
    notice show "Dr. Nguyen: Take it now"; tap **OK**. Dr. Nguyen's dose log shows the flag as
    resolved with the advice and time; earlier notices are still listed. → US6-2, US6-7
23. Reset. Advance to 15:00, tap **I took it** on Metoprolol, then **I already took it** ("taken
    late 15:00"). Advance to 18:30, tap **I took it** on Metoprolol and choose **Yes, I took
    another**. The card shows "Waiting for Dr. Nguyen's advice". Advance to 21:00: no Metoprolol
    reminder at 20:00 and no missed flag for the 20:00 dose. → US6-3
24. In Dr. Nguyen's view choose **Skip your next dose** for the duplicate flag. The 20:00 dose shows
    "Skipped (Dr. Nguyen's advice)"; advance to 22:00: still no missed flag; the duplicate flag is
    resolved. → US6-4
25. Reset and repeat step 23 up to 18:30. Advance to 19:00 and, in Dr. Nguyen's view, choose **Take
    your next dose as usual**. Advance to 20:00: "Time for your Metoprolol" appears. → US6-5
26. Reset. Advance to 09:15, tap **I took it** on Warfarin and choose **Ask Dr. Nguyen**. Nothing is
    recorded; the card shows "Please wait for Dr. Nguyen's advice before taking it."; Dr. Nguyen has
    an urgent "advice requested" alert; Rachel's view is unchanged. → US6-6, US6-8
27. In Dr. Nguyen's view choose **Take it now** for that flag; on Harold's view tap **OK**, then
    **I took it** on Warfarin. No late-dose dialog appears; the card shows "Taken late at 09:15".
    → FR-027

## Expected automated checks

`npm test` covers the invariants in [contracts/domain-api.md](./contracts/domain-api.md) (V2 adds
10–13) and the rule-based acceptance scenarios (US2, US4, US5, US6). All must pass before tagging
`v1` (V1) or `v2` (V2).

## Deploy

Build `frontend/` and deploy `frontend/dist` as a static site (research R9). Record the URL in
`README.md`, repeat this walkthrough against the deployed URL, and only then tag `v1`. Later,
create a separate deployment for `v2`, repeat the walkthrough (including section F) against it,
record its URL, and only then tag `v2`.
