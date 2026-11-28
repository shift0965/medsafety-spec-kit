# Change request analysis (Steps 1 and 2)

Packet C11, four requests. We analyzed Prototype V2 (tag `v2`, commit `362ae19`) against
[`spec.md`](../../specs/001-dose-safety-alerts/spec.md), the [RTM](../traceability.md) and the
[goal model](../goal-model.md). Code paths are relative to `frontend/src/`, tests are in
`frontend/tests/domain/`. We reproduced CR-1 and CR-2 in V2 using Reset demo and the demo clock,
and CR-4 in Chromium against the V2 build.

New softgoals, added to the goal model (§7): **G-44** Minimize DrNguyenEffortToAnswerFlags,
**G-45** Minimize TimeHaroldWaitsForAdvice, **G-46** Minimize WrongAnswerInSafetyPrompt,
**G-47** Maximize RecordDurabilityVisible.

## Step 1: Analysis of each request

### A4-CR-1 (Dr. Nguyen: answered entries come back)

| Item | Answer |
| --- | --- |
| Quality and softgoal | Usability (efficiency) of the "Flags awaiting advice" list. New softgoal G-44, which helps G-19 (advice given). |
| Obstacle | Dr. Nguyen can't tell which entries are new or which ones Harold is waiting on. One dose can carry two open flags (e.g. missed + taken twice) that each need an answer. The next day's flag for the same pill looks identical, because entries show only "due 07:00" with no date. Held doses aren't marked at all. |
| Likelihood | **High.** Reproduced: Warfarin missed at 09:00, Harold taps "I already took it", then taps again and chooses "Yes, I took another". The list now has two Warfarin entries for the same dose, and answering one leaves the other. The RTM already notes this under FR-024. |
| Criticality | **Minor.** Every flag still gets answered. It just takes longer. |
| Classification | **No defect, works as specified.** FR-024 says to list "every open flag … with medication, reason, dose time and the dose's record", and FR-027 resolves "the flag", one at a time. Grouping, dates and a "Harold is waiting" marker would be new intent. |
| Affected artifacts | FR-024, FR-025, FR-027, US6-1/2/7; `views.ts` `nguyenView`, `AdvicePanel.tsx`, `advice.ts` `giveAdvice`; `us6-advice.test.ts`; RTM rows FR-024/025/027. |
| Side effect | If one answer closes every flag on a dose, the advice might fit only one reason (e.g. "Take it now" on a dose that was also taken twice), which works against G-16. **Low / Major.** |
| Feasible in the prototype | Yes. Mock data shows the repeats in a minute, and the change is limited to one view and one component. |
| Assumptions | "Same pill is back" means another open flag on that medication, not a reopened one. "Really new" means raised since the last answer, so entries need a date and time. "Harold is waiting" means the flag holds a dose or has an "Ask Dr. Nguyen" request. |

### A4-CR-2 (Rachel: held blood thinner, nobody told)

