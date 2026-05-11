#!/usr/bin/env bash
# verify-dogfood.sh — Asserts that all five in-repo skills are discoverable
# through the canonical .agents/skills overlay and the .claude/skills symlink
# layer. Covers AC-58-3 check d.
#
# Exit 0: all five skills pass all assertions.
# Exit 1: at least one assertion failed (with a clear FAIL message).

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

# Plugin-scoped skills traverse a two-hop symlink chain:
#   .claude/skills/<name>  ->  .agents/skills/<name>  ->  plugins/<name>/skills/<name>
PLUGIN_SCOPED_SKILLS=(scaffold-repository superteam using-github)

# Standalone skills have a one-hop chain at the Claude layer and a real file
# at the canonical layer:
#   .claude/skills/<name>  ->  .agents/skills/<name>/<SKILL.md>  (real file)
STANDALONE_SKILLS=(find-skills office-hours)

ALL_SKILLS=("${PLUGIN_SCOPED_SKILLS[@]}" "${STANDALONE_SKILLS[@]}")

for name in "${ALL_SKILLS[@]}"; do
  CLAUDE_PATH=".claude/skills/$name"
  AGENTS_PATH=".agents/skills/$name"
  SKILL_FILE=".claude/skills/$name/SKILL.md"

  # 1. Assert the Claude overlay path exists and is not a broken symlink
  if [ -L "$CLAUDE_PATH" ] && [ ! -e "$CLAUDE_PATH" ]; then
    fail "$CLAUDE_PATH is a broken symlink"
    continue
  fi
  if [ ! -e "$CLAUDE_PATH" ]; then
    fail "$CLAUDE_PATH does not exist"
    continue
  fi

  # 2. Assert SKILL.md is readable (resolving through symlinks)
  if [ ! -e "$SKILL_FILE" ]; then
    fail "$SKILL_FILE does not exist (symlink resolution failed)"
    continue
  fi
  if [ ! -r "$SKILL_FILE" ]; then
    fail "$SKILL_FILE is not readable"
    continue
  fi

  # 3. Assert frontmatter has name: and description: fields
  FRONTMATTER_NAME=""
  IN_FRONTMATTER=0
  while IFS= read -r line; do
    if [ "$line" = "---" ]; then
      if [ "$IN_FRONTMATTER" -eq 0 ]; then
        IN_FRONTMATTER=1
      else
        break
      fi
      continue
    fi
    if [ "$IN_FRONTMATTER" -eq 1 ]; then
      if [[ "$line" =~ ^name:[[:space:]]*(.+)$ ]]; then
        FRONTMATTER_NAME="${BASH_REMATCH[1]}"
      fi
    fi
  done < "$SKILL_FILE"

  if [ -z "$FRONTMATTER_NAME" ]; then
    fail "$name SKILL.md frontmatter is missing 'name:' field"
    continue
  fi

  # 4. Assert the name: value matches the skill directory name
  if [ "$FRONTMATTER_NAME" != "$name" ]; then
    fail "$name SKILL.md frontmatter 'name: $FRONTMATTER_NAME' does not match expected '$name'"
    continue
  fi

  # 5. Branch verification by skill shape
  IS_PLUGIN_SCOPED=0
  for ps in "${PLUGIN_SCOPED_SKILLS[@]}"; do
    if [ "$ps" = "$name" ]; then
      IS_PLUGIN_SCOPED=1
      break
    fi
  done

  if [ "$IS_PLUGIN_SCOPED" -eq 1 ]; then
    # Plugin-scoped: verify two-hop symlink chain
    # Hop 1: .claude/skills/<name> -> .agents/skills/<name>
    if [ ! -L "$CLAUDE_PATH" ]; then
      fail "$CLAUDE_PATH should be a symlink (plugin-scoped)"
      continue
    fi
    CLAUDE_TARGET=$(readlink "$CLAUDE_PATH")
    if [[ "$CLAUDE_TARGET" != *".agents/skills/$name" ]]; then
      fail "$CLAUDE_PATH symlink target '$CLAUDE_TARGET' does not point into .agents/skills/$name"
      continue
    fi

    # Hop 2: .agents/skills/<name> -> plugins/<name>/skills/<name>
    if [ ! -L "$AGENTS_PATH" ]; then
      fail "$AGENTS_PATH should be a symlink (plugin-scoped)"
      continue
    fi
    AGENTS_TARGET=$(readlink "$AGENTS_PATH")
    EXPECTED_PLUGIN_PATH="plugins/$name/skills/$name"
    if [[ "$AGENTS_TARGET" != *"$EXPECTED_PLUGIN_PATH" ]]; then
      fail "$AGENTS_PATH symlink target '$AGENTS_TARGET' does not point into $EXPECTED_PLUGIN_PATH"
      continue
    fi

    # Final resolution: the plugin's SKILL.md must exist as a real file
    RESOLVED=$(realpath "$SKILL_FILE" 2>/dev/null)
    if [ -z "$RESOLVED" ] || [ ! -f "$RESOLVED" ]; then
      fail "$name SKILL.md does not resolve to a real file via realpath"
      continue
    fi

    echo "OK: $name (plugin-scoped, two-hop chain verified)"

  else
    # Standalone: one symlink hop at Claude layer, real file at canonical layer
    # .claude/skills/<name> -> .agents/skills/<name>  (symlink)
    # .agents/skills/<name>/SKILL.md                  (real file)
    if [ ! -L "$CLAUDE_PATH" ]; then
      fail "$CLAUDE_PATH should be a symlink (standalone)"
      continue
    fi

    CANONICAL_SKILLMD="$AGENTS_PATH/SKILL.md"
    if [ ! -f "$CANONICAL_SKILLMD" ]; then
      fail "$CANONICAL_SKILLMD does not exist as a real file"
      continue
    fi
    if [ -L "$CANONICAL_SKILLMD" ]; then
      fail "$CANONICAL_SKILLMD should be a real file, not a symlink"
      continue
    fi

    echo "OK: $name (standalone, real file at canonical layer)"
  fi
done

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT assertion(s) failed" >&2
  exit 1
fi

echo ""
echo "OK: all five skills discoverable via canonical overlay and Claude symlink layer"
exit 0
