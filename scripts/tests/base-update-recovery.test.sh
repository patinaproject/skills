#!/usr/bin/env bash
set -euo pipefail

# Behavior tests for the base-update recovery contract mechanics in
# skills/ready-pr/scripts/base-update-verify.sh (ADR-224: script behavior,
# not documentation prose). Covers the recovered ready-pr path, the recovered
# merge-pr delegation path, the persistent-failure stop path, and the
# exactly-verified-head guard.

SCRIPT="$(pwd)/skills/ready-pr/scripts/base-update-verify.sh"
test -x "$SCRIPT"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

fixture() {
  local dir="$1"
  git init -q -b main "$dir"
  git -C "$dir" config user.name 'Test'
  git -C "$dir" config user.email 'test@example.com'
  git -C "$dir" config commit.gpgsign false
  echo base >"$dir/base.txt"
  git -C "$dir" add base.txt
  git -C "$dir" commit -qm 'chore: #0 base'
  git -C "$dir" checkout -qb work
  echo work >"$dir/work.txt"
  git -C "$dir" add work.txt
  git -C "$dir" commit -qm 'chore: #0 work'
  git -C "$dir" checkout -q main
  echo advance >"$dir/advance.txt"
  git -C "$dir" add advance.txt
  git -C "$dir" commit -qm 'chore: #0 advance base'
  git -C "$dir" checkout -q work
  git -C "$dir" merge --no-commit --no-ff main >/dev/null 2>&1
  git -C "$dir" rev-parse -q --verify MERGE_HEAD >/dev/null
}

# Verifier stubs live outside the fixture repo so they never dirty its tree.
write_verifier() {
  local path="$1" body="$2"
  printf '#!/usr/bin/env bash\n%s\n' "$body" >"$path"
  chmod +x "$path"
}

assert_contains() {
  local haystack="$1" needle="$2" label="$3"
  if ! printf '%s\n' "$haystack" | grep -Fq "$needle"; then
    echo "FAIL: $label: expected output to contain: $needle" >&2
    printf '%s\n' "$haystack" >&2
    exit 1
  fi
}

assert_merge_commit_clean() {
  local dir="$1" label="$2"
  if git -C "$dir" rev-parse -q --verify MERGE_HEAD >/dev/null; then
    echo "FAIL: $label: merge is still in progress" >&2
    exit 1
  fi
  if [ "$(git -C "$dir" rev-list --parents -n1 HEAD | wc -w)" -ne 3 ]; then
    echo "FAIL: $label: HEAD is not a merge commit" >&2
    exit 1
  fi
  if [ -n "$(git -C "$dir" status --porcelain)" ]; then
    echo "FAIL: $label: working tree is not clean after commit" >&2
    exit 1
  fi
}

# --- verified: first attempt passes, merged head is committed ---
dir="$WORKDIR/verified"
fixture "$dir"
verifier="$WORKDIR/verified-verify.sh"
write_verifier "$verifier" 'exit 0'
output="$(cd "$dir" && "$SCRIPT" --message 'chore: #0 update branch with main' -- "$verifier")"
assert_contains "$output" 'outcome=verified attempts=1' 'verified path'
assert_merge_commit_clean "$dir" 'verified path'

# --- recovered ready-pr path: retryable first failure, bounded retry passes,
# --- the exactly verified merged head is committed ---
dir="$WORKDIR/recovered"
fixture "$dir"
pre_head="$(git -C "$dir" rev-parse HEAD)"
verifier="$WORKDIR/recovered-verify.sh"
marker="$WORKDIR/recovered-flaked"
write_verifier "$verifier" "if [ ! -f '$marker' ]; then touch '$marker'; exit 1; fi; exit 0"
output="$(cd "$dir" && "$SCRIPT" --message 'chore: #0 update branch with main' -- "$verifier")"
assert_contains "$output" 'outcome=recovered attempts=2' 'recovered path'
assert_merge_commit_clean "$dir" 'recovered path'
if [ "$(git -C "$dir" log -1 --format=%s)" != 'chore: #0 update branch with main' ]; then
  echo 'FAIL: recovered path: merge commit does not use the provided message' >&2
  exit 1
fi

# --- recovered merge-pr delegation path: after delegated recovery the head
# --- SHA changed (progress under merge-pr's no-progress rule) and a state
# --- refresh finds the branch current with its base, so auto-merge continues ---
post_head="$(git -C "$dir" rev-parse HEAD)"
if [ "$post_head" = "$pre_head" ]; then
  echo 'FAIL: delegation path: recovery did not advance the head SHA' >&2
  exit 1
fi
refresh="$(git -C "$dir" merge --no-commit --no-ff main)"
assert_contains "$refresh" 'Already up to date' 'delegation path refresh'

