#!/usr/bin/env bash
# improve-branch-architecture-format-sync.test.sh — Assert the bundled reference
# files in skills/improve-branch-architecture/ are byte-identical to their
# vendored upstream originals.
#
# This is a machine-consumed mirror contract, NOT a prose assertion: it checks
# only that the files MATCH, never WHAT they say. See ADR-232
# (docs/adr/ADR-232-format-sync-mirror-contract.md) for why this coexists with
# ADR-224 (no tests on documentation content). ADR-247 records the v1 re-point:
# DEEPENING moved upstream to codebase-design and CONTEXT-FORMAT/ADR-FORMAT to
# domain-modeling, while LANGUAGE.md and INTERFACE-DESIGN.md lost their standalone
# upstream source and are now owned outright by this skill (not mirrored here).
#
# The copies are kept in sync by hand: when this test fails after a re-vendor of
# codebase-design or domain-modeling, copy the changed file over the bundled copy.
#
# Exit 0: every bundled copy is byte-identical to its vendored original.
# Exit 1: at least one copy diverged or is missing.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

DST="skills/improve-branch-architecture"
FAIL_COUNT=0

# Each entry maps a bundled copy to its vendored source: "<file> <vendored-dir>".
# LANGUAGE.md and INTERFACE-DESIGN.md are intentionally absent: v1 dissolved their
# standalone upstream files (the deep-module vocabulary folded into
# codebase-design/SKILL.md, and the interface-design pass became
# codebase-design/DESIGN-IT-TWICE.md), so this skill owns them outright. See
# ADR-247.
PAIRS=(
  "DEEPENING.md .agents/skills/codebase-design"
  "CONTEXT-FORMAT.md .agents/skills/domain-modeling"
  "ADR-FORMAT.md .agents/skills/domain-modeling"
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
