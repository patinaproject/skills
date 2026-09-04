#!/usr/bin/env bash
# Sync plugins/engineering/** from the current tip of ericlitman/open-pstack's
# main, renaming only poteto-mode -> patina-mode and poteto-agent ->
# patina-agent, and leave any Patina divergence as real git merge conflicts.
#
#   pnpm sync-pstack
#
# open-pstack main is the target: every run imports its current tip (not a
# pinned SHA). The transform (scripts/pstack-transform.sh) is byte-stable, so
# the merge below isolates Patina's real local edits instead of manufacturing
# conflicts.
#
# How true 3-way conflicts are possible across a rename+rewrite transform: a
# git merge computes conflicts against the merge base (the shared ancestor). A
# raw merge of open-pstack against our tree has no shared ancestor for these
# files (different paths, different bytes), so it cannot produce clean 3-way
# results. This script therefore keeps one script-managed carrier branch
# (pstack-sync) that holds the transformed upstream over time:
#
#   - First run: the carrier is seeded from your current branch, so the merge
#     base is your HEAD. Your tree has not diverged from that base yet, so the
#     merge cleanly takes the renamed open-pstack content — the base switch.
#   - Later runs: the previous carrier commit is the merge base, so the merge
#     writes <<<<<<< / ======= / >>>>>>> markers only where your local edits
#     overlap lines open-pstack changed since the last sync.
#
# The carrier is updated in an isolated worktree, so your checkout is never
# switched underneath you.
set -euo pipefail

REMOTE="${PSTACK_REMOTE:-open-pstack}"
REMOTE_URL="${PSTACK_REMOTE_URL:-https://github.com/ericlitman/open-pstack.git}"
UPSTREAM_REF="${PSTACK_UPSTREAM_REF:-main}"
UPSTREAM_SUBTREE="${PSTACK_UPSTREAM_SUBTREE:-plugins/pstack}"
DEST="${PSTACK_DEST:-plugins/engineering}"
CARRIER="${PSTACK_CARRIER:-pstack-sync}"

# Helper scripts are resolved relative to this file; the repo being synced is
# resolved from the working directory.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

work_branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "$work_branch" = "$CARRIER" ]; then
  echo "sync-pstack: refusing to run on the carrier branch '$CARRIER'." >&2
  exit 2
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "sync-pstack: working tree not clean; commit or stash first." >&2
  exit 2
fi

# 1. Import the current open-pstack tip.
git remote get-url "$REMOTE" >/dev/null 2>&1 || git remote add "$REMOTE" "$REMOTE_URL"
git fetch --no-tags "$REMOTE" "$UPSTREAM_REF"
upstream="$(git rev-parse "FETCH_HEAD")"
short="$(git rev-parse --short=12 "$upstream")"

# 2. Transform it into a temp tree.
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"; [ -n "${carrier_wt:-}" ] && git worktree remove --force "$carrier_wt" 2>/dev/null || true' EXIT
mkdir -p "$tmp/src"
git archive "$upstream" "$UPSTREAM_SUBTREE" | tar -x -C "$tmp/src" --strip-components=2
bash "$script_dir/pstack-transform.sh" "$tmp/src" "$tmp/out"

# 3. Commit the transformed snapshot onto the carrier branch, in an isolated
#    worktree so this checkout is never disturbed. Seed from HEAD on first run.
carrier_wt="$(mktemp -d)"
if git show-ref --verify --quiet "refs/heads/$CARRIER"; then
  git worktree add --quiet "$carrier_wt" "$CARRIER"
else
  git worktree add --quiet -b "$CARRIER" "$carrier_wt" HEAD
fi
(
  cd "$carrier_wt"
  rm -rf "${DEST:?}"
  mkdir -p "$DEST"
  cp -R "$tmp/out/." "$DEST/"
  git add -A -- "$DEST"
  if git diff --cached --quiet; then
    echo "sync-pstack: carrier already at open-pstack@$short; nothing new to merge."
  else
    git commit --quiet -m "chore: sync open-pstack@$short into $DEST"
  fi
)
git worktree remove --force "$carrier_wt"
carrier_wt=""

# 4. Merge the carrier into your branch. Conflicts are the expected outcome on
#    a diverged sync — leave them in place for a human to resolve.
if git merge --no-ff --no-edit "$CARRIER"; then
  echo "sync-pstack: merged open-pstack@$short cleanly. Review and commit if a merge commit was made."
else
  echo
  echo "sync-pstack: merge left conflicts (open-pstack@$short vs your local edits)."
  echo "Resolve them, 'git add' the files, then 'git commit'. See the repo's"
  echo "resolving-merge-conflicts skill. To abort: 'git merge --abort'."
  exit 1
fi
