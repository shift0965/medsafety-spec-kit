#!/usr/bin/env bash
# 17-626 Assignment 4 starter kit: prepare an isolated working folder for one spec maintenance mode.
#
# Usage (run from inside your group repository):
#   bash a4-kit/a4-setup.sh <living|accumulated|discarded>             set up the working folder (Step 4)
#   bash a4-kit/a4-setup.sh save-logs <living|accumulated|discarded>   copy your session logs (end of Step 5)
#
# Optional:
#   --base <ref>   Branch or tag that holds Prototype V2. The script finds v2, v2.0, V2 or v2-release
#                  by itself, and asks when none of those exists.
#
# macOS and Linux: run in Terminal. Windows: run in Git Bash, which ships with Git for Windows.

main() {
  set -euo pipefail

  local mode="" base="" action="setup"
  while [ $# -gt 0 ]; do
    case "$1" in
      living|accumulated|discarded) mode="$1" ;;
      --base) shift; base="${1:?--base needs a branch or tag name}" ;;
      save-logs) action="save-logs" ;;
      -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
      *) echo "Unknown argument: $1. Name a mode: living, accumulated or discarded." >&2; exit 1 ;;
    esac
    shift
  done
  if [ -z "$mode" ]; then
    echo "Name a mode: living, accumulated or discarded." >&2
    exit 1
  fi

  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Run this script from inside your group repository." >&2; exit 1; }
  local repo_root origin repo_name
  repo_root="$(git rev-parse --show-toplevel)"
  origin="$(git -C "$repo_root" remote get-url origin 2>/dev/null)" || { echo "The repository has no remote named origin." >&2; exit 1; }
  repo_name="$(basename "$repo_root")"

  # The member's name labels the branch, so two members who apply the same mode never collide.
  local who
  who="$(git -C "$repo_root" config user.name || true)"
  if [ -z "$who" ]; then
    printf "Your first name, used in the branch name: "
    read -r who || true
  fi
  who="$(printf '%s' "$who" | awk '{print $1}' | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-*//; s/-*$//')"
  [ -n "$who" ] || { echo "A name is needed for the branch. Set one with: git config user.name \"Your Name\"" >&2; exit 1; }

  local branch="a4-$mode-$who"
  local work
  work="$(dirname "$repo_root")/$repo_name-$branch"
  if [ "$action" = "save-logs" ]; then
    save_logs "$mode" "$repo_root" "$work"
    return
  fi
  if [ -e "$work" ]; then
    echo "The folder $work already exists. Delete the folder to start over, then run the script again." >&2
    exit 1
  fi

  # Find Prototype V2 on GitHub.
  echo "1/4  Finding Prototype V2 on GitHub"
  local refs
  if ! refs="$(git ls-remote --heads --tags "$origin" 2>&1)"; then
    echo "$refs" >&2
    echo "Could not reach $origin. Check that you can run git fetch in the group repository." >&2
    exit 1
  fi
  if git ls-remote --exit-code --heads "$origin" "$branch" >/dev/null 2>&1; then
    echo "The branch $branch already exists on GitHub. Ask the course staff before reusing a branch name." >&2
    exit 1
  fi
  local names
  names="$(printf '%s\n' "$refs" | awk '{print $2}')"
  has_ref() {
    [ -n "$1" ] || return 1
    case $'\n'"$names"$'\n' in
      *$'\n'"refs/heads/$1"$'\n'*|*$'\n'"refs/tags/$1"$'\n'*) return 0 ;;
      *) return 1 ;;
    esac
  }
  if [ -n "$base" ]; then
    has_ref "$base" || { echo "GitHub has no branch or tag named $base." >&2; exit 1; }
  else
    local c
    for c in v2 v2.0 V2 v2-release; do
      if has_ref "$c"; then base="$c"; break; fi
    done
  fi
  if [ -z "$base" ]; then
    echo "     No branch or tag named v2 was found. These branches and tags exist on GitHub:"
    printf '%s\n' "$names" | grep -v '\^{}$' | sed -E 's#^refs/(heads|tags)/#       #' || true
    printf "     Type the one that holds Prototype V2: "
    read -r base || true
    has_ref "$base" || { echo "GitHub has no branch or tag named '$base'." >&2; exit 1; }
  fi
  echo "     Prototype V2 is $base. The new branch is $branch."

  A4_TMP="$(mktemp -d)"
  trap 'rm -rf "$A4_TMP"' EXIT

  echo "2/4  Preparing the starting point"
  git clone --quiet --branch "$base" "$origin" "$A4_TMP/start"
  cd "$A4_TMP/start"
  git checkout --quiet -b "$branch"

  # Assignment 4 analysis and the kit itself never reach the agent, in any mode.
  local p
  for p in docs/a4 a4-kit; do
    if [ -e "$p" ]; then git rm -r --quiet -- "$p" >/dev/null; rm -rf -- "$p"; fi
  done

  # Spec Kit installed for another agent (for example Codex): make the same skills available to Claude Code.
  if ! ls -d .claude/skills/speckit-* >/dev/null 2>&1; then
    local sk
    for sk in .agents/skills .codex/skills .cursor/skills .gemini/skills .github/skills .windsurf/skills; do
      if ls -d "$sk"/speckit-* >/dev/null 2>&1; then
        mkdir -p .claude/skills
        cp -R "$sk"/speckit-* .claude/skills/
        echo "     Copied the Spec Kit skills from $sk to .claude/skills for Claude Code"
        break
      fi
    done
  fi

  # Shared Claude Code settings: no auto memory, no Git command that reaches other branches,
  # and no file reads outside the working folder.
  mkdir -p .claude
  if [ -f .claude/settings.json ]; then
    cp .claude/settings.json .claude/settings.a3-backup.json
  fi
  rm -f .claude/settings.local.json
  cat > .claude/settings.json <<'JSON'
{
  "autoMemoryEnabled": false,
  "permissions": {
    "blockReadsOutsideWorkingDirectories": true,
    "deny": [
      "Bash(git fetch *)",
      "Bash(git pull *)",
      "Bash(git clone *)",
      "Bash(git remote *)",
      "Bash(git checkout *)",
      "Bash(git switch *)",
      "Bash(git push *)",
      "Bash(git -C *)",
      "Bash(git -c *)"
    ]
  }
}
JSON

  if [ "$mode" = "discarded" ]; then
    echo "3/4  Removing project context files (discarded mode)"
    # Folders and files that describe what the system should do.
    local -a context=(specs .specify/memory .specify/feature.json docs sources CLAUDE.md CLAUDE.local.md
                      AGENTS.md GEMINI.md .claude/CLAUDE.md .claude/rules .claude/settings.a3-backup.json
                      .cursorrules .cursor/rules .windsurfrules .github/copilot-instructions.md)
    for p in "${context[@]}"; do
      if [ -e "$p" ]; then git rm -r --quiet --ignore-unmatch -- "$p" >/dev/null; rm -rf -- "$p"; fi
    done
    # Documents anywhere outside the Spec Kit and Claude Code tooling folders.
    git ls-files -z -- '*.md' '*.mdx' '*.pdf' '*.docx' '*.doc' '*.txt' '*.rtf' \
      | tr '\0' '\n' \
      | grep -v -E '^(\.specify/|\.claude/(commands|skills|agents)/|\.agents/|node_modules/)' \
      | grep -v -E '(^|/)(requirements[^/]*\.txt|robots\.txt|LICENSE[^/]*)$' \
      | while IFS= read -r f; do git rm --quiet -- "$f" >/dev/null; done || true
    # Interview transcripts, goal models, slides, sheets and archives, unless they sit in a code or data folder.
    git ls-files -z -- '*.csv' '*.tsv' '*.mmd' '*.drawio' '*.pptx' '*.xlsx' '*.key' '*.zip' \
      | tr '\0' '\n' \
      | grep -v -E '(^|/)(src|public|assets|static|data|fixtures|mock|mocks|tests?|__tests__|node_modules)/' \
      | while IFS= read -r f; do git rm --quiet -- "$f" >/dev/null; done || true
    # Goal models, matrices, transcripts and nested spec or doc folders, by name, outside source and test folders.
    git ls-files \
      | grep -i -E '(^|/)(specs|docs|sources|goal-models?|goal_models?)/|(^|/)\.specify/memory/|(^|/)[^/]*(goal[_-]?model|goal[_-]?catalog|learning[_-]?log|transcript|interview|use[_-]?cases)[^/]*$|(^|/)(matrix|traceability)[^/]*\.(json|ya?ml)$' \
      | grep -v -E '(^|/)(src|tests?|__tests__|scripts|node_modules)/' \
      | while IFS= read -r f; do git rm --quiet -- "$f" >/dev/null; done || true
    printf '# Prototype\n\nApplication source code and tests. Earlier project documents were removed for Assignment 4.\n' > README.md
  else
    echo "3/4  Keeping every existing file ($mode mode)"
  fi

  git add -A
  git -c user.name="$(git -C "$repo_root" config user.name || echo student)" \
      -c user.email="$(git -C "$repo_root" config user.email || echo student@example.com)" \
      commit --quiet -m "A4 starting point for the $mode mode (from $base)"

  # Pushing the starting point now lets the shallow working folder push its own commits later.
  echo "4/4  Pushing the starting point and creating the isolated working folder"
  git push --quiet origin "$branch"
  cd "$repo_root"
  git clone --quiet --depth 1 --single-branch --branch "$branch" "$origin" "$work"

  echo
  echo "     Files that the agent will see, by top-level folder:"
  git -C "$work" ls-files | awk -F/ '{ n[(NF>1) ? $1"/" : $1]++ } END { for (k in n) printf "       %-28s %d\n", k, n[k] }' | sort
  if [ "$mode" = "discarded" ]; then
    local others
    others="$(git -C "$work" ls-files \
      | grep -v -E '^(\.specify/|\.claude/|\.agents/|\.github/workflows/)' \
      | grep -v -i -E '\.(js|jsx|ts|tsx|mjs|cjs|mts|cts|vue|svelte|astro|css|scss|sass|less|html?|json|lock|ya?ml|toml|py|sh|ps1|sql|prisma|graphql|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|map|env\.example|LICENSE)$' \
      | grep -v -E '(^|/)(README\.md|\.gitignore|\.gitattributes|\.[a-z]*ignore|\.nvmrc|\.npmrc|\.nojekyll|\.prettierrc[^/]*|\.eslintrc[^/]*|\.editorconfig|robots\.txt|Dockerfile|Makefile|LICENSE[^/]*)$' || true)"
    # Data and page files outside the usual source folders can also hold requirements, for example exported goal models.
    others="$others