# --- persistent-failure stop: reproducible failure aborts the merge and
# --- leaves the branch unchanged, naming the failing verification ---
dir="$WORKDIR/persistent"
fixture "$dir"
pre_head="$(git -C "$dir" rev-parse HEAD)"
verifier="$WORKDIR/persistent-verify.sh"
write_verifier "$verifier" 'exit 3'
status=0
output="$(cd "$dir" && "$SCRIPT" --message 'chore: #0 update branch with main' -- "$verifier" 2>&1)" || status="$?"
if [ "$status" -eq 0 ]; then
  echo 'FAIL: persistent path: script succeeded on a reproducible failure' >&2
  exit 1
fi
assert_contains "$output" 'outcome=reproducible attempts=2 merge-state=aborted' 'persistent path'
assert_contains "$output" "$verifier" 'persistent path names the failing verification'
if git -C "$dir" rev-parse -q --verify MERGE_HEAD >/dev/null; then
  echo 'FAIL: persistent path: merge was not aborted' >&2
  exit 1
fi
if [ "$(git -C "$dir" rev-parse HEAD)" != "$pre_head" ]; then
  echo 'FAIL: persistent path: branch head changed despite failed verification' >&2
  exit 1
fi
if [ -n "$(git -C "$dir" status --porcelain)" ]; then
  echo 'FAIL: persistent path: working tree is not clean after abort' >&2
  exit 1
fi

# --- unclassifiable failure: a verification command that cannot run at all
# --- repeats and lands on the reproducible stop path ---
dir="$WORKDIR/unclassifiable"
fixture "$dir"
pre_head="$(git -C "$dir" rev-parse HEAD)"
status=0
output="$(cd "$dir" && "$SCRIPT" --message 'chore: #0 update branch with main' -- "$WORKDIR/does-not-exist.sh" 2>&1)" || status="$?"
if [ "$status" -eq 0 ]; then
  echo 'FAIL: unclassifiable path: script succeeded with a missing verification command' >&2
  exit 1
fi
assert_contains "$output" 'outcome=reproducible attempts=2 merge-state=aborted' 'unclassifiable path'
if [ "$(git -C "$dir" rev-parse HEAD)" != "$pre_head" ]; then
  echo 'FAIL: unclassifiable path: branch head changed despite unrunnable verification' >&2
  exit 1
fi

# --- exactly-verified-head guard: a passing run that mutates tracked files
# --- must not be committed ---
dir="$WORKDIR/drifted"
fixture "$dir"
pre_head="$(git -C "$dir" rev-parse HEAD)"
verifier="$WORKDIR/drifted-verify.sh"
write_verifier "$verifier" 'echo mutated >>base.txt; exit 0'
status=0
output="$(cd "$dir" && "$SCRIPT" --message 'chore: #0 update branch with main' -- "$verifier" 2>&1)" || status="$?"
if [ "$status" -eq 0 ]; then
  echo 'FAIL: drift guard: script committed a head that differs from the verified tree' >&2
  exit 1
fi
assert_contains "$output" 'outcome=drifted' 'drift guard'
if [ "$(git -C "$dir" rev-parse HEAD)" != "$pre_head" ]; then
  echo 'FAIL: drift guard: branch head changed despite drift' >&2
  exit 1
fi

# --- exactly-verified-head guard: a passing run that mutates AND stages a
# --- tracked file must not be committed either ---
dir="$WORKDIR/drifted-staged"
fixture "$dir"
pre_head="$(git -C "$dir" rev-parse HEAD)"
verifier="$WORKDIR/drifted-staged-verify.sh"
write_verifier "$verifier" 'echo mutated >>base.txt; git add base.txt; exit 0'
status=0
output="$(cd "$dir" && "$SCRIPT" --message 'chore: #0 update branch with main' -- "$verifier" 2>&1)" || status="$?"
if [ "$status" -eq 0 ]; then
  echo 'FAIL: staged drift guard: script committed a head that differs from the verified staged merge tree' >&2
  exit 1
fi
assert_contains "$output" 'outcome=drifted' 'staged drift guard'
if [ "$(git -C "$dir" rev-parse HEAD)" != "$pre_head" ]; then
  echo 'FAIL: staged drift guard: branch head changed despite staged drift' >&2
  exit 1
fi

# --- precondition: refuses to run without a base merge in progress ---
dir="$WORKDIR/no-merge"
git init -q -b main "$dir"
git -C "$dir" config user.name 'Test'
git -C "$dir" config user.email 'test@example.com'
echo base >"$dir/base.txt"
git -C "$dir" add base.txt
git -C "$dir" commit -qm 'chore: #0 base'
status=0
(cd "$dir" && "$SCRIPT" --message 'chore: #0 update' -- true) >/dev/null 2>&1 || status="$?"
if [ "$status" -eq 0 ]; then
  echo 'FAIL: precondition: script ran without a merge in progress' >&2
  exit 1
fi

echo 'OK: base-update recovery contract mechanics behave as documented'
