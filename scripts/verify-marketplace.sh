#!/usr/bin/env bash
set -euo pipefail
test -f .claude-plugin/marketplace.json
test -f .claude-plugin/plugin.json
# Assert plugin slug matches in both files
m_name=$(jq -r '.name' .claude-plugin/marketplace.json)
p_name=$(jq -r '.name' .claude-plugin/plugin.json)
mp_name=$(jq -r '.plugins[0].name' .claude-plugin/marketplace.json)
test "$m_name" = "patinaproject-skills"
test "$p_name" = "patinaproject-skills"
test "$mp_name" = "patinaproject-skills"
# Assert all skill paths in plugin.json exist
for path in $(jq -r '.skills[]' .claude-plugin/plugin.json); do
  test -f "${path#./}/SKILL.md"
done
# Assert find-skills is NOT in plugin.json skills[] (it is a third-party vendored skill)
if jq -r '.skills[]' .claude-plugin/plugin.json | grep -q 'find-skills'; then
  echo "FAIL: find-skills must not appear in .claude-plugin/plugin.json skills[] (it is third-party)" >&2
  exit 1
fi
echo "OK: marketplace catalog validated"
