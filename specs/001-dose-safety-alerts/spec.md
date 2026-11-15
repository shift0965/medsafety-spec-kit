# Feature Specification: Dose Confirmation and Risk-Based Missed/Duplicate-Dose Alerts

**Feature Branch**: `main` (spec folder `001-dose-safety-alerts`)

**Created**: 2026-11-14

**Status**: V2 revision (2026-11-15)

**Input**: User description: "Sprint 1 (V1) scope from docs/goal-model.md: remind, confirm, record,
flag and alert safety loop — G-4, G-7, G-8, G-17, G-43, G-38, G-22, G-24, G-25, G-34, G-33, G-42,
G-36."

**Source model**: `docs/goal-model.md` (Sprint 1, V1, and §6 V2 Revision). Evidence codes refer to
the interview transcripts (T1 Harold, T2 Rachel, T3 Dr. Nguyen) and follow-up interviews (F1 Harold,
F2 Rachel).

## V2 changes

- **Why (V1 evaluation):** FR-008, FR-009 and FR-015 were partially satisfied. Harold was told to
  wait or to check with Dr. Nguyen, but nothing ever resolved the flag. After "Yes, I took
  another", the next dose was still reminded and later flagged as missed, which invited a third
  dose.
- **Goals added:** G-18, G-19 and G-20 (goal model §6), so Dr. Nguyen's advice resolves a flag.
- **Revised:** FR-008 (wait for advice, then see it), FR-009 (next dose held until advice), FR-015
  (late high-risk dose sends Dr. Nguyen a request for advice); US2-1, US4-5 and US4-6 updated to
  match.
- **New:** FR-024–FR-028 (FR-023 stays retired) and User Story 6.
- **Unchanged:** the FR-020 and FR-021 findings and the C2 consent question still need stakeholder
  input.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Harold confirms a dose with one tap (Priority: P1)

When a dose is due, Harold gets one reminder on his tablet. He takes the pill and taps a single
large button to confirm. The app records the time and from then on shows when he last took that
medication, so he can check it later instead of relying on memory.

**Why this priority**: Recording doses is the base of the whole safety loop. Harold's
hospitalization came from a double blood-thinner dose (T2:14; F2:7), and all three stakeholders
rank this first (T1:44; T2:45; T3:65). Every later story depends on these records.

**Independent Test**: With one mock medication due, open Harold's view, tap confirm, and check
that the dose shows as taken with the recorded time and the reminder is gone.

**Goals**: G-4, G-7, G-8, G-17, G-36

**Acceptance Scenarios**:

1. **Given** Harold's Warfarin dose is due at 08:00 and not yet recorded, **When** the time
   reaches 08:00, **Then** Harold's view shows one reminder for Warfarin with neutral wording and
   a single large "I took it" button.
2. **Given** the Warfarin reminder is showing, **When** Harold taps "I took it" once, **Then** the
   dose is recorded as taken at the current time, the reminder disappears, and no further
   reminder for that dose appears.
3. **Given** Warfarin was confirmed at 08:04, **When** Harold opens his view later that day,
   **Then** it shows "Last taken: today 08:04" next to Warfarin.
4. **Given** the reminder was shown and Harold has not confirmed, **When** time passes but the
   dose is still inside its window, **Then** the reminder is not repeated.

---

### User Story 2 - Harold says he is unsure, and a second dose is caught (Priority: P1)

If Harold cannot remember whether he took a dose, he taps "I'm not sure" instead of guessing.
If he tries to confirm a dose that is already recorded, the app shows him when it was last
taken. Both situations are flagged straight away because they are where double doses happen.

**Why this priority**: This addresses the actual cause of the past hospitalization (double dose,
T2:14) and Rachel's definition of "missed" including "can't remember" (F2:20, F2:22).

**Independent Test**: Record a dose, then tap confirm on it again; separately, tap "I'm not
sure" on another dose. Check that both produce an immediate flag and the last-taken time is
shown.

**Goals**: G-43, G-17, G-22 (supports G-16, G-20)

**Acceptance Scenarios**:

1. **Given** a Warfarin dose is due and unrecorded, **When** Harold taps "I'm not sure",
   **Then** the dose is marked unsure, flagged immediately, and Harold sees the last-taken time
   and a message to wait for Dr. Nguyen's advice before taking another (see Story 6).
