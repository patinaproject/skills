#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

fail_with_output() {
  echo "FAIL: $1" >&2
  printf '%s\n' "$2" >&2
  exit 1
}

# Prints a path as git reports it, or returns non-zero so each caller can name
# what an unreadable path means where it stands.
resolve_physical_path() {
  local resolved
  resolved="$(cd "$1" 2>/dev/null && pwd -P)" || return 1
  printf '%s\n' "$resolved"
}

current_worktree() {
  local root
  root="$(git rev-parse --show-toplevel 2>/dev/null)" || return 1
  resolve_physical_path "$root"
}

require_branch() {
  local branch="$1"
  [ -n "$branch" ] || fail "a branch name is required"
  git show-ref --verify --quiet "refs/heads/$branch" ||
    fail "local branch $branch does not exist; fetch or create it before moving it here"
}

# The states a rebase leaves behind, named once for every reader of them.
rebase_states=(rebase-merge rebase-apply)

# Prints the first line of a file, or returns non-zero when it yields nothing.
# A value written without a trailing newline makes read report failure after it
# has already assigned, so the value decides rather than the exit status.
first_line() {
  local line=''
  read -r line < "$1" 2>/dev/null || true
  [ -n "$line" ] || return 1
  printf '%s\n' "$line"
}

# Emits "<path>\t<locked>\t<prunable>\t<locked-reason>" for the worktree that
# holds the branch, or nothing when no worktree holds it. Flags follow the
# branch line inside a record, so each record is buffered until it ends. The
# optional reason stays last because a tab IFS collapses empty middle fields.
holder_record() {
  local branch="$1" listing="$2"
  printf '%s\n' "$listing" | awk -v ref="refs/heads/$branch" '
    function flush() {
      if (path != "" && head == ref) {
        print path "\t" locked "\t" prunable "\t" reason
      }
      path = ""; head = ""; locked = 0; reason = ""; prunable = 0
    }
    /^worktree / { flush(); path = substr($0, 10); next }
    /^branch /   { head = substr($0, 8); next }
    /^locked/    { locked = 1; reason = substr($0, 8); next }
    /^prunable/  { prunable = 1; next }
    END { flush() }
  '
}

# Names the operation in the way of the move and the command that clears it.
# The optional branch marks an operation that took the branch off the worktree
# list with it. One wording for every blocker, so none of them can drift.
fail_operation() {
  local role="$1" key="$2" worktree="$3" branch="${4:-}" operation command
  IFS=$'\t' read -r operation command <<< "$(operation_guidance "$key" "$worktree")"
  fail "$role is in the middle of a $operation${branch:+ on $branch}; finish it there or run: $command"
}

fail_unreadable_worktree() {
  fail "$1 is not a readable git worktree"
}

# A worktree scanned for hidden operations keeps them to itself when it cannot
# be read. Refusing beats a row that reads as free while the doubt goes to
# stderr.
fail_unchecked_worktree() {
  fail "worktree $1 cannot be read, so its operations could not be checked; repair it or run: git worktree remove --force $1"
}

# "<state file>\t<guidance key>" for the operations that detach the worktree
# running them. Each records the branch it will return to in its own state.
detaching_states() {
  local state
  for state in "${rebase_states[@]}"; do
    printf '%s/head-name\t%s\n' "$state" "$state"
  done
  printf 'BISECT_START\tBISECT_LOG\n'
}

# A worktree mid-rebase or mid-bisect sits on a detached HEAD, so no worktree
# record claims the branch it will return to. Each operation's own state names
# that branch instead. The current worktree is left to assert_worktree_quiet,
# which reports its operations in the first person.
assert_branch_free_of_operations() {
  local branch="$1" current="$2" listing="$3" paths path resolved git_dir
  local state key name
  paths="$(printf '%s\n' "$listing" | awk '/^worktree / { print substr($0, 10) }')"

  while IFS= read -r path; do
    # A worktree whose directory is gone strands no live work; its metadata
    # goes with git worktree prune.
    [ -d "$path" ] || continue
    resolved="$(resolve_physical_path "$path")" ||
      fail_unchecked_worktree "$path"
    [ "$resolved" != "$current" ] || continue
    git_dir="$(worktree_git_dir "$path")" ||
      fail_unchecked_worktree "$path"

    while IFS=$'\t' read -r state key; do
      [ -f "$git_dir/$state" ] || continue
      name="$(first_line "$git_dir/$state")" ||
        fail "git state file is empty or unreadable: $git_dir/$state; repair that worktree or clear the operation there"
      [ "$name" = "$branch" ] || [ "$name" = "refs/heads/$branch" ] || continue
      fail_operation "worktree $path" "$key" "$path" "$branch"
    done <<< "$(detaching_states)"
  done <<< "$paths"
}

