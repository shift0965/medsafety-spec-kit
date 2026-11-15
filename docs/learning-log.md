# Learning Log

## Sprint planning

For V1 we built one loop: remind Harold, let him confirm, save the time, flag a problem, and alert the right person. We picked this because it is the main safety feature. Harold went to hospital after taking his blood thinner twice, and Harold, Rachel and Dr. Nguyen all said dose safety matters most. The loop has a one-tap confirm, a "last taken at" time, and an "I'm not sure" button so Harold doesn't take a dose twice. Dr. Nguyen sets a time window and a risk level for each medication, so the app knows when a dose is missed and how urgent it is. Rachel only sees what Harold agrees to share, and text and buttons are large. It is also the part with the most unknowns, so V1 was a good way to test our ideas early.

We had to settle a few disagreements first. Rachel wanted every problem sent to her right away, but Harold didn't want her told when he was just a few minutes late. We followed Dr. Nguyen, who said it depends on the drug: high-risk problems send an urgent alert to Harold and Dr. Nguyen, and low-risk ones are just a note to Harold. Rachel also needs warnings, but she can only be told with Harold's consent, so she gets nothing by default unless Harold makes her his safety contact or shares a medication with her. Everyone also meant something different by "missed", so each medication got its own window. The goal model helped here because it showed which goals depend on each other and where the conflicts were, so we made these choices ourselves before writing the spec. We left out changing the schedule, pharmacist advice, Rachel seeing the full history, and real notifications, because they aren't part of the double-dose loop.

## What we found in V1

When we clicked through V1, the problems we found came from the spec, not from bugs in the code. The main ones were:

1. After "I'm not sure", Harold was told to wait even when there was no record of the dose, and no one could ever answer him.
2. After "Yes, I took another", he still got a reminder for the next dose, which invites a third dose, and then a false missed alert.
3. For a late dose he was told to "check with Dr. Nguyen", but he had no way to reach her and she was never asked.

All three have the same cause: V1 could raise a safety flag but never close it.

## What we changed in V2

V2 fixes these 3 problems. Now when Harold says "I'm not sure", takes a dose twice, or is late with an important dose, his next dose is put on hold and Dr. Nguyen gets a request for advice. She sees every open problem and answers with one of four set options, like "Take it now" or "Skip your next dose". Harold sees her answer on his screen, and that closes the problem and releases the next dose. While he waits, the app only says "Please wait for Dr. Nguyen's advice", because the app should never give dosing advice itself. To do this we brought pharmacist advice back into scope, which the interviews support (Harold says he will "wait for proper advice"), and we updated our project rules, which had said not to build it. We kept the same design and tools and only added what was needed.

## Reflection

Many decisions needed our own judgment, not the AI's. We chose what to build and settled the disagreements before there was a spec. After the AI's first draft we changed several rules ourselves, for example making medications high risk by default instead of low. When the spec check tool found a requirement with no interview evidence and a gap in the double-dose check, we decided how to fix them. Judging V1 by what the stakeholders actually want, and not only by the spec, was also our call.

Prototyping showed us things the tests missed. All tests passed, but the false alert and the "check with Dr. Nguyen" dead end only showed up when we used the app as Harold and Rachel. Writing the spec first kept the code and requirements in line. Every requirement links to its code and tests in the traceability table, so each problem pointed straight back to the spec. To show management this works, we would share that table, the spec check results and our fixes in git, the passing tests (58 in V2) and walkthrough checks, and the V1 problems that the tests didn't catch.