2. **Given** today's Warfarin dose was recorded at 08:04, **When** Harold taps to confirm
   Warfarin again, **Then** the app shows "You recorded this at 08:04" with three choices:
   "Yes, I took another", "No, I tapped by mistake" and "I'm not sure".
3. **Given** the prompt in scenario 2 is showing, **When** Harold chooses "Yes, I took another",
   **Then** the second dose is recorded and flagged immediately as a duplicate.
4. **Given** the prompt in scenario 2 is showing, **When** Harold chooses "No, I tapped by
   mistake", **Then** nothing new is recorded and no flag is raised.
5. **Given** the prompt in scenario 2 is showing, **When** Harold chooses "I'm not sure",
   **Then** the dose is marked unsure and flagged immediately, as in scenario 1.

---

### User Story 3 - Dr. Nguyen sets a window and risk level per medication (Priority: P2)

Dr. Nguyen sets, for each of Harold's medications, how long after the due time a dose may still
be taken (the window) and whether a problem with it is high-risk or low-risk.

**Why this priority**: Flagging and alert urgency (Stories 4 and 5) depend on these values
(T3:39, T3:59, T3:70). It is P2 because sensible mock defaults let Stories 1–2 work without it.

**Independent Test**: In Dr. Nguyen's view, change a medication's window and risk level and check
that the new values appear in the medication list and are used for the next due dose.

**Goals**: G-38

**Acceptance Scenarios**:

1. **Given** Dr. Nguyen's view lists Harold's medications, **When** Dr. Nguyen sets
   Levothyroxine to a 30-minute window and low risk, **Then** those values are saved and shown
   for Levothyroxine.
2. **Given** Dr. Nguyen sets Warfarin to high risk, **When** a Warfarin dose is later flagged,
   **Then** the flag is treated as high-risk (see Story 4).
3. **Given** a medication has no window or risk set, **When** it is displayed, **Then** it uses
   the default (60-minute window, high risk) and the default is visibly indicated.

---

### User Story 4 - Flagged doses are alerted by urgency, not on every slip (Priority: P2)

When a dose's window closes with no record, the dose is flagged as missed. A flag on a high-risk
medication sends an urgent alert to Harold and Dr. Nguyen (and to Rachel if she is his safety
contact). A flag on a low-risk medication only shows Harold a routine notice. Nothing is flagged
or sent while Harold is merely a little late inside the window.

**Why this priority**: This resolves conflict C1: Rachel wants immediate alerts (T2:17, T2:45),
Harold does not want her alerted when slightly late (T1:46; F1:29), and Dr. Nguyen ties urgency
to the medication (T3:57, T3:59).

**Independent Test**: With one high-risk and one low-risk mock medication, let both windows close
without confirming (simulated time) and check who receives what; then check that nothing is sent
while still inside the window.

**Goals**: G-22, G-24, G-25, G-34

**Acceptance Scenarios**:

1. **Given** Warfarin (high risk, 60-min window) was due at 08:00 and is unrecorded, **When** the
   time is 08:30, **Then** no flag exists and no one other than Harold (via the single reminder)
   is notified.
2. **Given** the same dose is still unrecorded, **When** the window closes at 09:00, **Then** the
   dose is flagged as missed and an urgent alert appears for Harold and for Dr. Nguyen.
3. **Given** Atorvastatin (low risk) is unrecorded, **When** its window closes, **Then** it is
   flagged as missed and only a routine notice appears in Harold's view; Dr. Nguyen and Rachel
   receive no alert.
4. **Given** a duplicate or unsure flag on a high-risk medication (Story 2), **When** the flag is
   raised, **Then** the urgent alert is sent immediately, without waiting for the window to close.
5. **Given** Warfarin (high risk) was flagged missed at 09:00, **When** Harold opens it to
   confirm, **Then** the app first shows "This dose is late. Ask Dr. Nguyen before taking it."
   with "Ask Dr. Nguyen" and "I already took it", and gives no dosing advice of its own.
6. **Given** the message in scenario 5 was shown, **When** Harold chooses "I already took it" at
   09:15, **Then** the dose is recorded as "taken late" at 09:15, the flag remains visible with
   that note, already-sent alerts are not withdrawn, and Dr. Nguyen receives a request for advice
   (Story 6).

---

