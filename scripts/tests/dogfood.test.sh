#!/usr/bin/env bash
# dogfood.test.sh — Asserts that all in-repo skills are discoverable
# through their canonical plugin paths and the dogfood overlay symlinks.
# (find-skills is a third-party vendored skill, not an in-repo skill.)
# Exit 0: all in-repo skills pass all assertions.
# Exit 1: at least one assertion failed (with a clear FAIL message).
#
# Dependencies: bash 3+, realpath (macOS via coreutils) or python3 as fallback.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

ROOT_SKILLS=(
  scaffold-repository
  install-skills
  using-github
  grill-to-spec
  design-by-contract
  grill-system-design
  review-system-design
  writing-for-patina-mode
)
FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

for retired_path in \
  skills/resolve-qa-feedback \
  .claude/skills/resolve-qa-feedback \
  .agents/skills/resolve-qa-feedback \
  plugins/engineering/skills/working-on-issue \
  plugins/engineering/skills/offensive-programming \
  plugins/engineering/skills/fix; do
  if [ -e "$retired_path" ] || [ -L "$retired_path" ]; then
    fail "$retired_path still exposes a retired skill"
  fi
done

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

assert_skill_overlay() {
  local name="$1"
  local canonical_dir="$2"
  local canonical="$canonical_dir/SKILL.md"
  local claude_link=".claude/skills/$name/SKILL.md"
  local agents_link=".agents/skills/$name/SKILL.md"
  local frontmatter_name=""
  local in_frontmatter=0
  local line

  if [ ! -f "$canonical" ]; then
    fail "$canonical missing or not a regular file"
    return
  fi
  if [ -L "$canonical" ]; then
    fail "$canonical is a symlink; expected a real file"
    return
  fi

  while IFS= read -r line; do
    if [ "$line" = "---" ]; then
      if [ "$in_frontmatter" -eq 0 ]; then
        in_frontmatter=1
      else
        break
      fi
      continue
    fi
    if [ "$in_frontmatter" -eq 1 ]; then
      if [[ "$line" =~ ^name:[[:space:]]*(.+)$ ]]; then
        frontmatter_name="${BASH_REMATCH[1]}"
        frontmatter_name="${frontmatter_name%%[[:space:]]}"
        break
      fi
    fi
  done < "$canonical"

  if [ -z "$frontmatter_name" ]; then
    fail "$name: SKILL.md frontmatter missing 'name:' field"
    return
  fi
  if [ "$frontmatter_name" != "$name" ]; then
    fail "$name: SKILL.md frontmatter 'name: $frontmatter_name' != expected '$name'"
    return
  fi

  if [ ! -e "$claude_link" ]; then
    fail "$claude_link does not resolve (broken symlink or missing)"
    return
  fi
  if [ "$(_realpath "$claude_link")" != "$(_realpath "$canonical")" ]; then
    fail "$claude_link does not resolve to $canonical"
    return
  fi

  if [ ! -e "$agents_link" ]; then
    fail "$agents_link does not resolve (broken symlink or missing)"
    return
  fi
  if [ "$(_realpath "$agents_link")" != "$(_realpath "$canonical")" ]; then
    fail "$agents_link does not resolve to $canonical"
    return
  fi

  echo "OK: $name"
}

for name in "${ROOT_SKILLS[@]}"; do
  assert_skill_overlay "$name" "skills/$name"
done

for skill_dir in plugins/engineering/skills/*; do
  [ -d "$skill_dir" ] || continue
  assert_skill_overlay "$(basename "$skill_dir")" "$skill_dir"
done

for instructions_file in CLAUDE.md AGENTS.md; do
  begin_count="$(grep -cF '<!-- BEGIN engineering:patina-mode' "$instructions_file" || true)"
  end_count="$(grep -cF '<!-- END engineering:patina-mode -->' "$instructions_file" || true)"
  [ "$begin_count" -eq 1 ] || fail "$instructions_file has $begin_count patina-mode mandate starts, expected 1"
  [ "$end_count" -eq 1 ] || fail "$instructions_file has $end_count patina-mode mandate ends, expected 1"
done

for canonical_agent in plugins/engineering/agents/*.md; do
  installed_agent=".claude/agents/$(basename "$canonical_agent")"
  [ -f "$installed_agent" ] || fail "$installed_agent missing"
done

multi_agent_count="$(awk '
  /^\[features\][[:space:]]*$/ { in_features = 1; next }
  /^\[/ { in_features = 0 }
  in_features && /^[[:space:]]*multi_agent[[:space:]]*=[[:space:]]*true[[:space:]]*$/ { count++ }
  END { print count + 0 }
' .codex/config.toml)"
[ "$multi_agent_count" -eq 1 ] || fail ".codex/config.toml enables multi_agent $multi_agent_count times under [features], expected 1"

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT assertion(s) failed" >&2
  exit 1
fi

echo ""
echo "OK: all in-repo skills discoverable via canonical plugin layout"
exit 0
