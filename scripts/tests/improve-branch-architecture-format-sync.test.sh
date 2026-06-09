#!/usr/bin/env bash
# improve-branch-architecture-format-sync.test.sh — Assert the bundled reference
# files in skills/improve-branch-architecture/ are byte-identical to their
# vendored upstream originals.
#
# This is a machine-consumed mirror contract, NOT a prose assertion: it checks
# only that the files MATCH, never WHAT they say. See ADR-232
# (docs/adr/ADR-232-format-sync-mirror-contract.md) for why this coexists with
# ADR-224 (no tests on documentation content).
#
# The copies are kept in sync by hand: when this test fails after a re-vendor of
# improve-codebase-architecture or grill-with-docs, copy the changed file over
# the bundled copy.
#
# Exit 0: every bundled copy is byte-identical to its vendored original.
# Exit 1: at least one copy diverged or is missing.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

DST="skills/improve-branch-architecture"
FAIL_COUNT=0

# Each entry maps a bundled copy to its vendored source: "<file> <vendored-dir>".
PAIRS=(
  "LANGUAGE.md .agents/skills/improve-codebase-architecture"
  "DEEPENING.md .agents/skills/improve-codebase-architecture"
  "INTERFACE-DESIGN.md .agents/skills/improve-codebase-architecture"
  "CONTEXT-FORMAT.md .agents/skills/grill-with-docs"
  "ADR-FORMAT.md .agents/skills/grill-with-docs"
)

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

for pair in "${PAIRS[@]}"; do
  f="${pair%% *}"
  src_dir="${pair#* }"
  src="$src_dir/$f"
  dst="$DST/$f"

  if [ ! -f "$src" ]; then
    fail "vendored original $src is missing (run 'pnpm skills:install')"
    continue
  fi
  if [ ! -f "$dst" ]; then
    fail "bundled copy $dst is missing (copy it: cp '$src' '$dst')"
    continue
  fi
  if ! cmp -s "$src" "$dst"; then
    fail "$dst diverged from $src (re-copy it: cp '$src' '$dst')"
    continue
  fi
  echo "OK: $f matches the vendored original in $src_dir"
done

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT improve-branch-architecture format file(s) out of sync" >&2
  exit 1
fi

echo ""
echo "OK: improve-branch-architecture format files in sync with vendored upstreams"
exit 0
