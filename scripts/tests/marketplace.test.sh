#!/usr/bin/env bash
set -euo pipefail

expected_marketplace_skills='["./skills/scaffold-repository","./skills/using-github","./skills/new-branch","./skills/develop","./skills/develop-with-workflow","./skills/ready-pr","./skills/merge-pr","./skills/finish-pr","./skills/codex-pr-feedback-loop","./skills/polish","./skills/update-branch","./skills/move-branch-here","./skills/install-skills","./skills/grill-to-spec","./skills/design-by-contract","./skills/grill-system-design","./skills/review-system-design","./skills/orchestrate","./skills/write-changelog","./skills/prompting-fable"]'
expected_engineering_skills='["architect","arena","automate-me","babysit","blast-radius","bro","create-verification-skill","deslop","figure-it-out","fix","fix-ci","fix-merge-conflicts","get-pr-comments","how","interrogate","maintain-verification-skill","make-pr-easy-to-review","no-comments","offensive-programming","patina-mode","principle-boundary-discipline","principle-build-the-lever","principle-encode-lessons-in-structure","principle-exhaust-the-design-space","principle-experience-first","principle-fix-root-causes","principle-foundational-thinking","principle-guard-the-context-window","principle-laziness-protocol","principle-make-operations-idempotent","principle-migrate-callers-then-delete-legacy-apis","principle-minimize-reader-load","principle-model-the-domain","principle-never-block-on-the-human","principle-outcome-oriented-execution","principle-prove-it-works","principle-redesign-from-first-principles","principle-separate-before-serializing-shared-state","principle-sequence-verifiable-units","principle-subtract-before-you-add","principle-type-system-discipline","recall","reflect","running-mobile-simulators","setup-engineering","show-me-your-work","swarm","tdd","teach","technical-writing","thermo-nuclear-code-quality-review","typescript-best-practices","unslop","what-did-i-get-done","why","working-on-issue"]'
expected_engineering_prompts='["architect","arena","automate-me","babysit","blast-radius","bro","create-verification-skill","deslop","figure-it-out","fix-ci","fix-merge-conflicts","get-pr-comments","how","interrogate","maintain-verification-skill","make-pr-easy-to-review","no-comments","patina-mode","recall","reflect","setup-engineering","show-me-your-work","swarm","tdd","teach","technical-writing","thermo-nuclear-code-quality-review","typescript-best-practices","unslop","what-did-i-get-done","why"]'
expected_engineering_agents='["comment-sicko","patina-agent"]'
retired_marketplace_skills='write-docs|new-issue|edit-issue|review-action|office-hours|plan-ceo-review|superteam|superteam-non-interactive|email-triage|review-branch|improve-branch-architecture|harden-branch|polish-branch|working-on-github-issue|write-release-changelog|resolve-qa-feedback'

read_frontmatter_field() {
  local file="$1"
  local field="$2"

  awk -F ': *' -v field="$field" '
    NR == 1 && $0 == "---" { in_frontmatter = 1; next }
    in_frontmatter && $0 == "---" { exit }
    in_frontmatter && $1 == field {
      sub(/^[^:]+: */, "")
      print
      exit
    }
  ' "$file"
}

