# Evidence for a single mode (Step 5)

Save the completed copy as `docs/a4/evidence-<mode>.md`, for example `docs/a4/evidence-living.md`.

- **Member:**
- **Mode:** living, accumulated or discarded
- **Branch:**
- **Claude Code model:** the model shown by `/status` in each session. If the model differs from the model the group agreed on, say why
- **Effort level:** the level shown by `/effort` in each session. If the level differs from the level the group agreed on, say why
- **Time spent:**
- **Session logs:** `docs/a4/session-logs-<mode>/`, copied after Step 5 with `bash a4-kit/a4-setup.sh save-logs <mode>`

## 1. Acceptance criteria

Run each check yourself. Do not accept the agent's report of a result as evidence.

| Criterion | Baseline on V2 | Result on this branch | Target met? | Evidence |
| --- | --- | --- | --- | --- |

## 2. Regression check

List every requirement that the A3 matrix marked as fully satisfied in V2, and the result of re-verifying each requirement on this branch.

| Requirement | Still satisfied? | Evidence |
| --- | --- | --- |

## 3. Problems found

| Problem | Stage | How the problem was detected | Type | Response |
| --- | --- | --- | --- | --- |
| | Specify, plan, implement or validate | | Implementation defect, requirements issue or maintenance issue | |

## 4. Interventions

| Moment | Knowledge supplied | Source of the knowledge |
| --- | --- | --- |
| | | An artifact the agent could see, an artifact the agent could not see, or your own memory |

## 5. Fresh-session probe

Commit your work. Open a new Claude Code session in the working folder and ask the five questions. Replace the bracketed words with the feature and the quality from the selected change request.

| Question | Answer from the agent | Correct? | File that supplied the answer |
| --- | --- | --- | --- |
| 1. What is the current target for [quality] on [feature], and which file states the target? | | | |
| 2. Why was that target chosen, and what trade-off was accepted? | | | |
| 3. What must not change when someone next modifies [feature]? | | | |
| 4. Which earlier rules about [feature] still apply after this change? | | | |
| 5. Do any files in this repository disagree about how [feature] should behave? List the files. | | | |

Judge each answer against `docs/a4/quality-requirement.md` and the specs in Prototype V2.