worktree_git_dir() {
  git -C "$1" rev-parse --absolute-git-dir 2>/dev/null
}

# Prints the marker file of an operation in progress, or nothing. Keeping this
# free of failure exits lets callers read it inside a command substitution.
operation_marker() {
  local git_dir="$1" marker
  for marker in MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD BISECT_LOG "${rebase_states[@]}"; do
    [ -e "$git_dir/$marker" ] || continue
    # git am borrows rebase-apply, and only git am --abort clears it.
    if [ "$marker" = 'rebase-apply' ] && [ -e "$git_dir/rebase-apply/applying" ]; then
      printf 'am\n'
    else
      printf '%s\n' "$marker"
    fi
    return
  done
}

# Prints "<operation>\t<command that clears it>" for a marker file. The final
# case keeps an unrecognized marker honest instead of naming the wrong command.
operation_guidance() {
  case "$1" in
    MERGE_HEAD)                printf 'merge\tgit -C %s merge --abort\n' "$2" ;;
    CHERRY_PICK_HEAD)          printf 'cherry-pick\tgit -C %s cherry-pick --abort\n' "$2" ;;
    REVERT_HEAD)               printf 'revert\tgit -C %s revert --abort\n' "$2" ;;
    BISECT_LOG)                printf 'bisect\tgit -C %s bisect reset\n' "$2" ;;
    am)                        printf 'patch application\tgit -C %s am --abort\n' "$2" ;;
    rebase-merge|rebase-apply) printf 'rebase\tgit -C %s rebase --abort\n' "$2" ;;
    *)                         printf 'git operation (%s)\tgit -C %s status\n' "$1" "$2" ;;
  esac
}

assert_no_operation() {
  local worktree="$1" role="$2" git_dir marker
  git_dir="$(worktree_git_dir "$worktree")" || fail_unreadable_worktree "$role"
  marker="$(operation_marker "$git_dir")"
  [ -n "$marker" ] || return 0
  fail_operation "$role" "$marker" "$worktree"
}

assert_no_tracked_changes() {
  local worktree="$1" role="$2" changes
  changes="$(git -C "$worktree" status --porcelain --untracked-files=no)" ||
    fail_unreadable_worktree "$role"
  [ -n "$changes" ] || return 0
  fail "$role has uncommitted tracked changes; commit them there or run: git -C $worktree stash --include-untracked
$changes"
}

untracked_count() {
  local files
  files="$(git -C "$1" ls-files --others --exclude-standard)" || return 1
  [ -n "$files" ] || { printf '0\n'; return; }
  printf '%s\n' "$files" | awk 'END { print NR + 0 }'
}

assert_worktree_quiet() {
  assert_no_operation "$1" "$2"
  assert_no_tracked_changes "$1" "$2"
}

assert_holder_releasable() {
  local holder="$1" locked="$2" reason="$3"
  if [ "$locked" = "1" ]; then
    fail "worktree $holder is locked${reason:+ ($reason)}; run: git worktree unlock $holder"
  fi
  assert_worktree_quiet "$holder" "worktree $holder"
}

