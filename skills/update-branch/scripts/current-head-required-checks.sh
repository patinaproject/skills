#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo 'usage: current-head-required-checks.sh --pr <number> --head <expected-head-sha>' >&2
  exit 1
}

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pr_number=''
expected_head=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    --pr)
      [ "$#" -ge 2 ] || usage
      pr_number="$2"
      shift 2
      ;;
    --head)
      [ "$#" -ge 2 ] || usage
      expected_head="$2"
      shift 2
      ;;
    *)
      usage
      ;;
  esac
done
[ -n "$pr_number" ] || usage
[ -n "$expected_head" ] || usage

local_head="$(git rev-parse HEAD)" || fail 'cannot resolve local HEAD'
[ "$local_head" = "$expected_head" ] ||
  fail "local HEAD changed from expected $expected_head to $local_head"

read_pr_state() {
  gh pr view "$pr_number" --json headRefOid,baseRefName,id \
    --jq '[.headRefOid, .baseRefName, .id] | @tsv'
}

pr_state="$(read_pr_state)" ||
  fail "gh pr view $pr_number failed while reading the pull request state"
IFS=$'\t' read -r published_head base_branch pr_node_id <<< "$pr_state"
[ "$published_head" = "$expected_head" ] ||
  fail "pull request #$pr_number head is $published_head, not expected current head $expected_head"
[ -n "$base_branch" ] || fail "pull request #$pr_number has no base branch"
[ -n "$pr_node_id" ] || fail "pull request #$pr_number has no node ID"

repository="$(gh repo view --json nameWithOwner --jq .nameWithOwner)" ||
  fail 'gh repo view failed while reading the repository identity'
case "$repository" in
  */*) ;;
  *) fail "invalid repository identity: $repository" ;;
esac
owner="${repository%%/*}"
name="${repository#*/}"