# Validate the Claude Code marketplace catalog.
test -f .claude-plugin/marketplace.json
test -f .claude-plugin/plugin.json
m_name=$(jq -r '.name' .claude-plugin/marketplace.json)
p_name=$(jq -r '.name' .claude-plugin/plugin.json)
mp_names=$(jq -c '[.plugins[].name]' .claude-plugin/marketplace.json)
test "$m_name" = "patinaproject-skills"
test "$p_name" = "patinaproject-skills"
test "$mp_names" = '["patinaproject-skills","engineering"]'
test "$(jq -r '.plugins[] | select(.name == "engineering") | .source' .claude-plugin/marketplace.json)" = './plugins/engineering'
test -f plugins/engineering/.claude-plugin/plugin.json
test "$(jq -r '.name' plugins/engineering/.claude-plugin/plugin.json)" = 'engineering'
test "$(jq -c '.dependencies' plugins/engineering/.claude-plugin/plugin.json)" = '["patinaproject-skills"]'
test -f plugins/engineering/agents/patina-agent.md
test -f plugins/engineering/hooks/hooks.json
test -f plugins/engineering/models.json
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
if jq -r '.skills[]' .claude-plugin/plugin.json | grep -Eq "$retired_marketplace_skills"; then
  echo "FAIL: retired skills must not appear in .claude-plugin/plugin.json skills[]" >&2
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
cmp_names=$(jq -c '[.plugins[].name]' .agents/plugins/marketplace.json)
test "$cm_name" = "patinaproject-skills"
test "$cp_name" = "patinaproject-skills"
test "$cmp_names" = '["patinaproject-skills","engineering"]'
test "$(jq -r '.plugins[] | select(.name == "engineering") | .source.path' .agents/plugins/marketplace.json)" = './plugins/engineering'
test -f plugins/engineering/.codex-plugin/plugin.json
test "$(jq -r '.name' plugins/engineering/.codex-plugin/plugin.json)" = 'engineering'
test "$(jq -r '.skills' plugins/engineering/.codex-plugin/plugin.json)" = './skills/'
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
if jq -r '.skills[]' .codex-plugin/plugin.json | grep -Eq "$retired_marketplace_skills"; then
  echo "FAIL: retired skills must not appear in .codex-plugin/plugin.json skills[]" >&2
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
if [ "$claude_skills" != "$expected_marketplace_skills" ]; then
  echo "FAIL: marketplace skills[] did not match expected shipped catalog" >&2
  echo "  Expected: $expected_marketplace_skills" >&2
  echo "  Actual:   $claude_skills" >&2
  exit 1
fi

engineering_skills="$({
  find plugins/engineering/skills -mindepth 2 -maxdepth 2 -name SKILL.md -print
} | sed 's#plugins/engineering/skills/##; s#/SKILL.md##' | sort | jq -Rsc 'split("\n") | map(select(length > 0))')"
if [ "$engineering_skills" != "$expected_engineering_skills" ]; then
  echo "FAIL: Engineering skills did not match expected catalog" >&2
  echo "  Expected: $expected_engineering_skills" >&2
  echo "  Actual:   $engineering_skills" >&2
  exit 1
fi

