# Feature Specification: Dose Confirmation and Risk-Based Missed/Duplicate-Dose Alerts

**Feature Branch**: `001-dose-safety-alerts`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Sprint 1 (V1) scope from docs/goal-model.md: remind, confirm, record,
flag and alert safety loop — G-4, G-7, G-8, G-17, G-43, G-38, G-22, G-24, G-25, G-34, G-33, G-42,
G-36."

**Source model**: `docs/goal-model.md` (Sprint 1, V1). Evidence codes refer to the interview
transcripts (T1 Harold, T2 Rachel, T3 Dr. Nguyen) and follow-up notes (F1, F2).

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
   and a message advising him to wait until it is checked before taking another.
2. **Given** today's Warfarin dose was recorded at 08:04, **When** Harold taps to confirm
   Warfarin again, **Then** the app shows "You recorded this at 08:04" and asks him to confirm
   he took another one.
3. **Given** the prompt in scenario 2 is showing, **When** Harold confirms he took another,
   **Then** the second dose is recorded and flagged immediately as a duplicate.
4. **Given** the prompt in scenario 2 is showing, **When** Harold cancels, **Then** nothing new
   is recorded and no flag is raised.

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

1. **Given** Dr. Nguyen's view lists Harold's medications, **When** she sets Levothyroxine to a
   30-minute window and low risk, **Then** those values are saved and shown for Levothyroxine.
2. **Given** she sets Warfarin to high risk, **When** a Warfarin dose is later flagged, **Then**
   the flag is treated as high-risk (see Story 4).
3. **Given** a medication has no window or risk set, **When** it is displayed, **Then** it uses
   the default (60-minute window, low risk) and the default is visibly indicated.

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
5. **Given** Warfarin was flagged missed at 09:00, **When** Harold confirms it at 09:15, **Then**
   the dose is recorded as "taken late" at 09:15, the flag remains visible with that note, and
   already-sent alerts are not withdrawn.

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

### Edge Cases

- **Two medications due at the same time**: each gets its own reminder and confirm button;
  confirming one does not confirm the other.
- **Confirm tapped twice by accident in quick succession**: handled by Story 2 scenario 2–4; a
  dose is never recorded twice without Harold confirming the second one.
- **"Unsure" then later remembers**: Harold can confirm the dose afterwards; the record keeps
  both the unsure mark and the confirmation time, and the flag stays visible.
- **Window changed by Dr. Nguyen while a dose is pending**: the new window applies from the next
  due dose; the pending dose keeps the window it started with.
- **Dose confirmed before the due time** (e.g. taken early): recorded with the actual time; it
  counts as that day's dose and no reminder is shown.
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
- **FR-003**: Harold MUST be able to confirm a due dose with a single tap. *(G-7; T1:14; F1:37;
  F2:36)*
- **FR-004**: System MUST store the time each dose is confirmed. *(G-8; F1:37; T2:17)*
- **FR-005**: System MUST show, for each medication, the date and time it was last taken.
  *(G-17; T1:44)*
- **FR-006**: Harold's view MUST use large text and large tap targets for all reminders, buttons
  and status information. *(G-36; F1:12, F1:41)*

**Uncertainty and duplicates**

- **FR-007**: Harold MUST be able to mark a due dose as "I'm not sure" with a single tap.
  *(G-43; T1:44; F2:20, F2:22)*
- **FR-008**: After an "unsure" mark, System MUST show the last-taken time for that medication
  and advise Harold to wait until it is checked before taking another dose. *(G-43, G-17,
  supports G-20; C3)*
- **FR-009**: When Harold tries to confirm a dose that is already recorded for that due time,
  System MUST show the existing record's time and require an explicit second confirmation
  before recording another dose. *(G-22, G-17, supports G-16; T2:14)*

**Medication settings**

- **FR-010**: Dr. Nguyen MUST be able to set, per medication, a window (minutes after due time)
  and a risk level of high or low. *(G-38; T3:39, T3:59, T3:70)*
- **FR-011**: Medications without settings MUST use a default of a 60-minute window and low risk,
  and the default MUST be visibly indicated in Dr. Nguyen's view. *(G-38; assumption)*

**Flagging**

- **FR-012**: System MUST flag a dose as **missed** when its window closes without a
  confirmation or unsure mark. *(G-22; T2:17; T3:57, T3:70; C3)*
- **FR-013**: System MUST flag a dose immediately when it is recorded twice (FR-009) or marked
  unsure (FR-007). *(G-22; T2:14; T3:88; C3)*
- **FR-014**: System MUST NOT flag a dose or send any alert while the dose is still inside its
  window. *(G-34; T1:46; F1:29, F1:49)*