urlencode_segment() {
  local value="$1" encoded='' character hex index
  LC_ALL=C
  for ((index = 0; index < ${#value}; index++)); do
    character="${value:index:1}"
    case "$character" in
      [a-zA-Z0-9.~_-]) encoded+="$character" ;;
      *)
        printf -v hex '%%%02X' "'$character"
        encoded+="$hex"
        ;;
    esac
  done
  printf '%s' "$encoded"
}

encoded_base="$(urlencode_segment "$base_branch")"
read_configured_requirements() {
  local ruleset_requirements classic_requirements requirements
  ruleset_requirements="$(gh api --paginate \
    "repos/$repository/rules/branches/$encoded_base?per_page=100" \
    --jq '.[] |
      if .type == "required_status_checks" then
        .parameters.required_status_checks[]? |
          ["status", .context,
           (if .integration_id == null or .integration_id == -1 then
              "any"
            else (.integration_id | tostring) end)] | @tsv
      elif .type == "workflows" then
        .parameters.workflows[]? |
          ["workflow", (.repository_id | tostring), .path, (.ref // ""), (.sha // "")] | @tsv
      else empty end')" || return 1
  # GraphQL variables expand on GitHub's side.
  # shellcheck disable=SC2016
  classic_requirements="$(gh api graphql \
    -f owner="$owner" \
    -f name="$name" \
    -f branch="refs/heads/$base_branch" \
    -f query='query($owner:String!,$name:String!,$branch:String!){
      repository(owner:$owner,name:$name){
        ref(qualifiedName:$branch){
          branchProtectionRule{requiredStatusChecks{context app{databaseId}}}
        }
      }
    }' \
    --jq '.data.repository.ref.branchProtectionRule.requiredStatusChecks // [] | .[] |
      ["status", .context, ((.app.databaseId // "any") | tostring)] | @tsv')" ||
    return 1

  requirements="$ruleset_requirements"
  [ -z "$classic_requirements" ] ||
    requirements+="${requirements:+$'\n'}$classic_requirements"
  [ -z "$requirements" ] || printf '%s\n' "$requirements" | sort -u
}

configured_requirements="$(read_configured_requirements)" ||
  fail "cannot read required-check configuration for $repository:$base_branch"
if [ -n "$configured_requirements" ]; then
  configured_required_count="$(printf '%s\n' "$configured_requirements" | wc -l | tr -d '[:space:]')"
else
  configured_required_count=0
fi

resolve_configured_workflows() {
  local requirements="$1" workflows='' requirement_type requirement_source
  local requirement_path requirement_ref requirement_sha source_metadata
  local source_repository source_default_branch workflow_ref encoded_workflow_ref

  while IFS=$'\t' read -r requirement_type requirement_source requirement_path requirement_ref requirement_sha; do
    [ "$requirement_type" = workflow ] || continue
    source_metadata="$(gh api "repositories/$requirement_source" \
      --jq '[.full_name, .default_branch] | @tsv')" || return 1
    IFS=$'\t' read -r source_repository source_default_branch <<< "$source_metadata"
    [ -n "$source_repository" ] || return 1
    if [ -z "$requirement_sha" ]; then
      workflow_ref="${requirement_ref:-$source_default_branch}"
      [ -n "$workflow_ref" ] || return 1
      encoded_workflow_ref="$(urlencode_segment "$workflow_ref")"
      requirement_sha="$(gh api \
        "repos/$source_repository/commits/$encoded_workflow_ref" --jq .sha)" || return 1
    fi
    [ -n "$requirement_sha" ] || return 1
    workflows+="${workflows:+$'\n'}$source_repository"$'\t'"$requirement_path"$'\t'"$requirement_sha"
  done <<< "$requirements"
  [ -z "$workflows" ] || printf '%s\n' "$workflows" | sort -u
}

configured_workflows="$(resolve_configured_workflows "$configured_requirements")" ||
  fail 'cannot resolve configured required workflows'

read_required_observations() {
  local context_rows sorted_contexts observations last_identity identity
  local context_kind context_name context_app context_state context_order
  local workflow_repository workflow_path workflow_url workflow_execution workflow_state
  local workflow_revision bucket workflow_bucket

  # GraphQL variables expand on GitHub's side.
  # shellcheck disable=SC2016
  context_rows="$(gh api graphql --paginate \
    -f id="$pr_node_id" \
    -f query='query($id:ID!,$endCursor:String){
      node(id:$id){... on PullRequest{
        commits(last:1){nodes{commit{statusCheckRollup{
          contexts(first:100,after:$endCursor){
            nodes{
              __typename
              ... on StatusContext{
                context state createdAt isRequired(pullRequestId:$id)
              }
              ... on CheckRun{
                databaseId name status conclusion isRequired(pullRequestId:$id)
                checkSuite{
                  app{databaseId}
                  status conclusion
                  workflowRun{
                    databaseId runAttempt
                    file{repositoryName path repositoryFileUrl}
                  }
                }
              }
            }
            pageInfo{hasNextPage endCursor}
          }
        }}}}
      }}
    }' \
    --jq '.data.node.commits.nodes[0].commit.statusCheckRollup.contexts.nodes[]? |
      select(.isRequired) |
      if .__typename == "StatusContext" then
        ["status", .context, "any", .state, .createdAt, "", "", "", "", ""] | @tsv
      else
        ["check", .name, ((.checkSuite.app.databaseId // "any") | tostring),
         (if .status == "COMPLETED" then (.conclusion // .status) else .status end),
         (if .databaseId == null then error("required CheckRun omitted databaseId")
          else ("00000000000000000000" + (.databaseId | tostring))[-20:] end),
         (.checkSuite.workflowRun.file.repositoryName // ""),
         (.checkSuite.workflowRun.file.path // ""),
         (.checkSuite.workflowRun.file.repositoryFileUrl // ""),
         (if .checkSuite.workflowRun == null then ""
          elif .checkSuite.workflowRun.databaseId == null then
            error("required WorkflowRun omitted databaseId")
          else
            (("00000000000000000000" +
              (.checkSuite.workflowRun.databaseId | tostring))[-20:]) + ":" +
            (("0000000000" +
              (.checkSuite.workflowRun.runAttempt | tostring))[-10:])
          end),
         (if .checkSuite.workflowRun == null then ""
          elif .checkSuite.status == "COMPLETED" then
            (.checkSuite.conclusion // .checkSuite.status)
          else .checkSuite.status end)] | @tsv
      end')" || return 1

  observations=''
  last_identity=''
  sorted_contexts="$(printf '%s\n' "$context_rows" |
    sort -t $'\t' -k1,1 -k2,2 -k3,3 -k6,6 -k7,7 -k8,8 -k5,5r)"
  while IFS=$'\t' read -r context_kind context_name context_app context_state context_order \
    workflow_repository workflow_path workflow_url workflow_execution workflow_state; do
    [ -n "$context_name" ] || continue
    case "$context_state" in
      SUCCESS) bucket=pass ;;
      SKIPPED | NEUTRAL) bucket=skipping ;;
      ERROR | FAILURE | TIMED_OUT | ACTION_REQUIRED) bucket=fail ;;
      CANCELLED) bucket=cancel ;;
      *) bucket=pending ;;
    esac
    if [ -n "$workflow_repository" ]; then
      case "$workflow_url" in
        */blob/*/*) ;;
        *) return 1 ;;
      esac
      workflow_revision="${workflow_url#*/blob/}"
      workflow_revision="${workflow_revision%%/*}"
      [ -n "$workflow_revision" ] || return 1
      [ -n "$workflow_execution" ] || return 1
      case "${workflow_state:-$context_state}" in
        SUCCESS) workflow_bucket=pass ;;
        SKIPPED | NEUTRAL) workflow_bucket=skipping ;;
        ERROR | FAILURE | TIMED_OUT | ACTION_REQUIRED) workflow_bucket=fail ;;
        CANCELLED) workflow_bucket=cancel ;;
        *) workflow_bucket=pending ;;
      esac
      observations+="${observations:+$'\n'}workflow"$'\t'"$workflow_repository"$'\t'"$workflow_path"$'\t'"$workflow_revision"$'\t'"$workflow_execution"$'\t'"$context_name"$'\t'"$context_app"$'\t'"$workflow_bucket"$'\t'"$context_order"
    fi

    identity="$context_kind"$'\t'"$context_name"$'\t'"$context_app"$'\t'"$workflow_repository"$'\t'"$workflow_path"$'\t'"$workflow_url"
    [ "$identity" != "$last_identity" ] || continue
    last_identity="$identity"
    observations+="${observations:+$'\n'}check"$'\t'"$context_kind"$'\t'"$context_name"$'\t'"$context_app"$'\t'"$bucket"$'\t'"$context_order"
  done <<< "$sorted_contexts"

  [ -z "$observations" ] || printf '%s\n' "$observations" | sort -u
}