for skill_file in plugins/engineering/skills/*/SKILL.md; do
  skill_name="$(basename "$(dirname "$skill_file")")"
  test "$(read_frontmatter_field "$skill_file" name)" = "$skill_name"
done

engineering_prompts="$({
  find plugins/engineering/.codex-plugin/prompts -mindepth 1 -maxdepth 1 -name '*.md' -print
} | sed 's#.*/##; s/\.md$//' | sort | jq -Rsc 'split("\n") | map(select(length > 0))')"
test "$engineering_prompts" = "$expected_engineering_prompts"
for prompt_file in plugins/engineering/.codex-plugin/prompts/*.md; do
  prompt_name="$(basename "$prompt_file" .md)"
  test "$(read_frontmatter_field "$prompt_file" name)" = "$prompt_name"
done

engineering_agents="$({
  find plugins/engineering/agents -mindepth 1 -maxdepth 1 -name '*.md' -print
} | sed 's#.*/##; s/\.md$//' | sort | jq -Rsc 'split("\n") | map(select(length > 0))')"
test "$engineering_agents" = "$expected_engineering_agents"
for agent_file in plugins/engineering/agents/*.md; do
  agent_name="$(basename "$agent_file" .md)"
  test "$(read_frontmatter_field "$agent_file" name)" = "$agent_name"
done

test -f plugins/engineering/LICENSE.pstack
test "$(jq -r '.source' plugins/engineering/upstream.json)" = 'https://github.com/michael-denyer/pstack-claude'
test "$(jq -r '.version' plugins/engineering/upstream.json)" = '0.9.15'
test "$(jq -r '.transforms.skills["poteto-mode"]' plugins/engineering/upstream.json)" = 'patina-mode'
test "$(jq -r '.transforms.skills["setup-pstack"]' plugins/engineering/upstream.json)" = 'setup-engineering'
test "$(jq -r '.transforms.agents["poteto-agent"]' plugins/engineering/upstream.json)" = 'patina-agent'

if rg --hidden -n 'pstack:|poteto-mode|poteto-agent|setup-pstack|pstack-models\.md' plugins/engineering \
  --glob '!upstream.json'; then
  echo "FAIL: Engineering contains an obsolete upstream runtime identity" >&2
  exit 1
fi

test "$(find plugins/engineering -type f -not -path '*/node_modules/*' | wc -l | tr -d ' ')" = '182'
test "$(find plugins/engineering/skills/patina-mode -type f -not -path '*/node_modules/*' | wc -l | tr -d ' ')" = '46'
engineering_executables="$(find plugins/engineering -type f -perm -111 -print | sort)"
expected_engineering_executables="$(printf '%s\n' \
  plugins/engineering/hooks/run-hook.cmd \
  plugins/engineering/hooks/session-start \
  plugins/engineering/skills/patina-mode/scripts/orch/orch.ts \
  plugins/engineering/skills/patina-mode/scripts/watch-pr/watch-pr \
  plugins/engineering/skills/patina-mode/scripts/worktree-audit.sh \
  plugins/engineering/skills/show-me-your-work/scripts/log.sh | sort)"
test "$engineering_executables" = "$expected_engineering_executables"

test "$(read_frontmatter_field skills/develop/SKILL.md disable-model-invocation)" = 'true'
test "$(read_frontmatter_field plugins/engineering/skills/fix/SKILL.md disable-model-invocation)" = 'true'
test -n "$(read_frontmatter_field plugins/engineering/skills/running-mobile-simulators/SKILL.md description)"
test -z "$(read_frontmatter_field plugins/engineering/skills/running-mobile-simulators/SKILL.md disable-model-invocation)"

unexpected_lock_entries="$(
  jq -r '
    .skills
    | to_entries[]
    | select(
        (.value.source != "mattpocock/skills")
        and (.key != "find-skills" or .value.source != "vercel-labs/skills")
      )
    | "\(.key): \(.value.source)"
  ' skills-lock.json
)"
if [ -n "$unexpected_lock_entries" ]; then
  echo "FAIL: skills-lock.json may only keep mattpocock/skills entries plus find-skills" >&2
  printf '%s\n' "$unexpected_lock_entries" >&2
  exit 1
fi

# Assert the two version fields stay in lockstep. Each host stores the
# marketplace version in a different file per its own schema:
#   Claude: .claude-plugin/marketplace.json metadata.version
#   Codex:  .codex-plugin/plugin.json version
# release-please bumps both via extra-files; this check catches manual drift.
claude_version=$(jq -r '.metadata.version' .claude-plugin/marketplace.json)
codex_version=$(jq -r '.version' .codex-plugin/plugin.json)
engineering_claude_version=$(jq -r '.version' plugins/engineering/.claude-plugin/plugin.json)
engineering_codex_version=$(jq -r '.version' plugins/engineering/.codex-plugin/plugin.json)
if [ "$claude_version" != "$codex_version" ]; then
  echo "FAIL: Claude metadata.version ($claude_version) != Codex plugin.json version ($codex_version)" >&2
  exit 1
fi
if [ "$claude_version" != "$engineering_claude_version" ] || [ "$claude_version" != "$engineering_codex_version" ]; then
  echo "FAIL: Engineering plugin versions do not match marketplace version $claude_version" >&2
  exit 1
fi

echo "OK: marketplace catalogs validated (Claude + Codex), version $claude_version"
