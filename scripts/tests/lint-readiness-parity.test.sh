#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
lint="$REPO_ROOT/scripts/lint-readiness-parity.mjs"
root="$(mktemp -d)"
trap 'rm -rf "$root"' EXIT

work="plugins/work/skills/triage/READINESS.md"
code="plugins/code/skills/patina-mode/references/readiness.md"
mkdir -p "$root/$(dirname "$work")" "$root/$(dirname "$code")"
printf '# Readiness Check\n\n1. **Category.**\n' >"$root/$work"
cp "$root/$work" "$root/$code"

output="$(cd "$root" && node "$lint")"
test "$output" = "OK: readiness check copies match: $work and $code"

printf '2. **Claim verified.**\n' >>"$root/$code"
if output="$(cd "$root" && node "$lint" 2>&1)"; then
  echo "FAIL: differing readiness check copies must fail the lint" >&2
  exit 1
fi
test "$output" = "FAIL: readiness check copies differ: $work and $code"