### User Story 5 - Harold controls what Rachel sees (Priority: P3)

Rachel sees nothing by default. Harold can designate her once as his safety contact, so she gets
an urgent "please check in with Harold" message on high-risk flags with no medication details.
Separately, Harold can share individual medications, and for those Rachel sees name, due time and
status.

**Why this priority**: Resolves conflict C2: Rachel needs urgent warnings (T2:45), but Dr. Nguyen
requires Harold's consent (T3:33) and Harold decides what she sees (F1:23). It is P3 because the
safety loop for Harold and Dr. Nguyen works without Rachel.

**Independent Test**: Toggle the safety-contact setting and per-medication sharing in Harold's
view, then open Rachel's view and check exactly what she can see and receive for each tier.

**Goals**: G-42, G-33 (supports G-30)

**Acceptance Scenarios**:

1. **Given** Harold has not designated Rachel or shared anything, **When** Rachel opens her view,
   **Then** she sees no medications, statuses or alerts, only a note that Harold has not shared
   anything.
2. **Given** Rachel is designated safety contact but no medication is shared, **When** a Warfarin
   dose is flagged as high risk, **Then** Rachel receives "Please check in with Harold" with no
   medication name, dose or time.
3. **Given** Harold shares Atorvastatin only, **When** Rachel opens her view, **Then** she sees
   Atorvastatin's name, due time and status, and nothing about any other medication.
4. **Given** Atorvastatin is shared and its dose is flagged missed (low risk), **When** Rachel
   opens her view, **Then** she sees the status "missed" but receives no alert.
5. **Given** Harold removes the safety-contact designation, **When** a later high-risk flag is
   raised, **Then** Rachel receives nothing.

---

### User Story 6 - Dr. Nguyen's advice resolves a flagged dose (Priority: P1, added in V2)

When a dose is flagged (missed, taken twice or "not sure"), Dr. Nguyen sees it and answers with
advice from a short list. Harold waits until the advice arrives and then sees it on that
medication. The flag is marked resolved. After a second dose, the next dose of that medication is
held until Dr. Nguyen has answered, so the app never invites a third dose. The app itself never
gives dosing advice.

**Why this priority**: V1 evaluation showed that flags were raised but never closed (FR-008,
FR-009, FR-015 partially satisfied). Harold says he would rather not take another dose and "wait
for proper advice" (T1:44), and Rachel calls Dr. Nguyen when Harold can't remember an important
dose (F2:22, F2:34).

**Independent Test**: Raise an unsure flag and a duplicate flag, answer both in Dr. Nguyen's view,
and check that Harold sees the advice, the flags show as resolved, and a held dose is released or
skipped as advised.

**Goals**: G-18, G-19, G-20

**Acceptance Scenarios**:

1. **Given** Harold marks Levothyroxine (low risk) "I'm not sure" at 07:05, **When** he looks at
   its card, **Then** it shows his last-taken time and "Please wait for Dr. Nguyen's advice before
   taking another." and no other instruction; Dr. Nguyen's view lists the flag as awaiting advice,
   without an alert. *(FR-008, FR-024, FR-028)*
2. **Given** the flag in scenario 1 is awaiting advice, **When** Dr. Nguyen chooses "Take it now",
   **Then** Harold's Levothyroxine card and a notice show "Dr. Nguyen: Take it now", and the flag
   is shown as resolved with the advice and time. *(FR-025, FR-026, FR-027)*
3. **Given** Metoprolol's 08:00 dose was recorded at 15:00, **When** Harold chooses "Yes, I took
   another" at 18:30, **Then** the duplicate is flagged, the 20:00 dose is held: no reminder at
   20:00 and no missed flag at 21:00, and the card shows "Waiting for Dr. Nguyen's advice".
   *(FR-009)*
4. **Given** the 20:00 dose is held as in scenario 3, **When** Dr. Nguyen chooses "Skip your next
   dose", **Then** the 20:00 dose is marked skipped, gets no reminder and no missed flag, and the
   duplicate flag is resolved. *(FR-027)*
5. **Given** the 20:00 dose is held as in scenario 3, **When** Dr. Nguyen chooses "Take your next
   dose as usual" at 19:00, **Then** the hold is lifted and the reminder appears at 20:00.
   *(FR-027)*