check_status=0
observation_snapshot=''
if [ "$configured_required_count" -eq 0 ]; then
  printf 'required-check-set=empty repository=%s base=%s\n' \
    "$repository" "$base_branch"
elif observation_snapshot="$(read_required_observations)"; then
  [ -z "$observation_snapshot" ] || printf '%s\n' "$observation_snapshot"
  while IFS=$'\t' read -r requirement_type requirement_value requirement_app _; do
    [ "$requirement_type" = status ] || continue
    same_name_requirement_count=0
    while IFS=$'\t' read -r candidate_type candidate_value _; do
      if [ "$candidate_type" = status ] && [ "$candidate_value" = "$requirement_value" ]; then
        same_name_requirement_count=$((same_name_requirement_count + 1))
      fi
    done <<< "$configured_requirements"
    latest_status_order=''
    latest_status_bucket=''
    latest_check_order=''
    latest_check_bucket=''
    while IFS=$'\t' read -r observation_type observation_kind observation_name observation_source observation_bucket observation_order; do
      [ "$observation_type" = check ] || continue
      [ "$observation_name" = "$requirement_value" ] || continue
      if [ "$requirement_app" = any ] || [ "$observation_source" = "$requirement_app" ] ||
        { [ "$observation_kind" = status ] &&
          { [ "$same_name_requirement_count" -eq 1 ] ||
            { [ "$observation_bucket" != pass ] && [ "$observation_bucket" != skipping ]; }; }; }; then
        case "$observation_kind" in
          status)
            if [ -z "$latest_status_order" ] ||
              [[ "$observation_order" > "$latest_status_order" ]]; then
              latest_status_order="$observation_order"
              latest_status_bucket="$observation_bucket"
            fi
            ;;
          check)
            if [ -z "$latest_check_order" ] ||
              [[ "$observation_order" > "$latest_check_order" ]]; then
              latest_check_order="$observation_order"
              latest_check_bucket="$observation_bucket"
            fi
            ;;
        esac
      fi
    done <<< "$observation_snapshot"
    if [ -z "$latest_status_order" ] && [ -z "$latest_check_order" ]; then
      check_status=1
    fi
    if [ -n "$latest_status_order" ]; then
      case "$latest_status_bucket" in
        pass | skipping) ;;
        *) check_status=1 ;;
      esac
    fi
    if [ -n "$latest_check_order" ]; then
      case "$latest_check_bucket" in
        pass | skipping) ;;
        *) check_status=1 ;;
      esac
    fi
  done <<< "$configured_requirements"
  while IFS= read -r configured_workflow; do
    [ -n "$configured_workflow" ] || continue
    latest_workflow_execution=''
    while IFS=$'\t' read -r observation_type workflow_repository workflow_path \
      workflow_revision workflow_execution _; do
      [ "$observation_type" = workflow ] || continue
      observed_workflow="$workflow_repository"$'\t'"$workflow_path"$'\t'"$workflow_revision"
      [ "$observed_workflow" = "$configured_workflow" ] || continue
      if [ -z "$latest_workflow_execution" ] ||
        [[ "$workflow_execution" > "$latest_workflow_execution" ]]; then
        latest_workflow_execution="$workflow_execution"
      fi
    done <<< "$observation_snapshot"
    workflow_found=false
    workflow_passed=true
    while IFS=$'\t' read -r observation_type workflow_repository workflow_path \
      workflow_revision workflow_execution _ _ workflow_bucket _; do
      [ "$observation_type" = workflow ] || continue
      observed_workflow="$workflow_repository"$'\t'"$workflow_path"$'\t'"$workflow_revision"
      [ "$observed_workflow" = "$configured_workflow" ] || continue
      [ "$workflow_execution" = "$latest_workflow_execution" ] || continue
      workflow_found=true
      case "$workflow_bucket" in
        pass | skipping) ;;
        *) workflow_passed=false ;;
      esac
    done <<< "$observation_snapshot"
    if [ "$workflow_found" != true ] || [ "$workflow_passed" != true ]; then
      check_status=1
    fi
  done <<< "$configured_workflows"
