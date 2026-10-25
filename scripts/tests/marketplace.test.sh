#!/usr/bin/env bash
set -euo pipefail

expected_code_skills='["architect","arena","automate-me","babysit","benchmark-checklist","blast-radius","bro","code-review","correct","create-verification-skill","deslop","figure-it-out","fix-ci","fix-merge-conflicts","gather-evidence","get-pr-comments","how","interrogate","maintain-verification-skill","make-pr-easy-to-review","move-branch-here","move-session-here","no-comments","patina-help","patina-mode","pr","pr-readiness","principle-attack-the-premise","principle-boundary-discipline","principle-build-the-lever","principle-encode-lessons-in-structure","principle-exhaust-the-design-space","principle-experience-first","principle-explain-the-number","principle-fix-root-causes","principle-foundational-thinking","principle-guard-the-context-window","principle-laziness-protocol","principle-make-operations-idempotent","principle-migrate-callers-then-delete-legacy-apis","principle-minimize-reader-load","principle-model-the-domain","principle-never-block-on-the-human","principle-offensive-programming","principle-outcome-oriented-execution","principle-prove-it-works","principle-redesign-from-first-principles","principle-separate-before-serializing-shared-state","principle-sequence-verifiable-units","principle-subtract-before-you-add","principle-test-behavior-not-implementation","principle-type-system-discipline","recall","reflect","running-mobile-simulators","setup-code-skills","setup-pstack","show-me-your-work","swarm","tdd","teach","technical-writing","thermo-nuclear-code-quality-review","typescript-best-practices","unslop","what-did-i-get-done","why","working-on-issues"]'
expected_work_skills='["ask-matt","cloud-storage-organization","codebase-design","design-by-contract","design-control-loop","diagnosing-bugs","domain-modeling","draft-user-follow-ups","email-inbox-triage","grill-me","grill-system-design","grill-to-spec","grilling","handoff","implement","implement-spec","improve-codebase-architecture","install-skills","linear-inbox-cleanup","pr-review-assistant","prototype","research","retro","review-system-design","scaffold-repository","setup-work-skills","show-me","to-questionnaire","to-spec","to-tickets","triage","tutor","update-branch","using-github","wait-what","wayfinder","wizard","writing-for-agents","writing-for-pstack"]'
expected_code_agents='["comment-sicko","patina-agent"]'
retired_marketplace_skills='write-docs|new-issue|edit-issue|review-action|office-hours|plan-ceo-review|superteam|superteam-non-interactive|email-triage|gmail-inbox-triage|review-branch|improve-branch-architecture|harden-branch|polish-branch|working-on-github-issue|write-release-changelog|resolve-qa-feedback|develop|develop-with-workflow|ready-pr|finish-pr|merge-pr|polish|fix|orchestrate|codex-pr-feedback-loop|prompting-fable|offensive-programming|move-branch-here|running-mobile-simulators|working-on-issue|write-changelog|new-branch|writing-for-patina-mode|work:to-issue|to-issue|cloud-storage-organizer'
retired_plugins='patinaproject-skills'

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
m_name=$(jq -r '.name' .claude-plugin/marketplace.json)
mp_names=$(jq -c '[.plugins[].name]' .claude-plugin/marketplace.json)
test "$m_name" = "patinaproject-skills"
test "$mp_names" = '["code","work"]'
# Claude Code documents only these metadata keys; the desktop app can reject the
# manifest for any other, while the CLI only warns.
test "$(jq -c '(.metadata // {}) | keys - ["description","pluginRoot","version"]' .claude-plugin/marketplace.json)" = '[]'
test "$(jq -r '.plugins[] | select(.name == "code") | .source' .claude-plugin/marketplace.json)" = './plugins/code'
test "$(jq -r '.plugins[] | select(.name == "work") | .source' .claude-plugin/marketplace.json)" = './plugins/work'
test -f plugins/work/.claude-plugin/plugin.json
test "$(jq -r '.name' plugins/work/.claude-plugin/plugin.json)" = 'work'
test "$(jq -c '.dependencies // []' plugins/work/.claude-plugin/plugin.json)" = '[]'
test ! -e plugins/work/agents
test ! -e plugins/work/hooks
duplicate_skill_names="$(find plugins/*/skills -mindepth 1 -maxdepth 1 -type d -print | sed 's#.*/##' | sort | uniq -d)"
if [ -n "$duplicate_skill_names" ]; then
  echo "FAIL: skill directory names must be unique across plugins/*/skills; the monorepo Skills Sync installs every plugin into one flat namespace. Duplicates:" >&2
  echo "$duplicate_skill_names" >&2
  exit 1