6. **Given** Warfarin (high risk) was flagged missed at 09:00, **When** Harold chooses "Ask
   Dr. Nguyen" at 09:15, **Then** Dr. Nguyen receives an urgent "advice requested" alert for that
   flag, nothing is recorded as taken, and Harold's card shows "Please wait for Dr. Nguyen's
   advice before taking it." *(FR-015)*
7. **Given** a flag was resolved, **When** anyone views it later, **Then** it still appears,
   marked resolved with the advice and time, and earlier alerts are not withdrawn. *(FR-027)*
8. **Given** any flag is awaiting advice, **When** Harold views the medication, **Then** the app
   shows no dosing instruction of its own, only the waiting message. *(FR-028)*

---

### Edge Cases

- **Two medications due at the same time**: each gets its own reminder and confirm button;
  confirming one does not confirm the other.
- **Confirm tapped twice by accident in quick succession**: handled by Story 2 scenarios 2–5; a
  dose is never recorded twice without Harold confirming the second one.
- **"Unsure" then later remembers**: Harold can confirm the dose afterwards; the record keeps
  both the unsure mark and the confirmation time, and the flag stays open until Dr. Nguyen
  answers it (FR-027).
- **Held dose passes its due time before advice arrives** (V2): it gets no reminder and no missed
  flag while held. If the advice is not "Skip your next dose", the dose becomes due when the
  advice is given and its window counts from then (team assumption).
- **Advice on a flag whose dose was already confirmed** (e.g. unsure, then remembered): the advice
  is still shown and resolves the flag; nothing new is recorded.
- **Rachel and advice** (V2): Rachel never sees Dr. Nguyen's advice; for shared medications she
  sees only name, due time and status (FR-022 and C2 unchanged).
- **Window changed by Dr. Nguyen while a dose is pending**: the new window applies from the next
  due dose; the pending dose keeps the window it started with.
- **Dose confirmed before the due time** (e.g. taken early before an appointment, T1:30): allowed
  only within 2 hours before the next due time (team assumption). It is recorded with the actual
  time, counts as that next due dose (some medications are taken twice a day, T1:32), and no
  reminder is shown for that dose. If the medication was confirmed less than 6 hours ago, the tap
  shows the FR-009 prompt instead (team assumption). Outside the 2-hour lead time, the card shows
  the next due time and no confirm button.
- **Rachel is safety contact and the medication is also shared**: she gets the "please check in"
  message on a high-risk flag and can see that medication's status in her view.
- **Medication not shared but flagged low-risk**: Rachel sees and receives nothing.

## Requirements *(mandatory)*

### Functional Requirements

Each requirement lists its goal model reference and interview evidence (Constitution Principle I).

**Reminders and confirmation**

- **FR-001**: System MUST show Harold one reminder per dose when the dose becomes due, with
  neutral, non-alarming wording, and MUST NOT repeat it. *(G-4; T1:48; F1:6, F1:12)*
- **FR-002**: System MUST remove the reminder as soon as the dose is confirmed or marked unsure.
  *(G-4, merged HW2 G-32; F1:6)*
- **FR-003**: Harold MUST be able to confirm a due dose with a single tap; a dose may be confirmed
  up to 2 hours before its due time (team assumption; T1:30). *(G-7; T1:14, T1:30; F1:37; F2:36)*
- **FR-004**: System MUST store the time each dose is confirmed. *(G-8; F1:37; T2:17)*
- **FR-005**: System MUST show, for each medication, the date and time it was last taken.
  *(G-17; T1:44)*
- **FR-006**: Harold's view MUST use large text and large tap targets for all reminders, buttons
  and status information. *(G-36; F1:12, F1:41)*

**Uncertainty and duplicates**

- **FR-007**: Harold MUST be able to mark a due dose as "I'm not sure" with a single tap.
  *(G-43; T1:44; F2:20, F2:22)*
- **FR-008** *(revised in V2)*: After an "unsure" mark, System MUST show the last-taken time for
  that medication and "Please wait for Dr. Nguyen's advice before taking another.", hold the
  medication's next dose until advice arrives (as in FR-009), and show the advice once Dr. Nguyen
  answers (FR-026). *(G-43, G-17, G-20, G-19; T1:44; F2:22, F2:34)*
