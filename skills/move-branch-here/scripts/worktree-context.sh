#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "FAIL: $1" >&2
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

operation_in_progress() {
  local worktree="$1" git_dir marker
  git_dir="$(git -C "$worktree" rev-parse --absolute-git-dir)" ||
    fail "$worktree is not a readable git worktree"
  for marker in MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD BISECT_LOG rebase-merge rebase-apply; do
    if [ -e "$git_dir/$marker" ]; then
      printf '%s\n' "$marker"
      return 0
    fi
  done
  return 1
}

tracked_changes() {
  git -C "$1" status --porcelain --untracked-files=no
}

untracked_count() {
  git -C "$1" ls-files --others --exclude-standard | awk 'END { print NR + 0 }'
}

assert_ready_to_receive() {
  local worktree="$1" marker changes
  if marker="$(operation_in_progress "$worktree")"; then
    fail "this worktree is in the middle of $marker; finish or abort it before moving a branch here"
  fi
  changes="$(tracked_changes "$worktree")"
  if [ -n "$changes" ]; then
    fail "this worktree has uncommitted tracked changes; commit or stash them before moving a branch here:
$changes"
  fi
}

assert_holder_releasable() {
  local holder="$1" locked="$2" reason="$3" marker changes
  if [ "$locked" = "1" ]; then
    fail "worktree $holder is locked${reason:+ ($reason)}; run git worktree unlock $holder when releasing it is intended"
  fi
  if marker="$(operation_in_progress "$holder")"; then
    fail "worktree $holder is in the middle of $marker; finish or abort it there before moving the branch here"
  fi
  changes="$(tracked_changes "$holder")"
  if [ -n "$changes" ]; then
    fail "worktree $holder has uncommitted tracked changes that would be stranded on a detached HEAD; commit or stash them there first:
$changes"
  fi
}

# Emits "<mode>\t<branch>\t<branch-head>\t<holder-path>\t<holder-head>\t<holder-untracked>".
# Modes: here (already attached), free (no worktree holds it), held (another
# worktree holds it).
resolve_branch() {
  [ "$#" -eq 1 ] || fail "resolve requires exactly one branch name"

  local branch="$1" current branch_head record holder locked reason prunable pruned=0
  require_branch "$branch"
  current="$(current_worktree)"
  branch_head="$(git rev-parse "refs/heads/$branch")"
  record="$(holder_record "$branch")"

  while :; do
    if [ -z "$record" ]; then
      assert_ready_to_receive "$current"
      printf 'free\t%s\t%s\t\t\t0\n' "$branch" "$branch_head"
      return
    fi

    IFS=$'\t' read -r holder locked prunable reason <<< "$record"

    if [ ! -d "$holder" ]; then
      if [ "$prunable" = "1" ] && [ "$pruned" = "0" ]; then
        git worktree prune
        pruned=1
        record="$(holder_record "$branch")"
        continue
      fi
      fail "worktree $holder holds $branch but is unreadable; run git worktree prune or restore that path"
    fi

    break
  done

  holder="$(real_path "$holder")"
  if [ "$holder" = "$current" ]; then
    printf 'here\t%s\t%s\t%s\t%s\t%s\n' \
      "$branch" "$branch_head" "$holder" "$branch_head" "$(untracked_count "$holder")"
    return
  fi

  assert_holder_releasable "$holder" "$locked" "$reason"
  assert_ready_to_receive "$current"

  printf 'held\t%s\t%s\t%s\t%s\t%s\n' \
    "$branch" "$branch_head" "$holder" "$(git -C "$holder" rev-parse HEAD)" \
    "$(untracked_count "$holder")"
}

# Detaches the holding worktree and attaches the branch here, restoring the
# holder when attaching fails.
move_branch() {
  [ "$#" -ge 2 ] && [ "$#" -le 3 ] ||
    fail "usage: worktree-context.sh move <branch> <branch-head> [holder-path]"

  local branch="$1" expected_head="$2" expected_holder="${3:-}"
  local row mode actual_branch actual_head holder detached output restore

  row="$(resolve_branch "$branch")"
  IFS=$'\t' read -r mode actual_branch actual_head holder _ _ <<< "$row"

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
    if ! output="$(git -C "$holder" checkout --detach 2>&1)"; then
      echo "FAIL: git -C $holder checkout --detach failed" >&2
      printf '%s\n' "$output" >&2
      exit 1
    fi
    detached="$(git -C "$holder" rev-parse HEAD)"
  fi

  if ! output="$(git switch "$branch" 2>&1)"; then
    if [ "$mode" = "held" ]; then
      if restore="$(git -C "$holder" switch "$branch" 2>&1)"; then
        echo "FAIL: git switch $branch failed; worktree $holder was restored to $branch" >&2
      else
        echo "FAIL: git switch $branch failed and worktree $holder could not be restored to $branch" >&2
        printf '%s\n' "$restore" >&2
      fi
    else
      echo "FAIL: git switch $branch failed" >&2
    fi
    printf '%s\n' "$output" >&2
    exit 1
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
