#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HELPER="$REPO_ROOT/skills/move-branch-here/scripts/worktree-context.sh"
TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

assert_equal() {
  local actual="$1" expected="$2" message="$3"
  if [ "$actual" != "$expected" ]; then
    fail "$message (expected '$expected', got '$actual')"
  fi
}

# Creates a repository on main plus a linked worktree holding `feature`.
new_fixture() {
  local root
  root="$(mktemp -d "$TMP_ROOT/fixture-XXXXXX")"
  mkdir -p "$root/repo"
  git -c init.defaultBranch=main init --quiet "$root/repo"
  git -C "$root/repo" config user.email tests@patinaproject.com
  git -C "$root/repo" config user.name 'patinaproject Tests'
  printf 'base\n' > "$root/repo/README.md"
  git -C "$root/repo" add README.md
  git -C "$root/repo" commit --quiet -m 'chore: #350 base'
  git -C "$root/repo" branch feature
  git -C "$root/repo" worktree add --quiet "$root/held" feature
  printf 'base\nfeature\n' > "$root/held/README.md"
  git -C "$root/held" commit --quiet -am 'feat: #350 feature work'
  printf '%s\n' "$root"
}

resolve_field() {
  local root="$1" branch="$2" index="$3"
  (cd "$root/repo" && "$HELPER" resolve "$branch") | cut -f "$index"
}

assert_blocked() {
  local root="$1" branch="$2" expected="$3" description="$4" output
  if output="$(cd "$root/repo" && "$HELPER" resolve "$branch" 2>&1)"; then
    fail "$description unexpectedly resolved: $output"
    return
  fi
  if ! grep -Fq "$expected" <<< "$output"; then
    fail "$description error was not actionable: $output"
  fi
  assert_equal "$(git -C "$root/held" branch --show-current)" feature \
    "$description should leave the holder attached"
}

# A held branch moves, and moving it again is a reported no-op.
{
  root="$(new_fixture)"
  head="$(git -C "$root/held" rev-parse HEAD)"

  assert_equal "$(resolve_field "$root" feature 1)" held 'a held branch resolves as held'
  assert_equal "$(resolve_field "$root" feature 3)" "$head" 'resolve reports the branch head'
  assert_equal "$(resolve_field "$root" feature 4)" "$(cd "$root/held" && pwd -P)" \
    'resolve reports the holding worktree'

  result="$(cd "$root/repo" && "$HELPER" move feature "$head" "$root/held")"
  assert_equal "$(cut -f1 <<< "$result")" moved 'move reports the release'
  assert_equal "$(cut -f4 <<< "$result")" "$head" 'move reports the detached head'
  assert_equal "$(git -C "$root/repo" branch --show-current)" feature \
    'the branch is attached to the current worktree'
  assert_equal "$(git -C "$root/held" rev-parse HEAD)" "$head" \
    'the released worktree stays at the same commit'
  if git -C "$root/held" symbolic-ref --quiet HEAD >/dev/null; then
    fail 'the released worktree should be left on a detached HEAD'
  fi
  assert_equal "$(resolve_field "$root" feature 1)" here 'a moved branch resolves as here'
}

# An unheld branch attaches without a holder argument.
{
  root="$(new_fixture)"
  git -C "$root/repo" worktree remove "$root/held"
  head="$(git -C "$root/repo" rev-parse feature)"
  assert_equal "$(resolve_field "$root" feature 1)" free 'an unheld branch resolves as free'
  result="$(cd "$root/repo" && "$HELPER" move feature "$head")"
  assert_equal "$(cut -f1 <<< "$result")" attached 'move attaches a free branch'
  assert_equal "$(git -C "$root/repo" branch --show-current)" feature \
    'a free branch attaches to the current worktree'
}

