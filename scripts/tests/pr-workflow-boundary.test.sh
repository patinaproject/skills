#!/usr/bin/env bash
set -euo pipefail

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

test -f skills/ready-pr/SKILL.md
test -f skills/ready-pr/workflows/ready-for-merge.md
test -f skills/ready-pr/workflows/triage.md
test -f skills/merge-pr/SKILL.md
test -f skills/merge-pr/workflows/enable-auto-merge.md
test -f skills/finish-pr/SKILL.md
test ! -d skills/finish-pr/workflows
test "$(find skills/ready-pr/workflows -type f | wc -l | tr -d '[:space:]')" = '2'
test "$(find skills/merge-pr/workflows -type f | wc -l | tr -d '[:space:]')" = '1'

test "$(read_frontmatter_field skills/ready-pr/SKILL.md name)" = 'ready-pr'
test "$(read_frontmatter_field skills/merge-pr/SKILL.md name)" = 'merge-pr'
test "$(read_frontmatter_field skills/finish-pr/SKILL.md name)" = 'finish-pr'
test -z "$(read_frontmatter_field skills/ready-pr/SKILL.md disable-model-invocation)"
test -z "$(read_frontmatter_field skills/merge-pr/SKILL.md disable-model-invocation)"
test "$(read_frontmatter_field skills/finish-pr/SKILL.md disable-model-invocation)" = 'true'

echo 'OK: ready-pr owns readiness, merge-pr owns merge intent, and finish-pr is a compatibility shim'