- **FR-015**: A dose confirmed after being flagged missed MUST be recorded as "taken late" with
  its time; the flag MUST remain visible and sent alerts MUST NOT be withdrawn. *(G-8, G-22)*

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
- **FR-023**: System MUST NOT send Rachel an alert for low-risk flags, even on shared
  medications; the status is visible in her view only. *(G-34, G-25; T1:46; F1:29)*

### Key Entities

- **Medication**: one of Harold's prescribed medications. Attributes: name, scheduled due times,
  window length (minutes), risk level (high/low), shared-with-Rachel (yes/no).
- **Dose**: one scheduled intake of a medication. Attributes: medication, due time, status (due,
  taken, taken late, unsure, missed, duplicate), confirmation time(s), unsure mark.
- **Flag**: a safety concern on a dose. Attributes: dose, reason (missed, duplicate, unsure),
  raised time, risk level inherited from the medication.
- **Alert / Notice**: a message caused by a flag. Attributes: flag, recipient (Harold,
  Dr. Nguyen, Rachel), urgency (urgent or routine), content level (full details or
  "check in" only).
- **Consent settings**: Harold's choices: Rachel designated as safety contact (yes/no) and the
  set of medications shared with her.
- **Person / role**: Harold (patient), Rachel (daughter, family member), Dr. Nguyen (prescriber
  and pharmacist contact).

### Conflict and Overlap Decisions

Carried from `docs/goal-model.md` §3–§4 (Constitution Principle III).

| ID | Relationship | Decision in this spec | Rejected / open |
|---|---|---|---|
| C1 | G-26 (alert Rachel on every flag) vs. G-34 (no alert when slightly late) | Alerts by urgency: high-risk → urgent (FR-016), low-risk → routine notice to Harold (FR-017); nothing inside window (FR-014). | G-26 kept as rejected alternative. |
| C2 | G-24 (alert Rachel) vs. G-30 (no family access without consent) | Consent is a hard constraint: tiered access (FR-019–FR-023); Harold and Dr. Nguyen always get urgent alerts. | Open: does in-app opt-in count as written consent? |
| C3 | Definition of "missed" (G-22) | Per-medication window + risk (FR-010); missed on window close (FR-012); duplicate/unsure immediately (FR-013). | — |
| Trade-off | G-22 (flagging) vs. G-31 (Harold's independence) | Single non-repeating reminder, no flag inside window, neutral wording (FR-001, FR-014). | — |
| Overlap | G-7 requested by Harold, Rachel and Dr. Nguyen (T1:14; T2:22; T3:55) | Combined into one confirm action (FR-003). | — |
| Overlap | G-4 and HW2 G-32 (stop reminder once confirmed) | Combined (FR-001, FR-002). | — |
| Overlap | G-17 and G-43 both serve G-16 | Implemented separately (FR-005, FR-007/FR-008). | — |

### Out of Scope (this sprint)

- Regimen and schedule changes by Harold or prescriber confirmation (G-9 vs. G-15).
- Pharmacist advice workflow (G-19) and formally resolving an uncertain dose (G-18); this spec
  only advises waiting (FR-008).
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
- **SC-007**: Every functional requirement FR-001–FR-023 can be traced to a goal ID and interview
  evidence in `docs/traceability.md` and demonstrated through at least one acceptance scenario.

## Assumptions

- Two risk levels only: high (e.g. Warfarin, an anticoagulant) and low (e.g. Atorvastatin, a
  statin).
- The app cannot observe meals, so food-relative windows (e.g. thyroid 30 minutes before food,
  T3:70) are approximated with clock-time windows.
- Default window is 60 minutes and default risk is low when Dr. Nguyen has not set values.
- The prototype uses mock data for one patient (Harold), one family member (Rachel) and one
  prescriber (Dr. Nguyen), with a few representative medications.
- Users switch between Harold's, Rachel's and Dr. Nguyen's views without real sign-in; alerts are
  shown in each person's view rather than delivered through real messaging.
- Evaluators can simulate the passage of time so windows can close during a demonstration.
- Recording is per medication, so it works whether Harold uses bottles, an organizer or blister
  packs (T1:25; T2:8; T3:4). How Harold stores his pills remains an open question.
- Asking Harold to confirm a second dose before recording it (FR-009) is a team decision to avoid
  false duplicate alarms from accidental taps; it is to be validated with stakeholders.
- **Open question (C2)**: whether an in-app opt-in counts as Harold's written consent for
  Rachel. To ask Dr. Nguyen and Harold. The prototype treats the in-app toggle as consent for
  demonstration only.

### Dependencies

- Flagging (FR-012, FR-013) depends on confirmation records (FR-004), unsure marks (FR-007) and
  medication windows (FR-010).
- Alert urgency (FR-016, FR-017) depends on risk levels (FR-010).
- Anything Rachel receives (FR-021–FR-023) depends on Harold's consent settings (FR-020, FR-022).
