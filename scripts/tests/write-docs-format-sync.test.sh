#!/usr/bin/env bash
# write-docs-format-sync.test.sh — Assert the bundled format reference files in
# skills/write-docs/ are byte-identical to the vendored grill-with-docs originals.
#
# This is a machine-consumed mirror contract, NOT a prose assertion: it checks
# only that the files MATCH, never WHAT they say. See ADR-232
# (docs/adr/ADR-232-format-sync-mirror-contract.md) for why this coexists with
# ADR-224 (no tests on documentation content).
#
# The copies are kept in sync by hand: when this test fails after a re-vendor of
# grill-with-docs, copy the changed file over the bundled copy.
#
# Exit 0: every bundled copy is byte-identical to its vendored original.
# Exit 1: at least one copy diverged or is missing.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SRC=".agents/skills/grill-with-docs"
DST="skills/write-docs"
FILES=(CONTEXT-FORMAT.md ADR-FORMAT.md)
FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

for f in "${FILES[@]}"; do
  if [ ! -f "$SRC/$f" ]; then
    fail "vendored original $SRC/$f is missing (run 'pnpm skills:install')"
    continue
  fi
  if [ ! -f "$DST/$f" ]; then
    fail "bundled copy $DST/$f is missing (copy it: cp '$SRC/$f' '$DST/$f')"
    continue
  fi
  if ! cmp -s "$SRC/$f" "$DST/$f"; then
    fail "$DST/$f diverged from $SRC/$f (re-copy it: cp '$SRC/$f' '$DST/$f')"
    continue
  fi
  echo "OK: $f matches the vendored grill-with-docs original"
done

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT write-docs format file(s) out of sync" >&2
  exit 1
fi

echo ""
echo "OK: write-docs format files in sync with vendored grill-with-docs"
exit 0
