#!/usr/bin/env bash
set -euo pipefail

CHECK="$(git rev-parse --show-toplevel)/scripts/check-diff-hygiene.sh"
FAIL_COUNT=0
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

new_repo() {
  local dir
  dir="$(mktemp -d "$SCRATCH/repo.XXXXXX")"
  git -C "$dir" init -q -b main
  git -C "$dir" config user.email t@example.com
  git -C "$dir" config user.name t
  git -C "$dir" config commit.gpgsign false
  printf 'vendored line   \nsecond\n' >"$dir/vendored.md"
  printf 'trail\n' >"$dir/notes.tsv"
  git -C "$dir" add . && git -C "$dir" commit -qm base
  printf '%s' "$dir"
}

expect() {
  local want="$1" name="$2" dir="$3"
  local got=0
  (cd "$dir" && bash "$CHECK" "$(git rev-parse main)") >/dev/null 2>&1 || got=$?
  if [ "$want" = pass ] && [ "$got" -ne 0 ]; then fail "$name: expected pass, exited $got"; fi
  if [ "$want" = fail ] && [ "$got" -eq 0 ]; then fail "$name: expected failure, passed"; fi
}

dir="$(new_repo)"
git -C "$dir" checkout -qb pr
printf 'vendored line   \nsecond changed\n' >"$dir/vendored.md"
git -C "$dir" commit -qam 'update vendored file'
expect pass "pre-existing trailing whitespace outside the PR's added lines" "$dir"

dir="$(new_repo)"
git -C "$dir" checkout -qb pr
printf 'added line \n' >>"$dir/vendored.md"
git -C "$dir" commit -qam 'add trailing whitespace'
expect fail "trailing whitespace on an added line" "$dir"

dir="$(new_repo)"
git -C "$dir" checkout -qb pr
mkdir "$dir/.audit" && printf 'x\n' >"$dir/.audit/decisions.tsv"
git -C "$dir" add . && git -C "$dir" commit -qm 'add trail'
expect fail "an added .audit file" "$dir"

dir="$(new_repo)"
git -C "$dir" checkout -qb pr
mkdir "$dir/.audit" && git -C "$dir" mv notes.tsv .audit/notes.tsv
git -C "$dir" commit -qm 'move trail'
expect fail "a file renamed into .audit" "$dir"

if [ "$FAIL_COUNT" -ne 0 ]; then
  echo "$FAIL_COUNT diff hygiene assertion(s) failed" >&2
  exit 1
fi
echo "diff hygiene tests passed"