- **FR-009**: When Harold tries to confirm a dose that is already recorded for that due time, or
  a medication that was confirmed less than 6 hours ago (team assumption), System MUST show the
  existing record's time and offer three choices: "Yes, I took another" (records a duplicate
  of the most recent confirmed dose, at the current time), "No, I tapped by mistake" (records
  nothing) and "I'm not sure" (marks the most recent confirmed dose unsure, FR-007).
  *Revised in V2:* after "Yes, I took another", the next dose of that medication MUST be held
  until Dr. Nguyen's advice arrives: no reminder and no missed flag while held, and the card shows
  "Waiting for Dr. Nguyen's advice". *(G-22, G-17, G-20, supports G-16; T2:14, T2:17; T1:44)*

**Medication settings**

- **FR-010**: Dr. Nguyen MUST be able to set, per medication, a window (minutes after due time)
  and a risk level of high or low. *(G-38; T3:39, T3:59, T3:70)*
- **FR-011**: Medications without settings MUST use a default of a 60-minute window and high
  risk, and the default MUST be visibly indicated in Dr. Nguyen's view. *(G-38; T3:59 for each
  medication needing a risk level; "default = high" is a team decision, so that a setup gap
  over-alerts rather than missing a dangerous dose)*

**Flagging**

- **FR-012**: System MUST flag a dose as **missed** when its window closes without a
  confirmation or unsure mark. *(G-22; T2:17; T3:57, T3:70; C3)*
- **FR-013**: System MUST flag a dose immediately when it is recorded twice (FR-009) or marked
  unsure (FR-007). *(G-22; T2:14; T3:88; C3)*
- **FR-014**: While a dose is unconfirmed inside its window, System MUST NOT flag it as missed or
  send a missed-dose alert. Duplicate and unsure flags are not delayed (FR-013). *(G-34; T1:46;
  F1:29, F1:49)*
- **FR-015** *(revised in V2)*: A dose confirmed after being flagged missed MUST be recorded as
  "taken late" with its time; the flag MUST remain visible and sent alerts MUST NOT be withdrawn.
  For a high-risk medication, System MUST first show "This dose is late. Ask Dr. Nguyen before
  taking it." with two choices: "Ask Dr. Nguyen" (records nothing; Harold waits for advice) and
  "I already took it" (records "taken late"). Either choice MUST send Dr. Nguyen an urgent "advice
  requested" alert for that flag, saying whether Harold has already taken it. *(G-8, G-22, G-19,
  G-20; T3:55; T1:44; F2:26, F2:34)*

**Alerts**

- **FR-016**: For a flag on a high-risk medication, System MUST send an urgent alert to Harold and
  Dr. Nguyen at the moment the flag is raised. *(G-24; T2:45; T3:59, T3:88)*
- **FR-017**: For a flag on a low-risk medication, System MUST show only a routine notice to
  Harold and MUST NOT alert Dr. Nguyen or Rachel. *(G-25; T3:59, T3:86)*
- **FR-018**: Every flag and alert MUST state the medication, the flag reason (missed, duplicate
  or unsure) and the time, in the views of the recipients entitled to medication details.
  *(G-22, G-24; T2:17)*

**Rachel's access (consent tiers)**

- **FR-019**: By default, Rachel MUST see no medications, statuses, flags or alerts. *(G-30,
  G-33; T3:33; F1:23)*
- **FR-020**: Harold MUST be able to designate and un-designate Rachel as his safety contact.
  *(G-42; T1:46; T3:33)*
- **FR-021**: When Rachel is the safety contact, System MUST send her an urgent "please check in
  with Harold" message for every high-risk flag, containing no medication name, dose, time or
  reason. *(G-42, G-24; T2:45; T3:33)*
- **FR-022**: Harold MUST be able to share and un-share individual medications with Rachel; for
  shared medications only, Rachel MUST see name, due time and current status. *(G-33; T1:28;
  F1:23)*

**Advice and resolving flags (added in V2; FR-023 is retired and not reused)**

- **FR-024**: Dr. Nguyen's view MUST list every open flag, missed, duplicate or unsure and of
  either risk level, with medication, reason, dose time and the dose's record. Low-risk flags
  appear in this list without an alert (FR-017 unchanged). *(G-19, G-18; F2:22, F2:34; listing
  low-risk flags is a team assumption)*