| Item | Answer |
| --- | --- |
| Quality and softgoal | Timeliness / availability of the advice loop, which is a safety issue. New softgoal G-45, which helps G-18 (dose status resolved). |
| Obstacle | Dr. Nguyen doesn't answer. Harold's held dose stays held with no reminder, and after the first alert nobody is told he is still waiting. |
| Likelihood | **High.** Reproduced: with Rachel as safety contact, Harold marks Warfarin "not sure" at 08:10, and Harold, Dr. Nguyen and Rachel each get one alert. The next day's 08:00 dose is held, and by 23:59 that day (about 40 h later) no other alert has been sent for that flag. Rachel already calls Dr. Nguyen herself in these situations (F2:22, F2:34). |
| Criticality | **Major.** Harold can't take the dose at all (no reminder, no confirm button), and a missed blood thinner is the high-risk case (T3:57, T3:59). |
| Classification | **Change of intent.** FR-009 holds the dose "until Dr. Nguyen's advice arrives", and the spec lists the no-answer case as an open question: "if Dr. Nguyen doesn't answer, Harold keeps waiting… What should happen?" V2 does what it says, so this isn't a defect. A time limit plus a notification is new behavior. |
| Affected artifacts | FR-008, FR-009, FR-015, FR-016, FR-021, FR-027, FR-028, SC-008, US6, the spec's open question, goal model §6; `clock.ts` `tick`/`nextEvent`, `alerts.ts`, `advice.ts`, `types.ts`, `views.ts`, `consent.ts`, `AlertList.tsx`, `RachelView.tsx`, `AdvicePanel.tsx`; `us6-advice`, `us4-urgency`, `us5-consent` tests and the invariants in `helpers.ts`. |
| Side effect | (a) Telling Rachel *what* he is waiting for breaks consent (G-30, FR-021): **High / Major** if we copy her wording. (b) Releasing the hold automatically would be the app giving dosing advice (FR-028) and brings back double-dose risk: **Medium / Major**. (c) More alerts work against Harold's independence (G-31), and a new entry in Dr. Nguyen's list is exactly what CR-1 complains about: **Medium / Minor**. |
| Feasible in the prototype | Yes. The demo clock can skip past any time limit, and alerts already appear in each view. There is no real SMS and no backup pharmacist. |
| Assumptions | "All day" means a time limit we set in Step 3, counted from the held dose's due time. "Blood thinner" means high-risk medications only. "On hold" includes the FR-015 "Ask Dr. Nguyen" wait. Rachel is told only if she is the safety contact, with the check-in message. Only Dr. Nguyen's advice lifts a hold. |

### A4-CR-3 (Harold: duplicate prompt hard to read)

| Item | Answer |
| --- | --- |
| Quality and softgoal | Accessibility / usability (readability, error prevention). G-35 Maximize Readability, plus new G-46, which helps G-16 and G-22. |
| Obstacle | Harold picks the wrong answer in the duplicate prompt. The dialog says only "You recorded this at 08:04." and never asks a question, yet the answers start with "Yes" and "No". The three answers are stacked 12 px apart, and the highlighted one is in the middle. |
| Likelihood | **Medium.** The prompt appears in normal use (quickstart steps 4–6), but misreading it depends on Harold's eyesight, which we can't reproduce. Interviews show he needs large print (F1:12, F1:41) and re-taps when unsure (T1:44). |
| Criticality | **Major.** "No, I tapped by mistake" after a real second dose means no flag, which is the hospitalization scenario (T2:14). A false "Yes" holds his next dose (FR-009). |
| Classification | **Text and button size work as specified.** The dialog inherits 24 px text and 64 px buttons, which meets FR-006 and SC-006 ("at least 18 pt", "at least 1.5 cm"). The wording and spacing are **change of intent**: FR-009 only fixes the three labels. |
| Affected artifacts | FR-009, FR-006, SC-006, US2-2 to US2-5, `ui-views.md`; `ConfirmDuplicateDialog.tsx`, `app.css` (`.dialog__actions`), possibly `LateDoseDialog.tsx`. No test covers the UI. RTM rows FR-006/009. |
| Side effect | Bigger text and spacing may push "I'm not sure" below the fold on a small tablet: **Medium / Minor**. An extra confirm step slows the duplicate alert: **Low / Minor**. |
| Feasible in the prototype | Yes. It's UI-only and measurable in the browser (sizes, Lighthouse, walkthrough), but we can't test it with Harold himself. |
| Assumptions | "The question that pops up" is the FR-009 dialog, not the late-dose one. "Hard to take in" means both size and wording. "Close together" means the gap between answers, not the button height. |

### A4-CR-4 (Harold: record not kept, page looks settled)