else
  check_status="$?"
fi

refreshed_state="$(read_pr_state)" ||
  fail "gh pr view $pr_number failed while rechecking the pull request state"
IFS=$'\t' read -r refreshed_head refreshed_base _ <<< "$refreshed_state"
if [ "$refreshed_head" != "$expected_head" ]; then
  printf 'outcome=stale-required-check-snapshot expected=%s actual=%s\n' \
    "$expected_head" "$refreshed_head"
  exit 1
fi
if [ "$refreshed_base" != "$base_branch" ]; then
  printf 'outcome=stale-required-check-snapshot expected-base=%s actual-base=%s\n' \
    "$base_branch" "$refreshed_base"
  exit 1
fi
refreshed_requirements="$(read_configured_requirements)" ||
  fail "cannot recheck required-check configuration for $repository:$base_branch"
if [ "$refreshed_requirements" != "$configured_requirements" ]; then
  printf 'outcome=stale-required-check-snapshot reason=required-check-configuration-changed\n'
  exit 1
fi
refreshed_workflows="$(resolve_configured_workflows "$refreshed_requirements")" ||
  fail 'cannot re-resolve configured required workflows'
if [ "$refreshed_workflows" != "$configured_workflows" ]; then
  printf 'outcome=stale-required-check-snapshot reason=required-workflow-resolution-changed\n'
  exit 1
fi
if [ "$check_status" -eq 0 ] && [ "$configured_required_count" -gt 0 ]; then
  if ! refreshed_observations="$(read_required_observations)" ||
    [ "$refreshed_observations" != "$observation_snapshot" ]; then
    printf 'outcome=stale-required-check-snapshot reason=required-check-observations-changed\n'
    exit 1
  fi
fi

if [ "$check_status" -ne 0 ]; then
  printf 'outcome=required-checks-non-pass status=%s head=%s\n' \
    "$check_status" "$expected_head"
  exit "$check_status"
fi

printf 'outcome=required-checks-passed configured=%s head=%s\n' \
  "$configured_required_count" "$expected_head"
