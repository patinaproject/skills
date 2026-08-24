#!/usr/bin/env bash
set -euo pipefail

# Mechanics for the base-update recovery contract
# (../references/base-update-recovery.md): verify a clean, uncommitted base
# merge with one bounded retry, commit only an exactly verified merged head,
# and abort the merge on a reproducible failure.

usage() {
  echo 'usage: base-update-verify.sh --message <commit-message> -- <verification-command> [args...]' >&2
  exit 1
}

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

message=''
case "${1:-}" in
  --message)
    [ "$#" -ge 2 ] || usage
    message="$2"
    shift 2
    ;;
  *)
    usage
    ;;
esac
[ -n "$message" ] || usage
[ "${1:-}" = '--' ] || usage
shift
[ "$#" -ge 1 ] || usage
verify_cmd=("$@")

git rev-parse --is-inside-work-tree >/dev/null 2>&1 ||
  fail 'not inside a git work tree'
git rev-parse -q --verify MERGE_HEAD >/dev/null ||
  fail 'no base merge is in progress; run this only on an uncommitted base merge'
[ -z "$(git ls-files --unmerged)" ] ||
  fail 'the base merge has unresolved conflicts; resolve them through the conflict path, not this contract'

pre_head="$(git rev-parse HEAD)"

abort_merge() {
  git merge --abort ||
    fail 'git merge --abort failed; restore the working tree before continuing'
}

run_attempt() {
  local attempt="$1" status=0
  echo "base-update verification attempt $attempt of 2: ${verify_cmd[*]}"
  "${verify_cmd[@]}" || status="$?"
  if [ "$status" -ne 0 ]; then
    echo "base-update verification attempt $attempt of 2 failed (exit $status)" >&2
  fi
  return "$status"
}

commit_exactly_verified() {
  local outcome="$1" attempts="$2" head

  # The committed tree must be the tree the passing run verified. A tracked
  # difference between the working tree and the index means verification
  # mutated the merge result after staging, so the head would be unverified.
  if ! git diff --quiet; then
    abort_merge
    printf 'outcome=drifted attempts=%s merge-state=aborted head=%s\n' \
      "$attempts" "$(git rev-parse HEAD)"
    fail "verification mutated tracked files after the passing run, so the merged head is no longer exactly verified; merge aborted, branch unchanged at $pre_head"
  fi

  git commit -m "$message" >/dev/null ||
    fail 'git commit failed on the verified base merge'
  head="$(git rev-parse HEAD)"
  printf 'outcome=%s attempts=%s head=%s\n' "$outcome" "$attempts" "$head"
  echo "Committed exactly verified base-update merge as $head."
}

if run_attempt 1; then
  commit_exactly_verified verified 1
  exit 0
fi

echo 'retrying once to classify the failure: a pass on an identical re-run is retryable, a repeat is reproducible'
if run_attempt 2; then
  commit_exactly_verified recovered 2
  exit 0
fi

abort_merge
printf 'outcome=reproducible attempts=2 merge-state=aborted head=%s\n' \
  "$(git rev-parse HEAD)"
fail "verification failed on both bounded attempts: ${verify_cmd[*]}; merge aborted, branch unchanged at $pre_head"
