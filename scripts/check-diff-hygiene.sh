#!/usr/bin/env bash
set -euo pipefail

base="${1:?usage: check-diff-hygiene.sh BASE_SHA}"
status=0
if ! git diff --check "$base"...HEAD; then
  echo "::error::The diff has whitespace errors or conflict markers."
  status=1
fi
trails="$(git diff --name-only --no-renames --diff-filter=A "$base"...HEAD | grep -E '(^|/)\.audit/|(^|/)decisions\.tsv$' || true)"
if [ -n "$trails" ]; then
  printf '%s\n' "$trails"
  echo "::error::Working trails (.audit/, decisions.tsv) must stay uncommitted."
  status=1
fi
exit "$status"
