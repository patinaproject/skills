#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
lint="$REPO_ROOT/scripts/lint-label-vocabulary-parity.mjs"
root="$(mktemp -d)"
trap 'rm -rf "$root"' EXIT

adapter="docs/agents/issue-tracker.md"
template="plugins/work/skills/setup-work-skills/triage-labels.md"
mkdir -p "$root/$(dirname "$adapter")" "$root/$(dirname "$template")"
printf '# Adapter\n\n<!-- label-vocabulary:start -->\n**Type**\n<!-- label-vocabulary:end -->\n\nadapter only\n' >"$root/$adapter"
printf '## Labels\n\ntemplate only\n\n<!-- label-vocabulary:start -->\n**Type**\n<!-- label-vocabulary:end -->\n' >"$root/$template"

output="$(cd "$root" && node "$lint")"
test "$output" = "OK: label vocabulary copies match: $adapter and $template"

printf '<!-- label-vocabulary:start -->\n**Type**\n**Outcome**\n<!-- label-vocabulary:end -->\n' >"$root/$template"
if output="$(cd "$root" && node "$lint" 2>&1)"; then
  echo "FAIL: differing label vocabulary copies must fail the lint" >&2
  exit 1
fi
test "$output" = "FAIL: label vocabulary copies differ: $adapter and $template"

printf '**Type**\n' >"$root/$template"
if output="$(cd "$root" && node "$lint" 2>&1)"; then
  echo "FAIL: a copy without markers must fail the lint" >&2
  exit 1
fi
test "$output" = "FAIL: label vocabulary markers missing or repeated in: $template"