# Emits
# "<mode>\t<branch>\t<branch-head>\t<holder-untracked>\t<holder-path>\t<holder-head>".
# Modes: here (already attached), free (no worktree holds it), held (another
# worktree holds it). The holder fields stay last because they are empty in
# free mode and a tab IFS collapses empty middle fields.
resolve_branch() {
  [ "$#" -eq 1 ] || fail "resolve requires exactly one branch name"

  local branch="$1" current branch_head listing record holder locked reason
  local prunable holder_head untracked
  require_branch "$branch"
  current="$(current_worktree)" ||
    fail "move-branch-here requires a git worktree; run it from inside one"
  branch_head="$(git rev-parse "refs/heads/$branch")"
  listing="$(git worktree list --porcelain)" ||
    fail "git worktree list --porcelain failed"
  record="$(holder_record "$branch" "$listing")"

  if [ -z "$record" ]; then
    assert_branch_free_of_operations "$branch" "$current" "$listing"
    assert_worktree_quiet "$current" 'this worktree'
    printf 'free\t%s\t%s\t0\t\t\n' "$branch" "$branch_head"
    return
  fi

  case "$record" in
    *$'\n'*)
      fail "more than one worktree records $branch; run: git worktree prune"
      ;;
  esac

  IFS=$'\t' read -r holder locked prunable reason <<< "$record"

  if [ "$prunable" = "1" ] || [ ! -d "$holder" ]; then
    fail "worktree $holder holds $branch but its path is gone; run: git worktree prune"
  fi

  holder="$(resolve_physical_path "$holder")" ||
    fail "worktree $holder is not a readable directory; run: git worktree prune"
  untracked="$(untracked_count "$holder")" || fail_unreadable_worktree "$holder"

  if [ "$holder" = "$current" ]; then
    printf 'here\t%s\t%s\t%s\t%s\t%s\n' \
      "$branch" "$branch_head" "$untracked" "$holder" "$branch_head"
    return
  fi

  assert_holder_releasable "$holder" "$locked" "$reason"
  assert_worktree_quiet "$current" 'this worktree'
  holder_head="$(git -C "$holder" rev-parse HEAD)"

  printf 'held\t%s\t%s\t%s\t%s\t%s\n' \
    "$branch" "$branch_head" "$untracked" "$holder" "$holder_head"
}

# Detaches the holding worktree and attaches the branch here, restoring the
# holder when attaching fails.
move_branch() {
  [ "$#" -ge 2 ] && [ "$#" -le 3 ] ||
    fail "usage: worktree-context.sh move <branch> <branch-head> [holder-path]"

  local branch="$1" expected_head="$2" expected_holder="${3:-}"
  local row mode actual_head holder detached output restore

  row="$(resolve_branch "$branch")"
  IFS=$'\t' read -r mode _ actual_head _ holder _ <<< "$row"

  if [ "$actual_head" != "$expected_head" ]; then
    fail "branch $branch moved from $expected_head to $actual_head; rerun resolve against current context"
  fi
  if [ -n "$expected_holder" ]; then
    expected_holder="$(resolve_physical_path "$expected_holder")" ||
      fail "path is not a readable directory: $expected_holder"
    [ "$mode" = "held" ] ||
      fail "branch $branch is no longer held by another worktree (now $mode); rerun resolve against current context"
    [ "$holder" = "$expected_holder" ] ||
      fail "branch $branch moved from worktree $expected_holder to $holder; rerun resolve against current context"
  else
    [ "$mode" = "free" ] ||
      fail "branch $branch is now $mode rather than free; rerun resolve against current context"
  fi

  if [ "$mode" = "held" ]; then
    output="$(git -C "$holder" checkout --detach 2>&1)" ||
      fail_with_output "git -C $holder checkout --detach failed" "$output"
    detached="$(git -C "$holder" rev-parse HEAD)"
  fi

  if ! output="$(git switch "$branch" 2>&1)"; then
    if [ "$mode" != "held" ]; then
      fail_with_output "git switch $branch failed" "$output"
    fi
    restore="$(git -C "$holder" switch "$branch" 2>&1)" ||
      fail_with_output \
        "git switch $branch failed and worktree $holder could not be restored to $branch" \
        "$restore
$output"
    fail_with_output \
      "git switch $branch failed; worktree $holder was restored to $branch" "$output"
  fi

  [ "$(git branch --show-current)" = "$branch" ] ||
    fail "git switch $branch reported success but this worktree is not on $branch"

  if [ "$mode" = "held" ]; then
    printf 'moved\t%s\t%s\t%s\n' "$branch" "$holder" "$detached"
  else
    printf 'attached\t%s\t\t\n' "$branch"
  fi
}

case "${1:-}" in
  resolve)
    shift
    resolve_branch "$@"
    ;;
  move)
    shift
    move_branch "$@"
    ;;
  *)
    fail "usage: worktree-context.sh {resolve <branch>|move <branch> <branch-head> [holder-path]}"
    ;;
esac
