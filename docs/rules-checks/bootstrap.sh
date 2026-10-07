#!/usr/bin/env bash
# Creates the work branch and a separate worktree for the rules-and-checks effort,
# commits this kit onto it, and installs dependencies.
#
# Run from the main checkout:   bash docs/rules-checks/bootstrap.sh
# Overrides:                    BASE=… BRANCH=… WT=… bash docs/rules-checks/bootstrap.sh
#
# Why a worktree: the main checkout is on `main` with untracked web/ files that would
# collide with the tracked ones if you switched to the spike branch.
set -euo pipefail

REPO="$(git rev-parse --show-toplevel)"
BASE="${BASE:-spike/tsx-exporter}"
BRANCH="${BRANCH:-feat/rules-and-checks}"
WT="${WT:-$(dirname "$REPO")/playground-dtv-rules}"

git -C "$REPO" rev-parse --verify --quiet "$BASE" >/dev/null || { echo "Base branch '$BASE' not found."; exit 1; }
[ -e "$WT" ] && { echo "'$WT' already exists. Remove it or set WT=…"; exit 1; }

git -C "$REPO" worktree add -b "$BRANCH" "$WT" "$BASE"

# The kit is untracked in the main checkout: copy it in and commit it on the work branch,
# so that isolated subagent worktrees (which start from a commit) can see it too.
# The agent and command sources live in docs/rules-checks/{agents,commands}; this is
# where they get installed into .claude/ where Claude Code looks for them.
mkdir -p "$WT/docs" "$WT/.claude/agents" "$WT/.claude/commands"
cp -R "$REPO/docs/rules-checks" "$WT/docs/"
cp "$WT"/docs/rules-checks/agents/rules-*.md "$WT/.claude/agents/"
cp "$WT"/docs/rules-checks/commands/rules-checks.md "$WT/.claude/commands/"

git -C "$WT" add docs/rules-checks .claude/agents/rules-*.md .claude/commands/rules-checks.md
git -C "$WT" commit -q -m "Add rules-and-checks kit: spec, tasks, orchestrator and subagents"

# Claude Code's isolated worktrees live here; keep them out of git status.
echo '.claude/worktrees/' >> "$(git -C "$WT" rev-parse --git-path info/exclude)"

echo "Installing dependencies in $WT (this takes a while)…"
(
  cd "$WT"
  npm ci
  npm ci --prefix web
  npx playwright install chromium
)

cat <<EOF

Ready.
  worktree: $WT
  branch:   $BRANCH (from $BASE), nothing pushed

Next:
  cd "$WT"
  claude
  /rules-checks status
  /rules-checks next
EOF
