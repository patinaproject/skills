#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
lint="$REPO_ROOT/scripts/lint-active-skill-references.mjs"
root="$(mktemp -d)"
trap 'rm -rf "$root"' EXIT

mkdir -p "$root/plugins/engineering/skills/alpha" "$root/plugins/engineering/agents" "$root/plugins/engineering/effort-agents" \
  "$root/plugins/team/skills/beta/references" "$root/plugins/team/skills/mirror/references"
printf '{"sources":[{"targets":[{"kind":"skill","destination":"plugins/team/skills/mirror"}]}]}\n' >"$root/upstream-skills.json"
printf -- '---\nname: alpha\n---\n' >"$root/plugins/engineering/skills/alpha/SKILL.md"
printf -- '---\nname: beta\n---\n' >"$root/plugins/team/skills/beta/SKILL.md"
printf -- '---\nname: mirror\n---\n' >"$root/plugins/team/skills/mirror/SKILL.md"
printf 'Use `team:missing` here.\n' >"$root/plugins/team/skills/mirror/references/upstream.md"
printf 'Follow `engineering:alpha` and pass `engineering:effort-<level>`.\n' >"$root/plugins/team/skills/beta/references/brief.md"

output="$(cd "$root" && node "$lint")"
test "$output" = 'OK: 4 active skill files contain only published executable references and in-plugin links'

printf 'Follow `team:gamma`.\n' >>"$root/plugins/team/skills/beta/references/brief.md"
if output="$(cd "$root" && node "$lint" 2>&1)"; then
  echo "FAIL: an unpublished reference in a skill reference file must fail the lint" >&2
  exit 1
fi
test "$output" = 'FAIL: executable skill reference is unavailable: team:gamma in plugins/team/skills/beta/references/brief.md'
