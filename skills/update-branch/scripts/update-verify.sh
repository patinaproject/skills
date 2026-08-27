#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
usage: update-verify.sh --message <commit-message> --target <fetched-target-ref> \
  --scoped <command> [args...] [--broad <command> [args...]] \
  [--contract <failing-contract>] [--evidence <target-owned-path>]... \
  [--broad-required]
USAGE
  exit 1
}

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

is_marker() {
  case "$1" in
    --message | --target | --scoped | --broad | --contract | --evidence | --broad-required)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

message=''
target_ref=''
broad_contract=''
broad_required=false
scoped_cmd=()
broad_cmd=()
evidence_paths=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    --message)
      [ "$#" -ge 2 ] || usage
      message="$2"
      shift 2
      ;;
    --target)
      [ "$#" -ge 2 ] || usage
      target_ref="$2"
      shift 2
      ;;
    --scoped)
      shift
      while [ "$#" -gt 0 ] && ! is_marker "$1"; do
        scoped_cmd+=("$1")
        shift
      done
      ;;
    --broad)
      shift
      while [ "$#" -gt 0 ] && ! is_marker "$1"; do
        broad_cmd+=("$1")
        shift
      done
      ;;
    --contract)
      [ "$#" -ge 2 ] || usage
      broad_contract="$2"
      shift 2
      ;;
    --evidence)
      [ "$#" -ge 2 ] || usage
      evidence_paths+=("$2")
      shift 2
      ;;
    --broad-required)
      broad_required=true
      shift
      ;;
    *)
      usage
      ;;
  esac
done

[ -n "$message" ] || usage
[ -n "$target_ref" ] || usage
[ "${#scoped_cmd[@]}" -gt 0 ] || usage
if [ "${#broad_cmd[@]}" -gt 0 ] && [ -z "$broad_contract" ]; then
  usage
fi
if [ "${#broad_cmd[@]}" -eq 0 ] &&
  { $broad_required || [ "${#evidence_paths[@]}" -gt 0 ] || [ -n "$broad_contract" ]; }; then
  usage
fi

git rev-parse --is-inside-work-tree >/dev/null 2>&1 ||
  fail 'not inside a git work tree'
git rev-parse -q --verify MERGE_HEAD >/dev/null ||
  fail 'no target merge is in progress'
[ -z "$(git ls-files --unmerged)" ] ||
  fail 'the target merge still has unresolved conflicts'

pre_head="$(git rev-parse HEAD)"
target_sha="$(git rev-parse "$target_ref^{commit}")" ||
  fail "cannot resolve fetched target ref $target_ref"
merge_target_sha="$(git rev-parse MERGE_HEAD)"
[ "$target_sha" = "$merge_target_sha" ] ||
  fail "target ref $target_ref resolved to $target_sha, but the in-progress merge targets $merge_target_sha"
staged_tree="$(git write-tree)"

block() {
  local phase="$1" reason="$2" message_text="$3" merge_state head
  if [ "$phase" = merge ]; then
    git merge --abort ||
      fail 'git merge --abort failed; restore the working tree before continuing'
    merge_state='aborted'
  else
    merge_state='committed-unpublished'
  fi
  head="$(git rev-parse HEAD)"
  printf 'outcome=blocked reason=%s merge-state=%s head=%s\n' \
    "$reason" "$merge_state" "$head"
  fail "$message_text"
}

ensure_exact_tree() {
  local phase="$1" verification="$2"
  if [ "$phase" = merge ]; then
    if ! git diff --quiet || [ "$(git write-tree)" != "$staged_tree" ]; then
      block merge verification-mutated-merge \
        "$verification mutated tracked merge content; branch restored to $pre_head"
    fi
  elif ! git diff --quiet || ! git diff --cached --quiet; then
    block committed verification-mutated-commit \
      "$verification mutated the committed tree; the merge commit remains local and must not be pushed"
  fi
}

run_verification() {
  local label="$1"
  shift
  printf '%s verification:' "$label"
  printf ' %q' "$@"
  printf '\n'
  "$@"
}

