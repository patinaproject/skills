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
  local branch="$1" rows count remote expected_repo expected_name matches=""
  local pr_number pr_url pr_base pr_head pr_head_repo normalized_head_repo
  if ! rows="$(gh pr list --state open --head "$branch" \
    --json number,url,baseRefName,headRefName,headRepository \
    --jq '.[] | [.number, .url, .baseRefName, .headRefName, (.headRepository.nameWithOwner // "-")] | @tsv')"; then
    fail "gh pr list --state open --head $branch failed"
  fi

  count="$(printf '%s\n' "$rows" | awk 'NF { count += 1 } END { print count + 0 }')"
  if [ "$count" -gt 1 ]; then
    remote="$(git config --get "branch.$branch.remote")" ||
      fail "branch $branch has no configured push remote"
    expected_repo="$(remote_identity --push "$remote")" ||
      fail "cannot identify a single push destination for $remote"
    expected_name="${expected_repo#*/}"

    while IFS=$'\t' read -r pr_number pr_url pr_base pr_head pr_head_repo; do
      [ "$pr_head_repo" != "-" ] || fail "cannot identify pull request head repository"
      normalized_head_repo="$(printf '%s' "$pr_head_repo" | tr '[:upper:]' '[:lower:]')"
      [ "$normalized_head_repo" = "$expected_name" ] || continue
      [ -z "$matches" ] || matches+=$'\n'
      matches+="$pr_number"$'\t'"$pr_url"$'\t'"$pr_base"$'\t'"$pr_head"$'\t'"$pr_head_repo"
    done <<< "$rows"

    rows="$matches"
    count="$(printf '%s\n' "$rows" | awk 'NF { count += 1 } END { print count + 0 }')"
    [ "$count" -gt 0 ] ||
      fail "open pull requests for branch $branch do not match push remote $remote repository $expected_repo"
  fi
  if [ "$count" -gt 1 ]; then
    fail "found $count open pull requests for branch $branch; select one branch context before updating"
  fi

  printf '%s' "$rows"
}

