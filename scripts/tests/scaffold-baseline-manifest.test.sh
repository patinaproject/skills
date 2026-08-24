#!/usr/bin/env bash
set -euo pipefail

# Behavioral guard for the core baseline presence check.
#
# The scaffold verification self-test used to pass on a repository missing every
# declared baseline file, because it only checked that tooling runs. These
# assertions cover the verifier that closes that gap and the manifest it reads.
#
# Per ADR-224 this asserts script behavior and the non-`.md` manifest only.

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

VERIFIER="skills/scaffold-repository/scripts/verify-baseline.sh"
MANIFEST="skills/scaffold-repository/core-baseline.txt"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

[ -x "$VERIFIER" ] || fail "$VERIFIER is missing or not executable"
[ -f "$MANIFEST" ] || fail "$MANIFEST is missing"

# The manifest is the single source the skill documents and the verifier reads.
manifest_paths="$(grep -vE '^\s*(#|$)' "$MANIFEST" | sed 's/ \[.*//')"
[ -n "$manifest_paths" ] || fail "manifest declares no paths"

# 1. This repository is the live baseline reference, so it must satisfy its own
#    manifest.
bash "$VERIFIER" --public >/dev/null || fail "the live reference repo fails its own baseline check"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

seed_repo() {
  local root="$1"
  rm -rf "$root"
  while IFS= read -r entry; do
    mkdir -p "$root/$(dirname "$entry")"
    : > "$root/$entry"
  done <<< "$manifest_paths"
  # The one entry the manifest requires to be a symlink rather than a file.
  # `docs/agents/` holds the real adapter; `docs/issue-tracker.md` points at it.
  rm -f "$root/docs/issue-tracker.md"
  ln -s agents/issue-tracker.md "$root/docs/issue-tracker.md"
}

# 2. A complete emit passes.
seed_repo "$work/complete"
bash "$VERIFIER" --public "$work/complete" >/dev/null ||
  fail "a repo seeded from the manifest should pass"

# 3. A partial emit fails and names the gap. This is the reported failure: a
#    scaffolded repo with no docs/ directory at all.
seed_repo "$work/partial"
rm -rf "$work/partial/docs"
output="$(bash "$VERIFIER" --public "$work/partial" 2>&1)" && {
  printf '%s\n' "$output" >&2
  fail "a repo missing docs/ should fail the baseline check"
}
printf '%s\n' "$output" | grep -q "docs/issue-tracker.md" ||
  fail "the failure must name the missing adapter path: $output"

# 4. SECURITY.md is public-only, so its absence is a gap for a public repo and
#    not for a private one.
seed_repo "$work/private"
rm -f "$work/private/SECURITY.md"
bash "$VERIFIER" --public "$work/private" >/dev/null 2>&1 &&
  fail "a public repo missing SECURITY.md should fail"
bash "$VERIFIER" --private "$work/private" >/dev/null 2>&1 ||
  fail "a private repo without SECURITY.md should pass"

# 5. The adapter compatibility entry must be a symlink to the real file, not a
#    second copy of it.
seed_repo "$work/copied"
rm -f "$work/copied/docs/issue-tracker.md"
: > "$work/copied/docs/issue-tracker.md"
output="$(bash "$VERIFIER" --public "$work/copied" 2>&1)" && {
  printf '%s\n' "$output" >&2
  fail "a duplicated adapter file should fail the symlink requirement"
}
printf '%s\n' "$output" | grep -q "docs/issue-tracker.md" ||
  fail "the failure must name the divergent symlink: $output"

# The pair must resolve to one file: a symlink pointing the old way is a gap,
# not an acceptable alternative direction.
seed_repo "$work/inverted"
rm -f "$work/inverted/docs/issue-tracker.md"
: > "$work/inverted/docs/issue-tracker.md"
rm -f "$work/inverted/docs/agents/issue-tracker.md"
ln -s ../issue-tracker.md "$work/inverted/docs/agents/issue-tracker.md"
bash "$VERIFIER" --public "$work/inverted" >/dev/null 2>&1 &&
  fail "the previous symlink direction should be reported as a gap"

echo "OK: scaffold core baseline manifest contract passed"
