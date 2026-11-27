# 17-626 Assignment 4 starter kit

Copy the `a4-kit` folder into the root of your group repository, on the default branch, and commit.

| File | Used in | Purpose |
| --- | --- | --- |
| `a4-setup.sh` | Steps 4 and 5 | Creates your branch and an isolated working folder for your mode, and after Step 5 copies your session logs. Every member runs the same script. |
| `analysis-template.md` | Steps 1 and 2 | Table for the four change requests, the comparison of requests, and the decisions. |
| `quality-requirement-template.md` | Step 3 | The selected request, the requirement, the acceptance criteria and the baseline. |
| `evidence-template.md` | Step 5 | Results for a single mode, including the five probe questions. Each member fills in a copy. |
| `learning-log-a4-template.md` | Step 6 | Section headings and questions for the learning log. |

Each step of the assignment names the template to use. Fill in a copy in `docs/a4` on the default branch, without `-template` in the file name, for example `docs/a4/analysis.md`. Each member names the evidence copy after the mode, for example `docs/a4/evidence-living.md`.

## Running the setup script

Run one command from inside the group repository. On Windows, use Git Bash.

```
bash a4-kit/a4-setup.sh living
bash a4-kit/a4-setup.sh accumulated
bash a4-kit/a4-setup.sh discarded
```

The script finds your Prototype V2 on GitHub by looking for a branch or tag named `v2`, `v2.0`, `V2` or `v2-release`. If none exists, the script lists your branches and tags and asks which one holds V2.

The script then does the following:

1. It creates the branch `a4-<mode>-<your first name>` from V2. Your first name comes from `git config user.name`.
2. It removes `docs/a4` and `a4-kit` from the branch, so the agent never sees the group analysis.
3. It adds a Claude Code settings file. The file turns off auto memory, blocks file reads outside the working folder, and blocks the Git commands that reach other branches.
4. In the discarded mode, it also deletes the files that describe what the system should do. These include specs, the constitution, agent instruction files, documents, interview transcripts and goal models. It then lists any remaining file that might still describe the system.
5. It pushes this starting point and clones only your branch, without history, into a new folder beside the group repository.

The setup never changes files in the group repository folder. Your later commits stay in the working folder until Step 6.

In the discarded mode, check the list that the script prints. If a file in the list still describes what the system should do, delete the file in the working folder and commit before you start Claude Code.

## Saving the session logs

After Step 5, including the fresh-session probe, exit Claude Code and run this command from the group repository:

```
bash a4-kit/a4-setup.sh save-logs <mode>
```

The command copies the raw Claude Code session logs of your working folder into `docs/a4/session-logs-<mode>/`. The logs hold your prompts, the agent's replies, the files the agent read and the time of each step. Run the command on the computer where you used Claude Code.

## Settings applied by the script

```json
{
  "autoMemoryEnabled": false,
  "permissions": {
    "blockReadsOutsideWorkingDirectories": true,
    "deny": [
      "Bash(git fetch *)", "Bash(git pull *)", "Bash(git clone *)", "Bash(git remote *)",
      "Bash(git checkout *)", "Bash(git switch *)", "Bash(git push *)",
      "Bash(git -C *)", "Bash(git -c *)"
    ]
  }
}
```

If your repository uses Spec Kit with another agent, such as Codex or Cursor, the script copies the Spec Kit skills so that Claude Code can use the same commands.

Claude Code documentation: [memory](https://code.claude.com/docs/en/memory) and [permissions](https://code.claude.com/docs/en/permissions).
