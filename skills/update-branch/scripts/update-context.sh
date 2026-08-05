#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

current_branch() {
  local branch
  branch="$(git branch --show-current)" || fail "git branch --show-current failed"
  [ -n "$branch" ] || fail "update-branch requires an attached branch; HEAD is detached"
  printf '%s\n' "$branch"
}

open_pull_request() {
  local branch="$1" rows count
  if ! rows="$(gh pr list --state open --head "$branch" \
    --json number,url,baseRefName,headRefName \
    --jq '.[] | [.number, .url, .baseRefName, .headRefName] | @tsv')"; then
    fail "gh pr list --state open --head $branch failed"
  fi

  count="$(printf '%s\n' "$rows" | awk 'NF { count += 1 } END { print count + 0 }')"
  if [ "$count" -gt 1 ]; then
    fail "found $count open pull requests for branch $branch; select one branch context before updating"
  fi

  printf '%s' "$rows"
}

normalize_origin_ref() {
  local ref="$1"
  case "$ref" in
    refs/remotes/origin/*)
      printf 'origin/%s\n' "${ref#refs/remotes/origin/}"
      ;;
    origin/*)
      printf '%s\n' "$ref"
      ;;
    *)
      printf 'origin/%s\n' "$ref"
      ;;
  esac
}

resolve_context() {
  [ "$#" -le 1 ] || fail "resolve accepts at most one optional base ref"

  local explicit_base="${1:-}" branch row pr_number pr_url pr_base pr_head base_ref default_ref
  branch="$(current_branch)"
  row="$(open_pull_request "$branch")"

  if [ -n "$row" ]; then
    IFS=$'\t' read -r pr_number pr_url pr_base pr_head <<< "$row"
    [ -n "$pr_base" ] || fail "open pull request #$pr_number has no target branch"
    base_ref="$(normalize_origin_ref "$pr_base")"
    printf 'pull-request\t%s\t%s\t%s\t%s\t%s\n' \
      "$branch" "$base_ref" "$pr_number" "$pr_url" "$pr_head"
    return
  fi

  if [ -n "$explicit_base" ]; then
    base_ref="$(normalize_origin_ref "$explicit_base")"
  else
    if ! default_ref="$(git symbolic-ref --quiet refs/remotes/origin/HEAD 2>&1)"; then
      echo "FAIL: refs/remotes/origin/HEAD is missing; run git remote set-head origin -a" >&2
      [ -n "$default_ref" ] && printf '%s\n' "$default_ref" >&2
      exit 1
    fi
    base_ref="$(normalize_origin_ref "$default_ref")"
  fi

  printf 'local-only\t%s\t%s\t\t\t\n' "$branch" "$base_ref"
}

push_pull_request() {
  [ "$#" -eq 3 ] || fail "push requires the resolved PR number, base ref, and head ref"

  local expected_number="$1" expected_base expected_head="$3"
  local branch row pr_number pr_url pr_base pr_head actual_base remote merge_ref remote_branch output
  expected_base="$(normalize_origin_ref "$2")"
  branch="$(current_branch)"
  row="$(open_pull_request "$branch")"
  [ -n "$row" ] || fail "no open pull request exists for branch $branch; the no-PR path remains local-only"
  IFS=$'\t' read -r pr_number pr_url pr_base pr_head <<< "$row"
  actual_base="$(normalize_origin_ref "$pr_base")"

  if [ "$pr_number" != "$expected_number" ]; then
    fail "pull request changed from #$expected_number to #$pr_number; rerun update-branch against current context"
  fi
  if [ "$actual_base" != "$expected_base" ]; then
    fail "pull request #$pr_number target changed from ${expected_base#origin/} to ${actual_base#origin/}; rerun update-branch against current context"
  fi
  if [ "$pr_head" != "$expected_head" ]; then
    fail "pull request #$pr_number head changed from $expected_head to $pr_head; rerun update-branch against current context"
  fi

  if ! remote="$(git config --get "branch.$branch.remote")" || [ -z "$remote" ]; then
    fail "branch $branch has no configured push remote"
  fi
  if ! merge_ref="$(git config --get "branch.$branch.merge")" || [ -z "$merge_ref" ]; then
    fail "branch $branch has no configured upstream branch"
  fi
  case "$merge_ref" in
    refs/heads/*)
      remote_branch="${merge_ref#refs/heads/}"
      ;;
    *)
      fail "configured upstream for branch $branch is not a branch ref: $merge_ref"
      ;;
  esac

  if [ "$remote_branch" != "$pr_head" ]; then
    fail "configured upstream $remote/$remote_branch does not match pull request #$pr_number head $pr_head"
  fi

  if ! output="$(git push "$remote" "HEAD:$remote_branch" 2>&1)"; then
    echo "FAIL: git push $remote HEAD:$remote_branch failed" >&2
    printf '%s\n' "$output" >&2
    exit 1
  fi
  [ -n "$output" ] && printf '%s\n' "$output"
  printf 'Updated pull request #%s at %s\n' "$pr_number" "$pr_url"
}

require_conflict_skill() {
  [ "$#" -eq 0 ] || fail "require-conflict-skill accepts no arguments"

  local script_dir skill_dir candidate
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  skill_dir="$(dirname "$script_dir")"

  if [ -n "${UPDATE_BRANCH_SKILLS_DIR:-}" ]; then
    candidate="$UPDATE_BRANCH_SKILLS_DIR/resolving-merge-conflicts/SKILL.md"
    if [ -f "$candidate" ]; then
      printf '%s\n' "$candidate"
      return
    fi
  else
    for candidate in \
      "$skill_dir/../resolving-merge-conflicts/SKILL.md" \
      "$PWD/.agents/skills/resolving-merge-conflicts/SKILL.md" \
      "$PWD/.claude/skills/resolving-merge-conflicts/SKILL.md" \
      "$PWD/skills/resolving-merge-conflicts/SKILL.md"
    do
      if [ -f "$candidate" ]; then
        printf '%s\n' "$candidate"
        return
      fi
    done
  fi

  fail "resolving-merge-conflicts is unavailable; install it with: npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@resolving-merge-conflicts -y"
}

case "${1:-}" in
  resolve)
    shift
    resolve_context "$@"
    ;;
  push)
    shift
    push_pull_request "$@"
    ;;
  require-conflict-skill)
    shift
    require_conflict_skill "$@"
    ;;
  *)
    fail "usage: update-context.sh {resolve [base-ref]|push <pr-number> <base-ref> <head-ref>|require-conflict-skill}"
    ;;
esac