- **FR-025**: Dr. Nguyen MUST be able to answer any open flag by choosing one advice option from a
  fixed list: "Take it now", "Skip your next dose", "Take your next dose as usual", "Please call
  me". *(G-19; T1:44; F2:34; the list itself is a team assumption)*
- **FR-026**: When advice is given, System MUST show it to Harold on that medication's card and as
  a notice, worded as "Dr. Nguyen: <advice>", until he acknowledges it. *(G-19, G-20; T1:44)*
- **FR-027**: When advice is given, System MUST mark the flag resolved with the advice and time
  and lift any hold on that medication (FR-008, FR-009). "Skip your next dose" MUST mark the
  medication's next dose skipped: no reminder and no missed flag. Resolved flags MUST stay visible
  and alerts MUST NOT be withdrawn. *(G-18; T1:44; F2:22)*
- **FR-028**: System MUST NOT give dosing advice of its own. While a flag awaits advice, Harold
  sees only the waiting message; every dosing instruction comes from Dr. Nguyen's chosen option.
  *(G-20, G-19; F2:26; T1:44)*

### Key Entities

- **Medication**: one of Harold's prescribed medications. Attributes: name, scheduled due times,
  window length (minutes), risk level (high/low), shared-with-Rachel (yes/no).
- **Dose**: one scheduled intake of a medication. Attributes: medication, due time, status (due,
  taken, taken late, unsure, missed, duplicate; V2 adds held and skipped), confirmation time(s),
  unsure mark.
- **Flag**: a safety concern on a dose. Attributes: dose, reason (missed, duplicate, unsure),
  raised time, risk level inherited from the medication; V2 adds open/resolved and the advice
  that resolved it.
- **Advice** (V2): Dr. Nguyen's answer to a flag. Attributes: flag, option from the fixed list,
  time given, acknowledged by Harold (yes/no).
- **Alert / Notice**: a message caused by a flag. Attributes: flag, recipient (Harold,
  Dr. Nguyen, Rachel), urgency (urgent or routine), content level (full details or
  "check in" only).
- **Consent settings**: Harold's choices: Rachel designated as safety contact (yes/no) and the
  set of medications shared with her.
- **Person / role**: Harold (patient), Rachel (daughter, family member), Dr. Nguyen (community
  pharmacist, T3:4).

### Conflict and Overlap Decisions

Carried from `docs/goal-model.md` §3–§4 (Constitution Principle III).

