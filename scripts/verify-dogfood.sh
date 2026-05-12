#!/usr/bin/env bash
# verify-dogfood.sh — Asserts that all five in-repo skills are discoverable
# via the category-based skills/<category>/<name>/ layout and the dogfood
# overlay symlinks.
# Covers AC-58-3 check c.
#
# Exit 0: all five skills pass all assertions.
# Exit 1: at least one assertion failed (with a clear FAIL message).
#
# Dependencies: bash 3+, realpath (macOS via coreutils) or python3 as fallback.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# Each entry is "name:category"
SKILLS=(
  scaffold-repository:engineering
  superteam:engineering
  using-github:engineering
  office-hours:productivity
  find-skills:productivity
)
FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

# Portable realpath: try realpath (GNU coreutils / macOS coreutils via Homebrew),
# then readlink -f (GNU), then python3 as a final fallback.
_realpath() {
  if command -v realpath >/dev/null 2>&1; then
    realpath "$1"
  elif readlink -f "$1" >/dev/null 2>&1; then
    readlink -f "$1"
  else
    python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$1"
  fi
}

for entry in "${SKILLS[@]}"; do
  name="${entry%%:*}"
  category="${entry##*:}"
  CANONICAL="skills/$category/$name/SKILL.md"
  CLAUDE_LINK=".claude/skills/$name/SKILL.md"
  AGENTS_LINK=".agents/skills/$name/SKILL.md"

  # 1. Assert skills/<category>/<name>/SKILL.md is a regular file (not a symlink, not missing).
  if [ ! -f "$CANONICAL" ]; then
    fail "$CANONICAL missing or not a regular file"
    continue
  fi
  if [ -L "$CANONICAL" ]; then
    fail "$CANONICAL is a symlink — expected a real file"
    continue
  fi

  # 2. Parse YAML frontmatter name: field and assert it equals <name>.
  FRONTMATTER_NAME=""
  IN_FM=0
  while IFS= read -r line; do
    if [ "$line" = "---" ]; then
      if [ "$IN_FM" -eq 0 ]; then
        IN_FM=1
      else
        break
      fi
      continue
    fi
    if [ "$IN_FM" -eq 1 ]; then
      if [[ "$line" =~ ^name:[[:space:]]*(.+)$ ]]; then
        FRONTMATTER_NAME="${BASH_REMATCH[1]}"
        # Trim trailing whitespace / carriage return
        FRONTMATTER_NAME="${FRONTMATTER_NAME%%[[:space:]]}"
        break
      fi
    fi
  done < "$CANONICAL"

  if [ -z "$FRONTMATTER_NAME" ]; then
    fail "$name: SKILL.md frontmatter missing 'name:' field"
    continue
  fi
  if [ "$FRONTMATTER_NAME" != "$name" ]; then
    fail "$name: SKILL.md frontmatter 'name: $FRONTMATTER_NAME' != expected '$name'"
    continue
  fi

  # 3. Assert .claude/skills/<name>/SKILL.md resolves to the same real path as
  #    skills/<category>/<name>/SKILL.md via symlink traversal.
  if [ ! -e "$CLAUDE_LINK" ]; then
    fail "$CLAUDE_LINK does not resolve (broken symlink or missing)"
    continue
  fi
  CANONICAL_REAL="$(_realpath "$CANONICAL")"
  CLAUDE_REAL="$(_realpath "$CLAUDE_LINK")"
  if [ "$CLAUDE_REAL" != "$CANONICAL_REAL" ]; then
    fail "$CLAUDE_LINK resolves to '$CLAUDE_REAL', expected '$CANONICAL_REAL'"
    continue
  fi

  # 4. Same assertion for .agents/skills/<name>/SKILL.md.
  if [ ! -e "$AGENTS_LINK" ]; then
    fail "$AGENTS_LINK does not resolve (broken symlink or missing)"
    continue
  fi
  AGENTS_REAL="$(_realpath "$AGENTS_LINK")"
  if [ "$AGENTS_REAL" != "$CANONICAL_REAL" ]; then
    fail "$AGENTS_LINK resolves to '$AGENTS_REAL', expected '$CANONICAL_REAL'"
    continue
  fi

  echo "OK: $name ($category)"
done

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT assertion(s) failed" >&2
  exit 1
fi

echo ""
echo "OK: all five skills discoverable via category layout"
exit 0
