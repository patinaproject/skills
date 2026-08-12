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

real_path() {
  local resolved
  resolved="$(cd "$1" 2>/dev/null && pwd -P)" ||
    fail "path is not a readable directory: $1"
  printf '%s\n' "$resolved"
}

current_worktree() {
  local root
  root="$(git rev-parse --show-toplevel 2>/dev/null)" ||
    fail "move-branch-here requires a git worktree; run it from inside one"
  real_path "$root"
}

require_branch() {
  local branch="$1"
  [ -n "$branch" ] || fail "a branch name is required"
  git show-ref --verify --quiet "refs/heads/$branch" ||
    fail "local branch $branch does not exist; fetch or create it before moving it here"
}

# Emits "<path>\t<locked>\t<prunable>\t<locked-reason>" for the worktree that
# holds the branch, or nothing when no worktree holds it. Flags follow the
# branch line inside a record, so each record is buffered until it ends. The
# optional reason stays last because a tab IFS collapses empty middle fields.
holder_record() {
  local branch="$1"
  git worktree list --porcelain | awk -v ref="refs/heads/$branch" '
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

worktree_git_dir() {
  local git_dir
  git_dir="$(git -C "$1" rev-parse --absolute-git-dir)" ||
    fail "$1 is not a readable git worktree"
  printf '%s\n' "$git_dir"
}

# Prints the marker file of an operation in progress, or nothing. Keeping this
# free of failure exits lets callers read it inside a command substitution.
operation_marker() {
  local git_dir="$1" marker
  for marker in MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD BISECT_LOG rebase-merge rebase-apply; do
    if [ -e "$git_dir/$marker" ]; then
      printf '%s\n' "$marker"
      return
    fi
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
    rebase-merge|rebase-apply) printf 'rebase\tgit -C %s rebase --abort\n' "$2" ;;
    *)                         printf 'git operation (%s)\tgit -C %s status\n' "$1" "$2" ;;
  esac
}

assert_no_operation() {
  local worktree="$1" role="$2" git_dir marker operation command
  git_dir="$(worktree_git_dir "$worktree")"
  marker="$(operation_marker "$git_dir")"
  [ -n "$marker" ] || return 0
  IFS=$'\t' read -r operation command <<< "$(operation_guidance "$marker" "$worktree")"
  fail "$role is in the middle of a $operation; finish it there or run: $command"
}

assert_no_tracked_changes() {
  local worktree="$1" role="$2" changes
  changes="$(git -C "$worktree" status --porcelain --untracked-files=no)" ||
    fail "$role is not a readable git worktree"
  [ -n "$changes" ] || return 0
  fail "$role has uncommitted tracked changes; commit them there or run: git -C $worktree stash --include-untracked
$changes"
}

untracked_count() {
  local files
  files="$(git -C "$1" ls-files --others --exclude-standard)" ||
    fail "$1 is not a readable git worktree"
  [ -n "$files" ] || { printf '0\n'; return; }
  printf '%s\n' "$files" | awk 'END { print NR + 0 }'
}

assert_ready_to_receive() {
  local worktree="$1"
  assert_no_operation "$worktree" 'this worktree'
  assert_no_tracked_changes "$worktree" 'this worktree'
}

assert_holder_releasable() {
  local holder="$1" locked="$2" reason="$3"
  if [ "$locked" = "1" ]; then
    fail "worktree $holder is locked${reason:+ ($reason)}; run: git worktree unlock $holder"
  fi
  assert_no_operation "$holder" "worktree $holder"
  assert_no_tracked_changes "$holder" "worktree $holder"
}

# Emits "<mode>\t<branch>\t<branch-head>\t<holder-path>\t<holder-head>\t<holder-untracked>".
# Modes: here (already attached), free (no worktree holds it), held (another
# worktree holds it).
resolve_branch() {
  [ "$#" -eq 1 ] || fail "resolve requires exactly one branch name"

  local branch="$1" current branch_head record holder locked reason prunable
  local holder_head untracked
  require_branch "$branch"
  current="$(current_worktree)"
  branch_head="$(git rev-parse "refs/heads/$branch")"
  record="$(holder_record "$branch")"

  if [ -z "$record" ]; then
    assert_ready_to_receive "$current"
    printf 'free\t%s\t%s\t\t\t0\n' "$branch" "$branch_head"
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

  holder="$(real_path "$holder")"
  untracked="$(untracked_count "$holder")"

  if [ "$holder" = "$current" ]; then
    printf 'here\t%s\t%s\t%s\t%s\t%s\n' \
      "$branch" "$branch_head" "$holder" "$branch_head" "$untracked"
    return
  fi

  assert_holder_releasable "$holder" "$locked" "$reason"
  assert_ready_to_receive "$current"
  holder_head="$(git -C "$holder" rev-parse HEAD)"

  printf 'held\t%s\t%s\t%s\t%s\t%s\n' \
    "$branch" "$branch_head" "$holder" "$holder_head" "$untracked"
}

# Detaches the holding worktree and attaches the branch here, restoring the
# holder when attaching fails.
move_branch() {
  [ "$#" -ge 2 ] && [ "$#" -le 3 ] ||
    fail "usage: worktree-context.sh move <branch> <branch-head> [holder-path]"

  local branch="$1" expected_head="$2" expected_holder="${3:-}"
  local row mode actual_head holder detached output restore

  row="$(resolve_branch "$branch")"
  IFS=$'\t' read -r mode _ actual_head holder _ _ <<< "$row"

  if [ "$actual_head" != "$expected_head" ]; then
    fail "branch $branch moved from $expected_head to $actual_head; rerun resolve against current context"
  fi
  if [ -n "$expected_holder" ]; then
    expected_holder="$(real_path "$expected_holder")"
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
