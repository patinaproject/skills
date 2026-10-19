#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
lint="$REPO_ROOT/scripts/lint-active-skill-references.mjs"
root="$(mktemp -d)"
trap 'rm -rf "$root"' EXIT

mkdir -p "$root/plugins/engineering/skills/alpha" "$root/plugins/engineering/agents" "$root/plugins/engineering/effort-agents" "$root/plugins/engineering/hooks" \
  "$root/plugins/team/skills/beta/references" "$root/plugins/team/skills/mirror/references"
printf '{"sources":[{"targets":[{"kind":"skill","destination":"plugins/team/skills/mirror"}]}]}\n' >"$root/upstream-skills.json"
printf -- '---\nname: alpha\n---\n' >"$root/plugins/engineering/skills/alpha/SKILL.md"
printf -- '---\nname: beta\n---\n' >"$root/plugins/team/skills/beta/SKILL.md"
printf -- '---\nname: mirror\n---\n' >"$root/plugins/team/skills/mirror/SKILL.md"
printf 'Use `team:missing` here.\n' >"$root/plugins/team/skills/mirror/references/upstream.md"
printf 'Follow `engineering:alpha` and pass `engineering:effort-<level>`.\n' >"$root/plugins/team/skills/beta/references/brief.md"
printf -- '---\nname: patina-agent\n---\n' >"$root/plugins/engineering/agents/patina-agent.md"
printf -- '---\nname: effort-low\n---\n' >"$root/plugins/engineering/effort-agents/effort-low.md"
printf 'Spawn `subagent_type: "patina-agent"`, `subagent_type: "effort-<level>"`, or `subagent_type: "general-purpose"`.\n' >"$root/plugins/engineering/skills/alpha/brief.md"
printf 'Invoke the `alpha` skill.\n' >"$root/plugins/engineering/hooks/session-start-context.md"

output="$(cd "$root" && node "$lint")"
test "$output" = 'OK: 7 active skill files contain only published executable references and in-plugin links'

expect_failure() {
  if output="$(cd "$root" && node "$lint" 2>&1)"; then
    echo "FAIL: $1 must fail the lint" >&2
    exit 1
  fi
  test "$output" = "$2" || { printf 'FAIL: %s\nunexpected output: %s\n' "$1" "$output" >&2; exit 1; }
}

cp "$root/plugins/engineering/skills/alpha/brief.md" "$root/brief.bak"
printf 'Spawn `subagent_type: "patina-agnet"`.\n' >>"$root/plugins/engineering/skills/alpha/brief.md"
expect_failure 'a bare agent name with no agent file' 'FAIL: agent dispatch names an unavailable agent: patina-agnet in plugins/engineering/skills/alpha/brief.md'
cp "$root/brief.bak" "$root/plugins/engineering/skills/alpha/brief.md"
printf 'Spawn `subagent_type: "engineering:patina-agent"`.\n' >>"$root/plugins/engineering/skills/alpha/brief.md"
expect_failure 'a namespaced Engineering agent' 'FAIL: agent dispatch uses a namespaced name: engineering:patina-agent in plugins/engineering/skills/alpha/brief.md; use patina-agent'
cp "$root/brief.bak" "$root/plugins/engineering/skills/alpha/brief.md"
printf 'Invoke the `omega` skill.\n' >"$root/plugins/engineering/hooks/session-start-context.md"
expect_failure 'a mandate naming a missing skill' 'FAIL: session-start mandate names an unavailable skill: omega in plugins/engineering/hooks/session-start-context.md'
printf 'Invoke the `alpha` skill.\n' >"$root/plugins/engineering/hooks/session-start-context.md"

printf 'Follow `engineering:gamma`.\n' >>"$root/plugins/team/skills/beta/references/brief.md"
if output="$(cd "$root" && node "$lint" 2>&1)"; then
  echo "FAIL: an unpublished reference in a skill reference file must fail the lint" >&2
  exit 1
fi
test "$output" = 'FAIL: executable skill reference is unavailable: engineering:gamma in plugins/team/skills/beta/references/brief.md'

printf 'Follow `engineering:alpha`.\n' >"$root/plugins/team/skills/beta/references/brief.md"
printf 'Load team:beta or patinaproject-skills:beta, then run `/team:beta`.\n' >>"$root/plugins/team/skills/beta/references/brief.md"
if output="$(cd "$root" && node "$lint" 2>&1)"; then
  echo "FAIL: a plugin-prefixed Team reference must fail the lint" >&2
  exit 1
fi
test "$output" = 'FAIL: skill reference carries a plugin prefix: /team:beta in plugins/team/skills/beta/references/brief.md; use /beta
FAIL: skill reference carries a plugin prefix: patinaproject-skills:beta in plugins/team/skills/beta/references/brief.md; use beta
FAIL: skill reference carries a plugin prefix: team:beta in plugins/team/skills/beta/references/brief.md; use beta'
