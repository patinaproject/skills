#!/usr/bin/env bash
set -euo pipefail

expected_marketplace_skills='["./skills/scaffold-repository","./skills/using-github","./skills/install-skills","./skills/grill-to-spec","./skills/design-by-contract","./skills/grill-system-design","./skills/review-system-design"]'
expected_engineering_skills='["architect","arena","automate-me","babysit","blast-radius","bro","create-verification-skill","deslop","figure-it-out","fix-ci","fix-merge-conflicts","gather-evidence","get-pr-comments","how","interrogate","maintain-verification-skill","make-pr-easy-to-review","move-branch-here","no-comments","patina-mode","principle-boundary-discipline","principle-build-the-lever","principle-encode-lessons-in-structure","principle-exhaust-the-design-space","principle-experience-first","principle-fix-root-causes","principle-foundational-thinking","principle-guard-the-context-window","principle-laziness-protocol","principle-make-operations-idempotent","principle-migrate-callers-then-delete-legacy-apis","principle-minimize-reader-load","principle-model-the-domain","principle-never-block-on-the-human","principle-offensive-programming","principle-outcome-oriented-execution","principle-prove-it-works","principle-redesign-from-first-principles","principle-separate-before-serializing-shared-state","principle-sequence-verifiable-units","principle-subtract-before-you-add","principle-type-system-discipline","recall","reflect","running-mobile-simulators","setup-engineering","setup-pstack","show-me-your-work","swarm","tdd","teach","technical-writing","thermo-nuclear-code-quality-review","typescript-best-practices","unslop","what-did-i-get-done","why","working-on-issues"]'
expected_engineering_prompts='["setup-engineering"]'
expected_engineering_agents='["comment-sicko","patina-agent","pstack-fable-high","pstack-fable-low","pstack-fable-max","pstack-fable-medium","pstack-fable-xhigh","pstack-opus-high","pstack-opus-low","pstack-opus-max","pstack-opus-medium","pstack-opus-xhigh"]'
retired_marketplace_skills='write-docs|new-issue|edit-issue|review-action|office-hours|plan-ceo-review|superteam|superteam-non-interactive|email-triage|review-branch|improve-branch-architecture|harden-branch|polish-branch|working-on-github-issue|write-release-changelog|resolve-qa-feedback|develop|develop-with-workflow|ready-pr|finish-pr|merge-pr|polish|fix|orchestrate|codex-pr-feedback-loop|prompting-fable|offensive-programming|move-branch-here|running-mobile-simulators|working-on-issue|write-changelog|new-branch|update-branch'

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
test "$(jq -c '.dependencies // []' plugins/engineering/.claude-plugin/plugin.json)" = '[]'
test -f plugins/engineering/agents/patina-agent.md
test -f plugins/engineering/hooks/hooks.json
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
test "$(jq -r '.source' plugins/engineering/upstream.json)" = 'https://github.com/ericlitman/open-pstack'
test "$(jq -r '.ref' plugins/engineering/upstream.json)" = 'main'
test "$(jq -r '.transforms.skills["poteto-mode"]' plugins/engineering/upstream.json)" = 'patina-mode'
test "$(jq -r '.transforms.agents["poteto-agent"]' plugins/engineering/upstream.json)" = 'patina-agent'

obsolete_runtime_metadata="$(
  jq -r '.. | strings' \
    plugins/engineering/.claude-plugin/plugin.json \
    plugins/engineering/.codex-plugin/plugin.json \
    plugins/engineering/hooks/hooks.json |
    grep -E 'pstack:|poteto-mode|poteto-agent|pstack-models\.md' || true
)"
if [ -n "$obsolete_runtime_metadata" ]; then
  echo "FAIL: Engineering runtime metadata contains an obsolete upstream identity" >&2
  printf '%s\n' "$obsolete_runtime_metadata" >&2
  exit 1
fi

for forbidden_path in \
  plugins/engineering/skills/poteto-mode \
  plugins/engineering/agents/poteto-agent.md \
  plugins/engineering/pstack-models.md; do
  if [ -e "$forbidden_path" ]; then
    echo "FAIL: obsolete upstream runtime path remains: $forbidden_path" >&2
    exit 1
  fi
done

for skill_dir in plugins/engineering/skills/*; do
  if [ ! -f "$skill_dir/SKILL.md" ]; then
    echo "FAIL: Engineering skill directory lacks SKILL.md: $skill_dir" >&2
    exit 1
  fi
done

tools_package="plugins/engineering/skills/patina-mode/scripts/package.json"
if ! jq -e \
  '[((.dependencies // {}) + (.devDependencies // {}))[] | test("^[0-9]+\\.[0-9]+\\.[0-9]+$")] | all' \
  "$tools_package" >/dev/null; then
  echo "FAIL: patina-mode tooling dependencies must use exact semantic versions" >&2
  exit 1
fi

engineering_executables="$(find plugins/engineering -type f -perm -111 -not -path '*/node_modules/*' -print | sort)"
expected_engineering_executables="$(printf '%s\n' \
  plugins/engineering/hooks/run-hook.cmd \
  plugins/engineering/hooks/session-start \
  plugins/engineering/skills/move-branch-here/scripts/worktree-context.sh \
  plugins/engineering/skills/patina-mode/scripts/check-plan.mjs \
  plugins/engineering/skills/patina-mode/scripts/orch/orch.ts \
  plugins/engineering/skills/patina-mode/scripts/runner/pstack-runner \
  plugins/engineering/skills/patina-mode/scripts/watch-pr/watch-pr \
  plugins/engineering/skills/patina-mode/scripts/worktree-audit.sh \
  plugins/engineering/skills/setup-engineering/scripts/install-machinery.sh \
  plugins/engineering/skills/show-me-your-work/scripts/log.sh | sort)"
test "$engineering_executables" = "$expected_engineering_executables"

test -n "$(read_frontmatter_field plugins/engineering/skills/gather-evidence/SKILL.md description)"
test -z "$(read_frontmatter_field plugins/engineering/skills/gather-evidence/SKILL.md disable-model-invocation)"
test "$(read_frontmatter_field plugins/engineering/skills/principle-offensive-programming/SKILL.md user-invocable)" = 'false'
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