| ID | Relationship | Decision in this spec | Rejected / open |
|---|---|---|---|
| C1 | G-26 (alert Rachel on every flag) vs. G-34 (no alert when slightly late) | Alerts by urgency: high-risk → urgent (FR-016), low-risk → routine notice to Harold (FR-017); nothing inside window (FR-014). | G-26 kept as rejected alternative. |
| C2 | G-24 (alert Rachel) vs. G-30 (no family access without consent) | Consent is a hard constraint: tiered access (FR-019–FR-022); Harold and Dr. Nguyen always get urgent alerts. | Open: does in-app opt-in count as written consent? |
| C3 | Definition of "missed" (G-22) | Per-medication window + risk (FR-010); missed on window close (FR-012); duplicate/unsure immediately (FR-013). | — |
| Trade-off | G-22 (flagging) vs. G-31 (Harold's independence) | Single non-repeating reminder, no flag inside window, neutral wording (FR-001, FR-014). | — |
| Overlap | G-7 requested by Harold, Rachel and Dr. Nguyen (T1:14; T2:22; T3:55) | Combined into one confirm action (FR-003). | — |
| Overlap | G-4 and HW2 G-32 (stop reminder once confirmed) | Combined (FR-001, FR-002). | — |
| Overlap | G-17 and G-43 both serve G-16 | Implemented separately (FR-005, FR-007/FR-008). | — |
| V2 | G-19 and G-20 were OR-alternatives under G-18 (R12/R13) | One partial AND-refinement: Dr. Nguyen advises and Harold waits (FR-024–FR-028; goal model §6). | Open: what happens if Dr. Nguyen doesn't answer. |

### Out of Scope (V2)

- Regimen and schedule changes by Harold or prescriber confirmation (G-9 vs. G-15).
- Free-text or two-way messaging with Dr. Nguyen; advice is limited to the fixed list (FR-025).
- Rachel's full medication history (HW2 G-28).
- Real notifications (SMS, email, push), real patient data, and health-record integration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Harold can confirm a due dose in 1 tap and under 5 seconds from seeing the
  reminder.
- **SC-002**: In a walkthrough of all acceptance scenarios, 100% of doses left unrecorded past
  their window are flagged as missed, and 0 doses are flagged while still inside their window.
- **SC-003**: 100% of duplicate and unsure events produce a flag at the moment they happen.
- **SC-004**: 100% of high-risk flags produce an urgent alert to both Harold and Dr. Nguyen; 0
  low-risk flags produce an alert to Dr. Nguyen or Rachel.
- **SC-005**: Across all consent combinations, Rachel sees 0 details of medications Harold has not
  shared, and safety-contact messages contain 0 medication details.
- **SC-006**: All text in Harold's view is readable at arm's length on a tablet by a reader
  needing large print (body text at least 18 pt equivalent; tap targets at least 1.5 cm high).
- **SC-007**: Every functional requirement FR-001–FR-022 and FR-024–FR-028 can be traced to a goal
  ID and interview evidence in `docs/traceability.md` and demonstrated through at least one
  acceptance scenario.
- **SC-008** (V2): In a walkthrough, 100% of flags can be resolved by Dr. Nguyen's advice, and 0
  held doses produce a reminder or a missed flag before advice arrives.

## Assumptions

- Two risk levels only: high (e.g. Warfarin, an anticoagulant) and low (e.g. Atorvastatin, a
  statin).
- The app cannot observe meals, so food-relative windows (e.g. thyroid 30 minutes before food,
  T3:70) are approximated with clock-time windows.
- Default window is 60 minutes and default risk is high when Dr. Nguyen has not set values
  (team assumption, FR-011).
- The prototype uses mock data for one patient (Harold), one family member (Rachel) and one
  pharmacist (Dr. Nguyen), with a few representative medications.
- Users switch between Harold's, Rachel's and Dr. Nguyen's views without real sign-in; alerts are
  shown in each person's view rather than delivered through real messaging.
- Evaluators can simulate the passage of time so windows can close during a demonstration.
- Recording is per medication, so it works whether Harold uses bottles, an organizer or blister
  packs (T1:25; T2:8; T3:4). How Harold stores his pills remains an open question.
- Asking Harold to choose between "took another", "tapped by mistake" and "not sure" before
  recording a second dose (FR-009) is a team decision to avoid false duplicate alarms from
  accidental taps without hiding real uncertainty; it is to be validated with stakeholders.
- Early confirmation is limited to 2 hours before the due time (FR-003); team assumption, to
  validate with stakeholders.
- A tap within 6 hours of the medication's last confirmation shows the FR-009 prompt; team
  assumption, to validate with stakeholders.
- For a missed high-risk dose, "This dose is late. Ask Dr. Nguyen before taking it." is shown
  before recording (FR-015); team assumption, to validate with stakeholders.
- Advice options are a fixed list: "Take it now", "Skip your next dose", "Take your next dose as
  usual", "Please call me" (FR-025); team assumption, to validate with Dr. Nguyen.
- An unsure mark also holds the next dose (FR-008), matching G-20 "dose withheld until advised";
  team assumption, to validate.
- **Open question (V2)**: if Dr. Nguyen doesn't answer, Harold keeps waiting and the held dose
  stays held (G-20). What should happen? To ask Dr. Nguyen and Harold.
- **Open question (for Dr. Nguyen)**: if a morning dose is taken late (e.g. 15:00), is the
  evening dose at 20:00 a duplicate risk? The 6-hour rule currently treats it as one.
- **Open question (C2)**: whether an in-app opt-in counts as Harold's written consent for
  Rachel. To ask Dr. Nguyen and Harold. The prototype treats the in-app toggle as consent for
  demonstration only.

### Dependencies

- Flagging (FR-012, FR-013) depends on confirmation records (FR-004), unsure marks (FR-007) and
  medication windows (FR-010).
- Alert urgency (FR-016, FR-017) depends on risk levels (FR-010).
- Anything Rachel receives (FR-021, FR-022) depends on Harold's consent settings (FR-020, FR-022).
- V2: advice (FR-024, FR-025) depends on a flag existing (FR-012, FR-013, FR-015); showing and
  resolving (FR-026, FR-027) depend on advice being given; holds (FR-008, FR-009) end with FR-027.
