#!/usr/bin/env bash
# sync-write-docs-format.sh — Re-copy the bundled format reference files into the
# repo-owned write-docs skill from the vendored grill-with-docs skill, keeping
# them byte-identical.
#
# write-docs ships to the marketplace independently, so it bundles its own copies
# of CONTEXT-FORMAT.md and ADR-FORMAT.md rather than depending on the vendored
# skill's internal layout. Those copies are a machine-consumed mirror contract
# (see docs/adr/ADR-232-format-sync-mirror-contract.md), enforced by
# scripts/tests/write-docs-format-sync.test.sh.
#
# Run this after re-vendoring skills (it is wired into `pnpm skills:install`) so
# the copies track the upstream originals and the sync test stays green.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SRC=".agents/skills/grill-with-docs"
DST="skills/write-docs"
FILES=(CONTEXT-FORMAT.md ADR-FORMAT.md)

for f in "${FILES[@]}"; do
  if [ ! -f "$SRC/$f" ]; then
    echo "ERROR: vendored source $SRC/$f is missing; run 'pnpm skills:install' first" >&2
    exit 1
  fi
  cp "$SRC/$f" "$DST/$f"
  echo "synced: $DST/$f <- $SRC/$f"
done

echo "OK: write-docs format files synced from vendored grill-with-docs"
