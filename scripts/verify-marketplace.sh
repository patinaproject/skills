#!/usr/bin/env bash
set -euo pipefail

# Validate the Claude Code marketplace catalog.
test -f .claude-plugin/marketplace.json
test -f .claude-plugin/plugin.json
m_name=$(jq -r '.name' .claude-plugin/marketplace.json)
p_name=$(jq -r '.name' .claude-plugin/plugin.json)
mp_name=$(jq -r '.plugins[0].name' .claude-plugin/marketplace.json)
test "$m_name" = "patinaproject-skills"
test "$p_name" = "patinaproject-skills"
test "$mp_name" = "patinaproject-skills"
for path in $(jq -r '.skills[]' .claude-plugin/plugin.json); do
  if ! echo "$path" | grep -qE '^\./skills/[a-z-]+$'; then
    echo "FAIL: Claude plugin.json skill path '$path' does not match flat form './skills/<name>'" >&2
    exit 1
  fi
  test -f "${path#./}/SKILL.md"
done
if jq -r '.skills[]' .claude-plugin/plugin.json | grep -q 'find-skills'; then
  echo "FAIL: find-skills must not appear in .claude-plugin/plugin.json skills[] (it is third-party)" >&2
  exit 1
fi

# Validate the Codex marketplace catalog.
# Codex's convention is asymmetric to Claude's: the plugin manifest lives at
# .codex-plugin/plugin.json (parallel to .claude-plugin/plugin.json), but the
# marketplace catalog lives at .agents/plugins/marketplace.json (NOT .codex-plugin/).
test -f .agents/plugins/marketplace.json
test -f .codex-plugin/plugin.json
cm_name=$(jq -r '.name' .agents/plugins/marketplace.json)
cp_name=$(jq -r '.name' .codex-plugin/plugin.json)
cmp_name=$(jq -r '.plugins[0].name' .agents/plugins/marketplace.json)
test "$cm_name" = "patinaproject-skills"
test "$cp_name" = "patinaproject-skills"
test "$cmp_name" = "patinaproject-skills"
# Assert Codex skill paths are flat and resolve
for path in $(jq -r '.skills[]' .codex-plugin/plugin.json); do
  if ! echo "$path" | grep -qE '^\./skills/[a-z-]+$'; then
    echo "FAIL: Codex plugin.json skill path '$path' does not match flat form './skills/<name>'" >&2
    exit 1
  fi
  test -f "${path#./}/SKILL.md"
done
if jq -r '.skills[]' .codex-plugin/plugin.json | grep -q 'find-skills'; then
  echo "FAIL: find-skills must not appear in .codex-plugin/plugin.json skills[] (it is third-party)" >&2
  exit 1
fi

# Assert Claude and Codex plugin.json skills[] arrays match (same plugin, two hosts).
claude_skills=$(jq -c '.skills' .claude-plugin/plugin.json)
codex_skills=$(jq -c '.skills' .codex-plugin/plugin.json)
if [ "$claude_skills" != "$codex_skills" ]; then
  echo "FAIL: Claude and Codex plugin.json skills[] arrays diverged" >&2
  echo "  Claude: $claude_skills" >&2
  echo "  Codex:  $codex_skills" >&2
  exit 1
fi

echo "OK: marketplace catalogs validated (Claude + Codex)"