fi
work_skills="$(find plugins/work/skills -mindepth 2 -maxdepth 2 -name SKILL.md -print | sed 's#plugins/work/skills/##; s#/SKILL.md##' | sort | jq -Rsc 'split("\n") | map(select(length > 0))')"
test "$work_skills" = "$expected_work_skills"
test "$(jq -r '.sources[] | select(.name == "humanlayer") | .targets[0].destination' upstream-skills.json)" = 'plugins/work/skills/show-me'
test -z "$(jq -r '.skills["show-me"] // empty' skills-lock.json)"
test "$(jq -r '.name' plugins/code/.claude-plugin/plugin.json)" = 'code'
test "$(jq -c '.dependencies // []' plugins/code/.claude-plugin/plugin.json)" = '[]'
test -f plugins/code/agents/patina-agent.md
test -f plugins/code/hooks/hooks.json
test ! -e .claude-plugin/plugin.json
test ! -e .codex-plugin/plugin.json
test ! -e skills
for retired_plugin in $retired_plugins; do
  if jq -e --arg name "$retired_plugin" '.plugins[] | select(.name == $name)' .claude-plugin/marketplace.json .agents/plugins/marketplace.json >/dev/null; then
    echo "FAIL: retired plugin $retired_plugin must not appear in a marketplace catalog" >&2
    exit 1
  fi
done

if printf '%s\n' "$work_skills" | jq -r '.[]' | grep -Eqx "$retired_marketplace_skills"; then
  echo "FAIL: retired skills must not appear in the Work plugin" >&2
  exit 1
fi

# Validate the Codex marketplace catalog.
# Codex's convention is asymmetric to Claude's: the plugin manifest lives at
# .codex-plugin/plugin.json (parallel to .claude-plugin/plugin.json), but the
# marketplace catalog lives at .agents/plugins/marketplace.json (NOT .codex-plugin/).
test -f .agents/plugins/marketplace.json
cm_name=$(jq -r '.name' .agents/plugins/marketplace.json)
cmp_names=$(jq -c '[.plugins[].name]' .agents/plugins/marketplace.json)
test "$cm_name" = "patinaproject-skills"
test "$cmp_names" = '["code","work"]'
test "$(jq -r '.plugins[] | select(.name == "code") | .source.path' .agents/plugins/marketplace.json)" = './plugins/code'
test -f plugins/code/.codex-plugin/plugin.json
test "$(jq -r '.plugins[] | select(.name == "work") | .source.path' .agents/plugins/marketplace.json)" = './plugins/work'
test "$(jq -r '.name' plugins/work/.codex-plugin/plugin.json)" = 'work'
test "$(jq -r '.skills' plugins/work/.codex-plugin/plugin.json)" = './skills/'
test "$(jq -r '.name' plugins/code/.codex-plugin/plugin.json)" = 'code'
test "$(jq -r '.skills' plugins/code/.codex-plugin/plugin.json)" = './skills/'
code_skills="$({
  find plugins/code/skills -mindepth 2 -maxdepth 2 -name SKILL.md -print
} | sed 's#plugins/code/skills/##; s#/SKILL.md##' | sort | jq -Rsc 'split("\n") | map(select(length > 0))')"
if [ "$code_skills" != "$expected_code_skills" ]; then
  echo "FAIL: Code skills did not match expected catalog" >&2
  echo "  Expected: $expected_code_skills" >&2
  echo "  Actual:   $code_skills" >&2
  exit 1
fi