$(git -C "$work" ls-files \
      | grep -v -E '(^|/)(\.specify|\.claude|\.agents|\.github|\.vscode|\.openai)/' \
      | grep -i -E '\.(json|html?|py|png|jpe?g)$' \
      | grep -v -E '(^|/)(src|public|assets|static|app|frontend|backend|server|client|tests?|__tests__|scripts|node_modules)/' \
      | grep -v -E '(^|/)(package(-lock)?\.json|tsconfig[^/]*\.json|vercel\.json|netlify\.json|firebase\.json|manifest\.json|components\.json|index\.html|[^/]*\.config\.[a-z]+)$' || true)"
    others="$(printf '%s\n' "$others" | grep -v '^$' || true)"
    echo
    if [ -n "$others" ]; then
      echo "     Files that are not code and may describe the system. Check each one:"
      printf '%s\n' "$others" | sed 's/^/       /'
    else
      echo "     No other non-code files remain."
    fi
    echo "     If any file still describes what the system should do, delete the file in the"
    echo "     working folder and commit, before you start Claude Code."
  fi

  cat <<DONE

Done. Only the starting point was pushed, and the group repository folder was not changed.
Your isolated working folder is:
  $work

Next:
  1. cd "$work"
  2. Start a new Claude Code session with: claude
  3. Run /memory. Confirm that auto memory is off, and check that your personal
     CLAUDE.md file holds no project content. Then run /model and select the model
     your group agreed on, and run /effort followed by the effort level your group
     agreed on, for example /effort high. Run /effort alone to confirm the level.
  4. Paste sections 1 to 3 of docs/a4/quality-requirement.md from the group repository,
     followed by this sentence: Implement this change. Use Git only to stage and commit.
  5. Commit inside the working folder as you work. Do not push your commits yet.
  6. After Step 5, including the fresh-session probe, exit Claude Code and save the raw
     session logs from the group repository with:
       bash a4-kit/a4-setup.sh save-logs $mode
  7. In Step 6, when every teammate has finished the evaluation, push with:
       git push -u origin $branch
