#!/usr/bin/env bash
# patina-mode-script-paths.test.sh — Asserts every bundled script patina-mode
# names resolves from the anchor the skill tells an agent to resolve, and that
# no document reintroduces the plugin-root-relative form, which lands one level
# above the base directory a loader actually states.
# Exit 0: all assertions pass.
# Exit 1: at least one assertion failed (with a clear FAIL message).
#
# Dependencies: bash 3+, grep.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SKILL_DIR="plugins/engineering/skills/patina-mode"
FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

if ! grep -q 'Resolve `<skill-directory>` to this skill' "$SKILL_DIR/SKILL.md"; then
  fail "$SKILL_DIR/SKILL.md no longer defines the <skill-directory> anchor"
fi

referenced="$(grep -rho '<skill-directory>/scripts/[A-Za-z0-9._/-]*' "$SKILL_DIR" --include='*.md' | sort -u || true)"
if [ -z "$referenced" ]; then
  fail "no bundled script paths found under $SKILL_DIR; the anchor form changed"
fi

while IFS= read -r reference; do
  [ -n "$reference" ] || continue
  resolved="$SKILL_DIR/${reference#<skill-directory>/}"
  if [ ! -e "$resolved" ]; then
    fail "documented script path does not resolve: $reference -> $resolved"
  fi
done <<EOF
$referenced
EOF

unanchored="$(grep -rn 'skills/patina-mode/scripts/' "$SKILL_DIR" --include='*.md' || true)"
if [ -n "$unanchored" ]; then
  fail "plugin-root-relative script paths do not resolve for the reading agent; use <skill-directory>/scripts/"
  printf '%s\n' "$unanchored" >&2
fi

if ! grep -q -- 'watch-pr --pr ' "$SKILL_DIR/playbooks/babysit.md"; then
  fail "babysit step 6 no longer shows the watcher invocation with its --pr option"
fi

if [ "$FAIL_COUNT" -ne 0 ]; then
  echo "patina-mode-script-paths.test.sh: $FAIL_COUNT assertion(s) failed" >&2
  exit 1
fi

echo "patina-mode-script-paths.test.sh: all assertions passed"