| Item | Answer |
| --- | --- |
| Quality and softgoal | Reliability (data integrity) and visibility of system status. New softgoal G-47, which helps G-8 and G-16. |
| Obstacle | The save fails, but the card still shows "Taken". Reopening the page brings back the old state, along with the reminder. In `store.tsx` the failed save is ignored ("the demo still works without persistence"), and a failed load resets to the seed data. |
| Likelihood | **Low.** With storage working, a reload keeps the record (checked). We reproduced the obstacle two ways. (1) Make the save fail (we made `localStorage.setItem` throw), then confirm Warfarin at 08:00: the card says "Taken at 08:00" with no warning, and after a reload it says "Due at 08:00" with the reminder back. (2) With the app open in a second tab, confirm in tab A, then click "+5 min" in tab B: the stale tab B saves over the record, and reloading tab A shows the reminder again. Both need conditions we haven't seen in use, and no interview mentions them, so this stays Low. |
| Criticality | **Major.** Harold is reminded about a dose he already took, and the FR-009 check can't catch it because the earlier record is gone (G-16, T2:14). |
| Classification | **Change of intent.** FR-004 ("store the time each dose is confirmed") is met in the app, and keeping the record across a reload is a plan decision (research R2), not a spec requirement. Nothing asks the app to warn Harold. *Open for the team:* if "store" means "keep durably", this is a defect instead. |
| Affected artifacts | FR-004, FR-005, FR-001/002, SC-001, research R2, plan *Storage*; `store.tsx`, `MedicationCard.tsx`, `HaroldView.tsx`. No tests (the tests are domain-only). RTM rows FR-004/005. |
| Side effect | A "not saved" warning may lead Harold to tap again and trigger the duplicate prompt: **Medium / Minor**. An alarming message goes against FR-001's neutral wording: **Low / Minor**. |
| Feasible in the prototype | Yes. A failed save can be forced with DevTools or a second tab. Here, "the tablet kept it" means the browser kept it. |
| Assumptions | "Could not keep" means the browser save failed or was overwritten, since there is no server. "Reopening" means a reload or a new tab. This covers every record Harold makes, not just "I took it". The warning doesn't tell him whether to take the pill (FR-028). |

## Step 1: Comparison of requests

| Pair | Relationship | Reason |
| --- | --- | --- |
| CR-1 and CR-2 | Reinforcement | Both want Dr. Nguyen to answer sooner where Harold is waiting. They clash only if CR-2 adds new list entries, which we treat as a side effect to avoid. |
| CR-1 and CR-3 | Reinforcement (weak) | A wrong tap in the prompt creates an extra flag in Dr. Nguyen's list. |
| CR-1 and CR-4 | Independent | Different screen and code. A lost save could bring back an answered flag, but that isn't the cause we reproduced. |
| CR-2 and CR-3 | Reinforcement | A wrong "Yes, I took another" holds the next dose, which is the wait CR-2 is about. |
| CR-2 and CR-4 | Independent | Alerts and the clock vs. saving. Each works without the other. |
| CR-3 and CR-4 | Reinforcement | Both protect the record that prevents a double dose, and CR-4's warning may send Harold to the prompt more often. |

## Step 2: Ranking and selection

| Rank | Request | Reason for the rank |
| --- | --- | --- |
| 1 | CR-2 | High / Major. Happens whenever Dr. Nguyen doesn't answer, and the spec left it open. Its side effects can be ruled out with clear boundaries (FR-021, FR-028). |
| 2 | CR-3 | Medium / Major. Just as harmful, but depends on Harold's eyesight, and the measurable part already passes FR-006/SC-006. |
| 3 | CR-4 | Low / Major. Serious if it happens, but needs storage to fail or two tabs open. |
| 4 | CR-1 | High / Minor. Easy to reproduce, but nothing is blocked, and CR-2 covers the worst part of the delay. |

**Selected request:** A4-CR-2, a change of intent (the spec's "Open question (V2)").

**Why the team chose the selected request over each of the other requests:**

- **Over CR-3:** both are Major, but CR-2 is High likelihood and CR-3 is Medium. CR-3's size requirements already pass, while CR-2 is a gap the spec explicitly left open.
- **Over CR-4:** both are Major, but CR-4 needs unusual conditions nobody has reported. Dr. Nguyen not answering is an ordinary situation.
- **Over CR-1:** CR-1 slows Dr. Nguyen down. CR-2 stops Harold from taking his dose at all.

**Conflicts between requests, and which request takes priority:** none of the four requests
conflict. CR-2 does pull against two existing decisions, and both stay in place: consent (C2), so
Rachel only gets the check-in message, and only as safety contact; and G-20 / FR-028, so the time
limit notifies people but never releases the dose. To respect CR-1, the reminder to Dr. Nguyen
marks the existing entry as overdue instead of adding a new one.

**Disagreement that remained:**

_To be filled in by the team after the Step 2 meeting._
