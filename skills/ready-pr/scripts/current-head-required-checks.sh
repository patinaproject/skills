#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo 'usage: current-head-required-checks.sh --pr <number> --head <expected-head-sha>' >&2
  exit 1
}

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pr_number=''
expected_head=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    --pr)
      [ "$#" -ge 2 ] || usage
      pr_number="$2"
      shift 2
      ;;
    --head)
      [ "$#" -ge 2 ] || usage
      expected_head="$2"
      shift 2
      ;;
    *)
      usage
      ;;
  esac
done
[ -n "$pr_number" ] || usage
[ -n "$expected_head" ] || usage

local_head="$(git rev-parse HEAD)" || fail 'cannot resolve local HEAD'
[ "$local_head" = "$expected_head" ] ||
  fail "local HEAD changed from expected $expected_head to $local_head"

read_pr_head() {
  gh pr view "$pr_number" --json headRefOid --jq .headRefOid
}

published_head="$(read_pr_head)" ||
  fail "gh pr view $pr_number failed while reading the published head"
[ "$published_head" = "$expected_head" ] ||
  fail "pull request #$pr_number head is $published_head, not expected current head $expected_head"

status=0
gh pr checks "$pr_number" --required || status="$?"

refreshed_head="$(read_pr_head)" ||
  fail "gh pr view $pr_number failed while rechecking the published head"
if [ "$refreshed_head" != "$expected_head" ]; then
  printf 'outcome=stale-required-check-snapshot expected=%s actual=%s\n' \
    "$expected_head" "$refreshed_head"
  exit 1
fi

if [ "$status" -ne 0 ]; then
  printf 'outcome=required-checks-non-pass status=%s head=%s\n' \
    "$status" "$expected_head"
  exit "$status"
fi

printf 'outcome=required-checks-passed head=%s\n' "$expected_head"