repository_identity() {
  local url="${1%.git}" host path
  if [[ "$url" =~ ^https?://([^/]+)/([^/]+/[^/]+)$ ]]; then
    host="${BASH_REMATCH[1]}" path="${BASH_REMATCH[2]}"
  elif [[ "$url" =~ ^ssh://git@([^/]+)/([^/]+/[^/]+)$ ]]; then
    host="${BASH_REMATCH[1]}" path="${BASH_REMATCH[2]}"
  elif [[ "$url" =~ ^git@([^:]+):([^/]+/[^/]+)$ ]]; then
    host="${BASH_REMATCH[1]}" path="${BASH_REMATCH[2]}"
  else
    return 1
  fi
  printf '%s/%s\n' "$host" "$path" | tr '[:upper:]' '[:lower:]'
}

read_pull_request() {
  IFS=$'\t' read -r pr_number pr_url pr_base pr_head pr_head_repo <<< "$1"
  pr_base_repo="$(repository_identity "${pr_url%/pull/*}")" ||
    fail "cannot identify pull request base repository"
  pr_head_repo="$(repository_identity "https://${pr_base_repo%%/*}/$pr_head_repo")" ||
    fail "cannot identify pull request head repository"
}

remote_identity() {
  local url
  url="$(git remote get-url "$@" --all)" || return 1
  repository_identity "$url"
}

base_remote() {
  local expected="$1" remote identity match=""
  identity="$(remote_identity origin 2>/dev/null)" || identity=""
  if [ "$identity" = "$expected" ]; then
    printf 'origin\n'
    return
  fi
  while IFS= read -r remote; do
    identity="$(remote_identity "$remote")" || continue
    [ "$identity" = "$expected" ] || continue
    [ -z "$match" ] || fail "multiple remotes match pull request base repository $expected"
    match="$remote"
  done < <(git remote)
  [ -n "$match" ] || fail "no fetch remote matches pull request base repository $expected"
  printf '%s\n' "$match"
}

validate_remotes() {
  local branch="$1" base_ref="$2" base_repo="$3" head_repo="$4" head_ref="$5"
  local remote merge_ref identity
  identity="$(remote_identity "${base_ref%%/*}")" || fail "cannot identify base fetch remote"
  [ "$identity" = "$base_repo" ] || fail "base fetch remote does not match pull request base repository $base_repo"
  remote="$(git config --get "branch.$branch.remote")" || fail "branch $branch has no configured push remote"
  merge_ref="$(git config --get "branch.$branch.merge")" || fail "branch $branch has no configured upstream branch"
  [ "$merge_ref" = "refs/heads/$head_ref" ] ||
    fail "configured upstream for branch $branch does not match pull request head $head_ref"
  identity="$(remote_identity --push "$remote")" || fail "cannot identify a single push destination for $remote"
  [ "$identity" = "$head_repo" ] || fail "push remote $remote does not match pull request head repository $head_repo"
  printf '%s\n' "$remote"
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

validate_pull_request_context() {
  local row="$1" branch="$2" expected_number="$3" expected_base="$4" expected_head="$5"
  local expected_base_repo="$6" expected_head_repo="$7"
  local pr_number pr_url pr_base pr_head pr_base_repo pr_head_repo actual_base
  [ -n "$row" ] || fail "no open pull request exists for branch $branch; the no-PR path remains local-only"
  read_pull_request "$row"
  actual_base="${expected_base%%/*}/$pr_base"

  if [ "$pr_number" != "$expected_number" ]; then
    fail "pull request changed from #$expected_number to #$pr_number; rerun update-branch against current context"
  fi
  if [ "$actual_base" != "$expected_base" ]; then
    fail "pull request #$pr_number target changed from ${expected_base#*/} to $pr_base; rerun update-branch against current context"
  fi
  [ "$pr_base_repo" = "$expected_base_repo" ] && [ "$pr_head_repo" = "$expected_head_repo" ] ||
    fail "pull request repositories changed; rerun update-branch against current context"
  if [ "$pr_head" != "$expected_head" ]; then
    fail "pull request #$pr_number head changed from $expected_head to $pr_head; rerun update-branch against current context"
  fi

  printf '%s\n' "$pr_url"
}

resolve_context() {
  [ "$#" -le 1 ] || fail "resolve accepts at most one optional base ref"
  git remote get-url origin >/dev/null 2>&1 || fail "update-branch requires an origin remote"

  local explicit_base="${1:-}" branch row pr_number pr_url pr_base pr_head base_ref default_ref
  local pr_base_repo pr_head_repo remote
  branch="$(current_branch)"
  row="$(open_pull_request "$branch")"

  if [ -n "$row" ]; then
    read_pull_request "$row"
    [ -n "$pr_base" ] || fail "open pull request #$pr_number has no target branch"
    remote="$(base_remote "$pr_base_repo")"
    base_ref="$remote/$pr_base"
    validate_remotes "$branch" "$base_ref" "$pr_base_repo" "$pr_head_repo" "$pr_head" >/dev/null
    printf 'pull-request\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
      "$branch" "$base_ref" "$pr_number" "$pr_url" "$pr_head" "$pr_base_repo" "$pr_head_repo"
    return
  fi

  if [ -n "$explicit_base" ]; then
    base_ref="$(normalize_origin_ref "$explicit_base")"
  else
    default_ref="$(git symbolic-ref --quiet refs/remotes/origin/HEAD)" ||
      fail "refs/remotes/origin/HEAD is missing; run git remote set-head origin -a"
    base_ref="$(normalize_origin_ref "$default_ref")"
  fi

  printf 'local-only\t%s\t%s\t\t\t\n' "$branch" "$base_ref"
}

push_pull_request() {
  [ "$#" -eq 5 ] || fail "push requires the resolved PR number, base ref, head ref, base repository, and head repository"

  local expected_number="$1" expected_base="$2" expected_head="$3"
  local expected_base_repo="$4" expected_head_repo="$5"
  local branch row post_push_url remote output
  branch="$(current_branch)"
  row="$(open_pull_request "$branch")"
  validate_pull_request_context \
    "$row" "$branch" "$expected_number" "$expected_base" "$expected_head" "$expected_base_repo" "$expected_head_repo" >/dev/null
  remote="$(validate_remotes "$branch" "$expected_base" "$expected_base_repo" "$expected_head_repo" "$expected_head")"

  if ! output="$(git push "$remote" "HEAD:$expected_head" 2>&1)"; then
    echo "FAIL: git push $remote HEAD:$expected_head failed" >&2
    printf '%s\n' "$output" >&2
    exit 1
  fi
  [ -n "$output" ] && printf '%s\n' "$output"
  if ! row="$(open_pull_request "$branch")" || ! post_push_url="$(validate_pull_request_context \
    "$row" "$branch" "$expected_number" "$expected_base" "$expected_head" "$expected_base_repo" "$expected_head_repo")"; then
    fail "git push $remote HEAD:$expected_head succeeded, but pull request context changed or could not be read; the remote branch moved and the pull request update is indeterminate"
  fi
  printf 'Updated pull request #%s at %s\n' "$expected_number" "$post_push_url"
}

require_conflict_skill() {
  [ "$#" -eq 0 ] || fail "require-conflict-skill accepts no arguments"

  local script_dir skill_dir candidate
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  skill_dir="$(dirname "$script_dir")"

  if [ -n "${UPDATE_BRANCH_SKILLS_DIR:-}" ]; then
    candidate="$UPDATE_BRANCH_SKILLS_DIR/fix-merge-conflicts/SKILL.md"
    if [ -f "$candidate" ]; then
      printf '%s\n' "$candidate"
      return
    fi
  else
    for candidate in \
      "$skill_dir/../fix-merge-conflicts/SKILL.md" \
      "$PWD/.agents/skills/fix-merge-conflicts/SKILL.md" \
      "$PWD/.claude/skills/fix-merge-conflicts/SKILL.md" \
      "$PWD/skills/fix-merge-conflicts/SKILL.md"
    do
      if [ -f "$candidate" ]; then
        printf '%s\n' "$candidate"
        return
      fi
    done
  fi

  fail "fix-merge-conflicts is unavailable; install the Engineering plugin or add its fix-merge-conflicts skill"
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
    fail "usage: update-context.sh {resolve [base-ref]|push <pr-number> <base-ref> <head-ref> <base-repository> <head-repository>|require-conflict-skill}"
    ;;
esac