for skill_file in plugins/code/skills/*/SKILL.md; do
  skill_name="$(basename "$(dirname "$skill_file")")"
  test "$(read_frontmatter_field "$skill_file" name)" = "$skill_name"
done

# pstack-claude ships Codex prompt stubs. Each stub's frontmatter name must
# match its filename so the slash command resolves to the skill it names.
if [ ! -d plugins/code/.codex-plugin/prompts ]; then
  echo "FAIL: plugins/code/.codex-plugin/prompts must exist (pstack-claude ships Codex prompt stubs)" >&2
  exit 1
fi
for prompt_file in plugins/code/.codex-plugin/prompts/*.md; do
  prompt_name="$(basename "$prompt_file" .md)"
  test "$(read_frontmatter_field "$prompt_file" name)" = "$prompt_name"
done

code_agents="$({
  find plugins/code/agents -mindepth 1 -maxdepth 1 -name '*.md' -print
} | sed 's#.*/##; s/\.md$//' | sort | jq -Rsc 'split("\n") | map(select(length > 0))')"
test "$code_agents" = "$expected_code_agents"
for agent_file in plugins/code/agents/*.md; do
  agent_name="$(basename "$agent_file" .md)"
  test "$(read_frontmatter_field "$agent_file" name)" = "$agent_name"
done

test -f plugins/code/LICENSE.pstack
test "$(jq -r '.sources | length' upstream-skills.json)" = '3'
test "$(jq -r '.sources[] | select(.name == "pstack") | .repo' upstream-skills.json)" = 'https://github.com/michael-denyer/pstack-claude.git'
test "$(jq -r '.sources[] | select(.name == "pstack") | .transforms.rename["poteto-mode"]' upstream-skills.json)" = 'patina-mode'
test "$(jq -r '.sources[] | select(.name == "mattpocock") | .targets[] | select(.destination == "plugins/code/skills/code-review") | .source' upstream-skills.json)" = 'skills/engineering/code-review'
test -z "$(jq -r '.sources[] | select(.name == "mattpocock") | .targets[] | select(.destination == "plugins/work/skills/code-review" or .destination == "plugins/work/skills/tdd" or .destination == "plugins/work/skills/teach") | .destination' upstream-skills.json)"
test "$(jq -r '.sources[] | select(.name == "mattpocock") | .targets[] | select(.destination == "plugins/work/skills/tutor") | .source' upstream-skills.json)" = 'skills/productivity/teach'
test ! -e plugins/code/upstream.json

obsolete_runtime_metadata="$(
  jq -r '.. | strings' \
    plugins/code/.claude-plugin/plugin.json \
    plugins/code/.codex-plugin/plugin.json \
    plugins/code/hooks/hooks.json |
    grep -E 'pstack:|poteto-mode|poteto-agent|pstack-models\.md' || true
)"
if [ -n "$obsolete_runtime_metadata" ]; then
  echo "FAIL: Code runtime metadata contains an obsolete upstream identity" >&2
  printf '%s\n' "$obsolete_runtime_metadata" >&2
  exit 1
fi

for forbidden_path in \
  plugins/code/skills/poteto-mode \
  plugins/code/agents/poteto-agent.md \
  plugins/code/pstack-models.md; do
  if [ -e "$forbidden_path" ]; then
    echo "FAIL: obsolete upstream runtime path remains: $forbidden_path" >&2
    exit 1
  fi
done

for skill_dir in plugins/code/skills/*; do
  if [ ! -f "$skill_dir/SKILL.md" ]; then
    echo "FAIL: Code skill directory lacks SKILL.md: $skill_dir" >&2
    exit 1
  fi
done

tools_package="plugins/code/skills/patina-mode/scripts/package.json"
if ! jq -e \
  '[((.dependencies // {}) + (.devDependencies // {}))[] | test("^[0-9]+\\.[0-9]+\\.[0-9]+$")] | all' \
  "$tools_package" >/dev/null; then
  echo "FAIL: patina-mode tooling dependencies must use exact semantic versions" >&2
  exit 1
fi

# The Code plugin tracks pstack-claude. Nothing under the plugin, its
# overlays, or its sync tooling may name the previous base or the machinery
# that came only from it. History (CHANGELOG, ADRs) is exempt.
if git grep -q -i -E 'open-pstack|ericlitman|provider-dispatch|pstack-runner' -- \
    plugins/code .claude/agents .agents scripts/sync-upstream-skills.mjs; then
  echo "FAIL: previous upstream base still referenced under the Code plugin or its sync tooling" >&2
  git grep -n -i -E 'open-pstack|ericlitman|provider-dispatch|pstack-runner' -- \
    plugins/code .claude/agents .agents scripts/sync-upstream-skills.mjs >&2
  exit 1
fi
test -f upstream-skills.json

engineering_executables="$(find plugins/code -type f -perm -111 -not -path '*/node_modules/*' -print | sort)"
expected_code_executables="$(printf '%s\n' \
  plugins/code/skills/pr-readiness/scripts/pr-readiness \
  plugins/code/hooks/session-start.sh \
  plugins/code/skills/patina-mode/scripts/orch/orch.ts \
  plugins/code/skills/patina-mode/scripts/watch-pr/ship-pr \
  plugins/code/skills/patina-mode/scripts/watch-pr/watch-pr \
  plugins/code/skills/patina-mode/scripts/worktree-audit.mjs \
  plugins/code/skills/reflect/scripts/find-transcript.mjs \
  plugins/code/skills/running-mobile-simulators/scripts/check-readiness.sh \
  plugins/code/skills/setup-code-skills/scripts/install-machinery.sh \
  plugins/code/skills/setup-pstack/scripts/check-sheet.sh \
  plugins/code/skills/show-me-your-work/scripts/log.sh | sort)"
test "$engineering_executables" = "$expected_code_executables"

test -n "$(read_frontmatter_field plugins/code/skills/gather-evidence/SKILL.md description)"
test -z "$(read_frontmatter_field plugins/code/skills/gather-evidence/SKILL.md disable-model-invocation)"
test "$(read_frontmatter_field plugins/code/skills/principle-offensive-programming/SKILL.md user-invocable)" = 'false'
test -n "$(read_frontmatter_field plugins/code/skills/running-mobile-simulators/SKILL.md description)"
test -z "$(read_frontmatter_field plugins/code/skills/running-mobile-simulators/SKILL.md disable-model-invocation)"

vendored_first_party_skills="$(
  jq -r '
    .skills
    | to_entries[]
    | select(.value.source == "patinaproject/skills")
    | .key
  ' skills-lock.json
)"
if [ -n "$vendored_first_party_skills" ]; then
  echo "FAIL: repo-owned skills must use overlay symlinks instead of skills-lock.json" >&2
  printf '%s\n' "$vendored_first_party_skills" >&2
  exit 1
fi

if jq -e '.skills.implement' skills-lock.json >/dev/null; then
  echo "FAIL: the vendored implement skill conflicts with patina-mode implementation routing" >&2
  exit 1
fi
if jq -e '.skills["to-tickets"]' skills-lock.json >/dev/null; then
  echo "FAIL: repo-owned to-tickets remains in skills-lock.json" >&2
  exit 1
fi
if jq -e '.skills.triage' skills-lock.json >/dev/null; then
  echo "FAIL: repo-owned triage remains in skills-lock.json" >&2
  exit 1
fi
if jq -e '.skills["code-review"]' skills-lock.json >/dev/null; then
  echo "FAIL: repo-owned code-review remains in skills-lock.json" >&2
  exit 1
fi
while IFS= read -r synced_skill; do
  if jq -e --arg name "$synced_skill" '.skills[$name]' skills-lock.json >/dev/null; then
    echo "FAIL: synced skill remains in skills-lock.json: $synced_skill" >&2
    exit 1
  fi
done < <(jq -r '.sources[].targets[] | select(.kind == "skill") | .destination | split("/") | last' upstream-skills.json)
for retired_path in .agents/skills/to-issue .claude/skills/to-issue; do
  if [ -e "$retired_path" ] || [ -L "$retired_path" ]; then
    echo "FAIL: retired to-issue remains installed at $retired_path" >&2
    exit 1
  fi
done

if jq -e '.skills["resolving-merge-conflicts"]' skills-lock.json >/dev/null; then
  echo "FAIL: resolving-merge-conflicts is retired in favor of fix-merge-conflicts" >&2
  exit 1
fi

if [ -e .agents/skills/resolving-merge-conflicts ] ||
  [ -e .claude/skills/resolving-merge-conflicts ]; then
  echo "FAIL: resolving-merge-conflicts must remain absent from skill overlays" >&2
  exit 1
fi

claude_version=$(jq -r '.metadata.version' .claude-plugin/marketplace.json)
engineering_claude_version=$(jq -r '.version' plugins/code/.claude-plugin/plugin.json)
engineering_codex_version=$(jq -r '.version' plugins/code/.codex-plugin/plugin.json)
team_claude_version=$(jq -r '.version' plugins/work/.claude-plugin/plugin.json)
team_codex_version=$(jq -r '.version' plugins/work/.codex-plugin/plugin.json)
if [ "$claude_version" != "$team_claude_version" ] || [ "$claude_version" != "$team_codex_version" ]; then
  echo "FAIL: Work plugin versions do not match marketplace version $claude_version" >&2
  exit 1
fi
if [ "$claude_version" != "$engineering_claude_version" ] || [ "$claude_version" != "$engineering_codex_version" ]; then
  echo "FAIL: Code plugin versions do not match marketplace version $claude_version" >&2
  exit 1
fi

echo "OK: marketplace catalogs validated (Claude + Codex), version $claude_version"