DONE
}

# Copy every Claude Code session log whose working directory is the member's working folder.
# Claude Code keeps one .jsonl file per session under ~/.claude/projects, and every entry records
# the session's working directory ("cwd"). Matching on that field finds the main session and the
# fresh-session probe, with macOS, Linux and Windows path formats alike.
save_logs() {
  local mode="$1" repo_root="$2" work="$3"
  local projects="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects"
  local base esc dest n=0 f rel inner
  base="$(basename "$work")"
  [ -d "$projects" ] || { echo "No Claude Code logs found in $projects." >&2; exit 1; }
  esc="$(printf '%s' "$base" | sed 's/[][\.*^$+?(){}|/]/\\&/g')"
  dest="$repo_root/docs/a4/session-logs-$mode"
  mkdir -p "$dest"
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    rel="${f#"$projects"/}"
    inner="${rel#*/}"
    mkdir -p "$dest/$(dirname "$inner")"
    cp "$f" "$dest/$inner"
    n=$((n + 1))
  done <<LIST
$(grep -rlE --include='*.jsonl' "\"cwd\":\"[^\"]*[/\\\\]$esc([/\\\\][^\"]*)?\"" "$projects" 2>/dev/null || true)
LIST
  if [ "$n" -eq 0 ]; then
    rmdir "$dest" 2>/dev/null || true
    echo "No session logs were found for $work." >&2
    echo "Run this command on the computer where you used Claude Code, after the sessions have ended." >&2
    exit 1
  fi
  echo "Copied $n session log file(s) to docs/a4/session-logs-$mode/ in the group repository."
  echo "The logs hold your prompts, the agent's replies and the files the agent read."
  echo "Commit the folder on the default branch in Step 6, together with your evidence file."
}

main "$@"
