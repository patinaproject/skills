#!/bin/sh
set -eu

# Each runtime's hooks file passes its own name.
case "${1:-}" in
  claude) sheet="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/pstack-models.md" ;;
  codex) sheet="${CODEX_HOME:-$HOME/.codex}/pstack-models.md" ;;
  copilot) sheet="${COPILOT_HOME:-$HOME/.copilot}/pstack-models.md" ;;
  *)
    echo "session-start.sh: unknown runtime '${1:-}' (expected claude, codex, or copilot)" >&2
    exit 2
    ;;
esac

# Plugin hooks provide CLAUDE_PLUGIN_ROOT. A project-level installation keeps
# this script beside its context file instead, so make the neighboring
# directory the fallback when the plugin variable is absent.
hook_root="${CLAUDE_PLUGIN_ROOT:+${CLAUDE_PLUGIN_ROOT}/hooks}"
if [ -z "$hook_root" ]; then
  hook_root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
fi

# Same decoding as setup-pstack/scripts/read-sheet.sh, inline because a
# project-level installation ships this script without the skill.
read_sheet() {
  [ -f "$1" ] && [ -r "$1" ] || return 1
  if [ "$(od -An -tx1 -N2 "$1" | tr -d ' ')" = fffe ]; then
    text=$(iconv -f UTF-16LE -t UTF-8 "$1") || return 1
  else
    text=$(cat "$1")
  fi
  printf '%s\n' "$text" | sed -e "1s/^$(printf '\357\273\277')//" -e "s/$(printf '\r')\$//"
}

# A sheet that cannot be decoded counts as missing, so injection stays on.
found=0
if normalized=$(read_sheet "$sheet"); then
  found=1
else
  normalized=
fi
if printf '%s\n' "$normalized" | grep -qx 'session hook: off'; then
  exit 0
fi

# GitHub Copilot parses stdout as one JSON object. Its sheet sits outside
# Copilot's path sandbox, so the hook checks the sheet and adds its role lines
# to the mandate, and the agent never reads the file.
if [ "$1" = copilot ]; then
  printf '%s\n' "$normalized" | LC_ALL=C awk -v found="$found" -v hooks="${COPILOT_PLUGIN_ROOT}/hooks" \
    -f "${COPILOT_PLUGIN_ROOT}/hooks/json.awk" \
    -f "${COPILOT_PLUGIN_ROOT}/skills/setup-pstack/scripts/sheet.awk" \
    -f "${COPILOT_PLUGIN_ROOT}/hooks/copilot-context.awk"
  exit 0
fi

# A CLAUDE.md symlink to AGENTS.md is shared by Claude and Codex. When Codex
# setup owns the mandate in that shared file, Claude already receives it from
# the instructions file; avoid injecting a second copy through the hook.
if [ "$1" = claude ]; then
  project_dir="${CLAUDE_PROJECT_DIR:-}"
  case "$hook_root" in
    */.claude/hooks) [ -n "$project_dir" ] || project_dir=$(CDPATH= cd -- "$hook_root/../.." && pwd) ;;
  esac
  if [ -n "$project_dir" ]; then
    instructions_file="${project_dir}/CLAUDE.md"
  fi
  if [ -n "${instructions_file:-}" ] && [ -f "$instructions_file" ]; then
    if grep -qF '<!-- BEGIN engineering:patina-mode' "$instructions_file" &&
       grep -qF '<!-- END engineering:patina-mode -->' "$instructions_file"; then
      exit 0
    fi

  fi
fi

cat "${hook_root}/session-start-context.md"
