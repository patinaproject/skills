#!/usr/bin/env bash
# Sync plugins/engineering/** from the current tip of michael-denyer/pstack-claude's
# main, renaming only poteto-mode -> patina-mode and poteto-agent ->
# patina-agent, and leave any Patina divergence as real git merge conflicts.
#
#   pnpm sync-pstack
#
# A 3-way merge needs a base in the vendored layout, and squash merges mean no
# sync commit ever becomes an ancestor of main. The transform
# (scripts/pstack-transform.sh) is byte-stable, so the base is regenerated on
# every run from the upstream commit recorded in $DEST/upstream.json. Two
# throwaway commits are built outside the worktree and index: HEAD's tree with
# $DEST replaced by the transformed recorded commit, and a child with $DEST
# replaced by the transformed tip. Cherry-picking that child with --no-commit
# applies only what upstream changed since the last sync, and conflicts only
# where Patina's edits overlap. Files under $DEST that upstream never ships
# (upstream.json, NOTICE.md) are absent from both snapshots, so they stay as
# they are. See docs/adr/ADR-541-regenerate-pstack-sync-merge-base.md.
set -euo pipefail

REMOTE="${PSTACK_REMOTE:-pstack-claude}"
REMOTE_URL="${PSTACK_REMOTE_URL:-https://github.com/michael-denyer/pstack-claude.git}"
UPSTREAM_REF="${PSTACK_UPSTREAM_REF:-main}"
UPSTREAM_SUBTREE="${PSTACK_UPSTREAM_SUBTREE:-plugins/pstack}"
DEST="${PSTACK_DEST:-plugins/engineering}"

# Helper scripts are resolved relative to this file; the repo being synced is
# resolved from the working directory.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"
git_dir="$(cd "$(git rev-parse --git-dir)" && pwd)"

if [ -n "$(git status --porcelain)" ]; then
  echo "sync-pstack: working tree not clean; commit or stash first." >&2
  exit 2
fi

manifest="$DEST/upstream.json"
recorded=""
if [ -f "$manifest" ]; then
  recorded="$(jq -r '.commit // empty' "$manifest")"
fi

git remote get-url "$REMOTE" >/dev/null 2>&1 || git remote add "$REMOTE" "$REMOTE_URL"
git fetch --no-tags "$REMOTE" "$UPSTREAM_REF"
upstream="$(git rev-parse FETCH_HEAD)"
short="$(git rev-parse --short=12 "$upstream")"

if [ "$recorded" = "$upstream" ]; then
  echo "sync-pstack: already at pstack-claude@$short; nothing to sync."
  exit 0
fi

# The recorded commit is normally an ancestor of the tip, but an upstream
# force-push can orphan it.
if [ -n "$recorded" ] && ! git cat-file -e "$recorded^{commit}" 2>/dev/null; then
  git fetch --no-tags "$REMOTE" "$recorded"
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Print the id of HEAD's tree with $DEST replaced by the transformed snapshot
# of upstream commit $1, or with $DEST removed when $1 is empty.
snapshot_tree() {
  local commit="$1" name="$2"
  local wt="$tmp/$name" index="$tmp/$name.index"
  mkdir -p "$wt/$DEST"
  GIT_INDEX_FILE="$index" git read-tree HEAD
  GIT_INDEX_FILE="$index" git rm -r -q --cached --ignore-unmatch -- "$DEST"
  if [ -n "$commit" ]; then
    mkdir -p "$tmp/$name.src"
    git archive "$commit:$UPSTREAM_SUBTREE" | tar -x -C "$tmp/$name.src"
    bash "$script_dir/pstack-transform.sh" "$tmp/$name.src" "$wt/$DEST"
    (cd "$wt" && GIT_DIR="$git_dir" GIT_WORK_TREE="$wt" GIT_INDEX_FILE="$index" \
      git add -f -- "$DEST")
  fi
  GIT_INDEX_FILE="$index" git write-tree
}

base_commit="$(git commit-tree "$(snapshot_tree "$recorded" base)" \
  -m "pstack-claude@${recorded:-none} transformed")"
tip_commit="$(git commit-tree "$(snapshot_tree "$upstream" tip)" -p "$base_commit" \
  -m "sync pstack-claude@$short into $DEST")"

conflicted=0
if ! git cherry-pick --no-commit "$tip_commit"; then
  if [ -z "$(git diff --name-only --diff-filter=U)" ]; then
    echo "sync-pstack: applying pstack-claude@$short failed without conflicts; see the error above." >&2
    exit 2
  fi
  conflicted=1
fi

if [ -f "$manifest" ]; then
  jq --arg commit "$upstream" '.commit = $commit' "$manifest" > "$tmp/upstream.json"
else
  jq -n --arg commit "$upstream" '{commit: $commit}' > "$tmp/upstream.json"
fi
cat "$tmp/upstream.json" > "$manifest"
git add -- "$manifest"

if [ "$conflicted" -eq 0 ]; then
  echo "sync-pstack: applied pstack-claude@$short cleanly. Review the staged changes, then commit."
else
  echo
  echo "sync-pstack: applying pstack-claude@$short left conflicts with your local edits."
  echo "Resolve them, 'git add' the files, then 'git commit'. See the repo's"
  echo "fix-merge-conflicts skill. To abort: 'git reset --merge'."
  exit 1
fi