evidence_differs() {
  local phase="$1" path="$2"
  if [ "$phase" = merge ]; then
    if git diff --cached --quiet "$target_sha" -- "$path"; then
      return 1
    fi
  elif git diff --quiet "$target_sha" HEAD -- "$path"; then
    return 1
  fi
  return 0
}

verify_pass() {
  local phase="$1" scoped_status=0 broad_status=0 path
  local changed_evidence=() missing_evidence=()

  run_verification scoped "${scoped_cmd[@]}" || scoped_status="$?"
  ensure_exact_tree "$phase" 'scoped verification'
  if [ "$scoped_status" -ne 0 ]; then
    block "$phase" scoped-verification-failed \
      "scoped verification failed with exit $scoped_status"
  fi

  if [ "${#broad_cmd[@]}" -gt 0 ]; then
    run_verification broad "${broad_cmd[@]}" || broad_status="$?"
    ensure_exact_tree "$phase" 'broad verification'
  fi

  outcome='verified'
  if [ "$broad_status" -eq 0 ]; then
    return
  fi

  printf 'Broad verification failed with exit %s: %s\n' \
    "$broad_status" "$broad_contract" >&2
  printf 'Command:' >&2
  printf ' %q' "${broad_cmd[@]}" >&2
  printf '\n' >&2

  if [ "$broad_status" -eq 126 ] || [ "$broad_status" -eq 127 ]; then
    block "$phase" unclassified-broad-verification-failed \
      'broad verification could not run'
  fi
  if $broad_required; then
    block "$phase" required-broad-verification-failed \
      'repository guidance requires the broad verification'
  fi
  if [ "${#evidence_paths[@]}" -eq 0 ]; then
    block "$phase" unclassified-broad-verification-failed \
      'broad verification failed without target-ownership evidence'
  fi

  for path in "${evidence_paths[@]}"; do
    if [ -z "$(git ls-tree -r --name-only "$target_sha" -- "$path")" ] ||
      [ -z "$(git ls-files -- "$path")" ]; then
      missing_evidence+=("$path")
    elif evidence_differs "$phase" "$path"; then
      changed_evidence+=("$path")
    fi
  done

  if [ "${#missing_evidence[@]}" -gt 0 ]; then
    printf 'Evidence paths missing from the target or verified tree:' >&2
    printf ' %q' "${missing_evidence[@]}" >&2
    printf '\n' >&2
    block "$phase" unclassified-broad-verification-failed \
      'target ownership could not be proven'
  fi
  if [ "${#changed_evidence[@]}" -gt 0 ]; then
    printf 'Branch-changed failure inputs:' >&2
    printf ' %q' "${changed_evidence[@]}" >&2
    printf '\n' >&2
    block "$phase" branch-caused \
      'the branch changed a broad-verification input'
  fi

  outcome='target-owned'
  printf 'Target-owned failure: %s\n' "$broad_contract"
  printf 'Evidence unchanged from %s (%s):' "$target_ref" "$target_sha"
  printf ' %q' "${evidence_paths[@]}"
  printf '\n'
}

verify_pass merge

if ! git commit -m "$message" >/dev/null; then
  if git rev-parse -q --verify MERGE_HEAD >/dev/null; then
    block merge commit-failed 'git commit failed; branch restored when possible'
  fi
  block committed commit-failed 'git commit failed after moving HEAD; the unpublished branch needs inspection'
fi

head="$(git rev-parse HEAD)"
committed_tree="$(git rev-parse 'HEAD^{tree}')"
post_commit_reverified=false
if [ "$committed_tree" != "$staged_tree" ] ||
  ! git diff --quiet || ! git diff --cached --quiet; then
  echo 'Commit hooks changed the candidate tree; re-running verification on the exact committed head.'
  verify_pass committed
  post_commit_reverified=true
fi

printf 'outcome=%s scoped=passed broad=%s post-commit-reverified=%s head=%s\n' \
  "$outcome" \
  "$([ "$outcome" = target-owned ] && printf target-owned-failure || printf passed)" \
  "$post_commit_reverified" \
  "$head"
echo "Committed verified target merge as $head."
