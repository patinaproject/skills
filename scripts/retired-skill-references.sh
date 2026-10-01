#!/usr/bin/env bash
set -euo pipefail

retired_marketplace_skills='write-docs|new-issue|edit-issue|review-action|office-hours|plan-ceo-review|superteam|superteam-non-interactive|email-triage|review-branch|improve-branch-architecture|harden-branch|polish-branch|working-on-github-issue|write-release-changelog|resolve-qa-feedback|develop|develop-with-workflow|ready-pr|finish-pr|merge-pr|polish|fix|orchestrate|codex-pr-feedback-loop|prompting-fable|offensive-programming|move-branch-here|running-mobile-simulators|working-on-issue|write-changelog|new-branch|update-branch|writing-for-patina-mode|grill-to-spec'

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  published_skill_names="$({
    jq -r '.skills[]' .claude-plugin/plugin.json | sed -E 's#^\./skills/##'
    find plugins/engineering/skills -mindepth 1 -maxdepth 1 -type d | sed 's#.*/##'
  } | sort -u)"
  retired_skill_names="$(printf '%s\n' "$retired_marketplace_skills" | tr '|' '\n')"
  active_skill_files="$({
    find skills plugins/engineering/skills -type f -name '*.md' \
      ! -iname '*changelog*.md' \
      ! -path '*/docs/adr/*'
  } | sort)"
  failed=0

  while IFS= read -r skill_file; do
    [ -n "$skill_file" ] || continue
    while IFS= read -r retired_name; do
      [ -n "$retired_name" ] || continue
      if printf '%s\n' "$published_skill_names" | grep -Fqx "$retired_name"; then
        continue
      fi

      reference_pattern="(^|[^[:alnum:]_-])(/${retired_name}([^[:alnum:]_-]|$)|(engineering|patinaproject-skills):${retired_name}([^[:alnum:]_-]|$)|${retired_name}[^[:alnum:]_-]+skill|<${retired_name}(-skill)?-directory>)"
      stale_reference="$(grep -inE "$reference_pattern" "$skill_file" || true)"
      if [ -n "$stale_reference" ]; then
        printf 'FAIL: active skill references retired skill %s in %s\n' "$retired_name" "$skill_file" >&2
        printf '%s\n' "$stale_reference" >&2
        failed=1
      fi
    done <<< "$retired_skill_names"

    stale_helper="$(grep -inE 'review-state\.mjs' "$skill_file" || true)"
    if [ -n "$stale_helper" ]; then
      printf 'FAIL: active skill references retired review-state.mjs in %s\n' "$skill_file" >&2
      printf '%s\n' "$stale_helper" >&2
      failed=1
    fi
  done <<< "$active_skill_files"

  if [ "$failed" -ne 0 ]; then
    exit 1
  fi
  echo 'OK: active skills contain no executable references to retired skills'
fi
