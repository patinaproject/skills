#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
lint="$REPO_ROOT/scripts/lint-readiness-parity.mjs"
root="$(mktemp -d)"
trap 'rm -rf "$root"' EXIT

team="plugins/team/skills/triage/READINESS.md"
engineering="plugins/engineering/skills/patina-mode/references/readiness.md"
mkdir -p "$root/$(dirname "$team")" "$root/$(dirname "$engineering")"
printf '# Readiness Check\n\n1. **Category.**\n' >"$root/$team"
cp "$root/$team" "$root/$engineering"

output="$(cd "$root" && node "$lint")"
test "$output" = "OK: readiness check copies match: $team and $engineering"

printf '2. **Claim verified.**\n' >>"$root/$engineering"
if output="$(cd "$root" && node "$lint" 2>&1)"; then
  echo "FAIL: differing readiness check copies must fail the lint" >&2
  exit 1
fi
test "$output" = "FAIL: readiness check copies differ: $team and $engineering"