# Work in progress in either worktree blocks the move.
{
  root="$(new_fixture)"
  printf 'base\nfeature\nedited\n' > "$root/held/README.md"
  assert_blocked "$root" feature "git -C $root/held stash --include-untracked" \
    'uncommitted tracked changes in the holder'

  root="$(new_fixture)"
  git -C "$root/held" switch --quiet -c conflicting main
  printf 'base\nconflict\n' > "$root/held/README.md"
  git -C "$root/held" commit --quiet -am 'fix: #350 conflicting work'
  git -C "$root/held" switch --quiet feature
  git -C "$root/held" merge conflicting >/dev/null 2>&1 || true
  assert_blocked "$root" feature "git -C $root/held merge --abort" \
    'a merge in progress in the holder'

  root="$(new_fixture)"
  git -C "$root/held" switch --quiet -c conflicting main
  printf 'base\nconflict\n' > "$root/held/README.md"
  git -C "$root/held" commit --quiet -am 'fix: #350 conflicting work'
  git -C "$root/held" switch --quiet feature
  git -C "$root/held" cherry-pick conflicting >/dev/null 2>&1 || true
  assert_blocked "$root" feature "git -C $root/held cherry-pick --abort" \
    'a cherry-pick in progress in the holder'

  root="$(new_fixture)"
  git -C "$root/held" revert --no-edit HEAD~1 >/dev/null 2>&1 || true
  assert_blocked "$root" feature "git -C $root/held revert --abort" \
    'a revert in progress in the holder'

  root="$(new_fixture)"
  git -C "$root/held" bisect start >/dev/null 2>&1
  git -C "$root/held" bisect bad >/dev/null 2>&1
  git -C "$root/held" bisect good main >/dev/null 2>&1 || true
  assert_blocked "$root" feature "git -C $root/held bisect reset" \
    'a bisect in progress in the holder'
  git -C "$root/held" bisect reset >/dev/null 2>&1

  root="$(new_fixture)"
  git -C "$root/repo" worktree lock "$root/held" --reason 'pinned by the operator'
  assert_blocked "$root" feature "git worktree unlock $root/held" 'a locked holder'
  git -C "$root/repo" worktree unlock "$root/held"

  root="$(new_fixture)"
  printf 'base\nedited\n' > "$root/repo/README.md"
  assert_blocked "$root" feature "git -C $root/repo stash --include-untracked" \
    'uncommitted tracked changes in the current worktree'
}

# A stale worktree entry names the command that clears it.
{
  root="$(new_fixture)"
  rm -rf "$root/held"
  if output="$(cd "$root/repo" && "$HELPER" resolve feature 2>&1)"; then
    fail "a stale holder should not resolve: $output"
  elif ! grep -Fq 'run: git worktree prune' <<< "$output"; then
    fail "a stale holder error was not actionable: $output"
  fi
  git -C "$root/repo" worktree prune
  assert_equal "$(resolve_field "$root" feature 1)" free 'a pruned holder frees the branch'
}

# A failed attach restores the holder.
{
  root="$(new_fixture)"
  printf 'kept\n' > "$root/held/collide.txt"
  git -C "$root/held" add collide.txt
  git -C "$root/held" commit --quiet -m 'feat: #350 add a colliding file'
  head="$(git -C "$root/held" rev-parse HEAD)"
  printf 'local\n' > "$root/repo/collide.txt"
  printf 'scratch\n' > "$root/held/scratch.txt"

  assert_equal "$(resolve_field "$root" feature 6)" 1 'resolve counts untracked files in the holder'
  if output="$(cd "$root/repo" && "$HELPER" move feature "$head" "$root/held" 2>&1)"; then
    fail "a colliding untracked file should block the attach: $output"
  elif ! grep -Fq "was restored to feature" <<< "$output"; then
    fail "a failed attach did not report the restore: $output"
  fi
  assert_equal "$(git -C "$root/held" branch --show-current)" feature \
    'a failed attach restores the holder'
  assert_equal "$(git -C "$root/repo" branch --show-current)" main \
    'a failed attach leaves the current worktree alone'
  assert_equal "$(cat "$root/repo/collide.txt")" local \
    'a failed attach preserves the untracked file'
}

# Invalid input and stale context are refused.
{
  root="$(new_fixture)"
  if output="$(cd "$root/repo" && "$HELPER" resolve absent 2>&1)"; then
    fail "an absent branch should not resolve: $output"
  elif ! grep -Fq 'local branch absent does not exist' <<< "$output"; then
    fail "an absent branch error was not actionable: $output"
  fi

  if output="$(cd "$root/repo" && "$HELPER" move feature 0000000 "$root/held" 2>&1)"; then
    fail "a stale branch head should not move: $output"
  elif ! grep -Fq 'rerun resolve against current context' <<< "$output"; then
    fail "a stale branch head error was not actionable: $output"
  fi

  head="$(git -C "$root/held" rev-parse HEAD)"
  if output="$(cd "$root/repo" && "$HELPER" move feature "$head" 2>&1)"; then
    fail "a held branch should not move as free: $output"
  elif ! grep -Fq 'rather than free' <<< "$output"; then
    fail "a held-versus-free error was not actionable: $output"
  fi
  assert_equal "$(git -C "$root/held" branch --show-current)" feature \
    'refused moves leave the holder attached'

  if output="$(cd "$root/repo" && "$HELPER" 2>&1)"; then
    fail "a missing subcommand should not succeed: $output"
  elif ! grep -Fq 'usage: worktree-context.sh' <<< "$output"; then
    fail "a missing subcommand error did not print usage: $output"
  fi
}

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT assertion(s) failed" >&2
  exit 1
fi

echo "OK: move-branch-here worktree contract passed"
