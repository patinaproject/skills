#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
usage: update-verify.sh --message <commit-message> --target <fetched-target-ref> \
  --scoped <command> [args...] [--broad <command> [args...]] \
  [--evidence <target-owned-path>]... [--broad-required]
USAGE
  exit 1
}

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

is_marker() {
  case "$1" in
    --message | --target | --scoped | --broad | --evidence | --broad-required)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

message=''
target_ref=''
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
if $broad_required && [ "${#broad_cmd[@]}" -eq 0 ]; then
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

abort_with() {
  local reason="$1"
  git merge --abort ||
    fail 'git merge --abort failed; restore the working tree before continuing'
  printf 'outcome=blocked reason=%s merge-state=aborted head=%s\n' \
    "$reason" "$(git rev-parse HEAD)"
  return 1
}

ensure_exact_tree() {
  local phase="$1"
  if ! git diff --quiet || [ "$(git write-tree)" != "$staged_tree" ]; then
    abort_with verification-mutated-merge || true
    fail "$phase mutated tracked merge content; branch restored to $pre_head"
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

scoped_status=0
run_verification scoped "${scoped_cmd[@]}" || scoped_status="$?"
ensure_exact_tree 'scoped verification'
if [ "$scoped_status" -ne 0 ]; then
  abort_with scoped-verification-failed || true
  fail "scoped verification failed with exit $scoped_status; branch restored to $pre_head"
fi

broad_status=0
if [ "${#broad_cmd[@]}" -gt 0 ]; then
  run_verification broad "${broad_cmd[@]}" || broad_status="$?"
  ensure_exact_tree 'broad verification'
fi

outcome='verified'
if [ "$broad_status" -ne 0 ]; then
  printf 'Broad verification failed with exit %s:' "$broad_status" >&2
  printf ' %q' "${broad_cmd[@]}" >&2
  printf '\n' >&2

  if [ "$broad_status" -eq 126 ] || [ "$broad_status" -eq 127 ]; then
    abort_with unclassified-broad-verification-failed || true
    fail "broad verification could not run; branch restored to $pre_head"
  fi

  if $broad_required; then
    abort_with required-broad-verification-failed || true
    fail "repository guidance requires the broad verification; branch restored to $pre_head"
  fi

  if [ "${#evidence_paths[@]}" -eq 0 ]; then
    abort_with unclassified-broad-verification-failed || true
    fail "broad verification failed without target-ownership evidence; branch restored to $pre_head"
  fi

  changed_evidence=()
  missing_evidence=()
  for path in "${evidence_paths[@]}"; do
    if [ -z "$(git ls-tree -r --name-only "$target_sha" -- "$path")" ] ||
      [ -z "$(git ls-files -- "$path")" ]; then
      missing_evidence+=("$path")
    elif ! git diff --cached --quiet "$target_sha" -- "$path"; then
      changed_evidence+=("$path")
    fi
  done

  if [ "${#missing_evidence[@]}" -gt 0 ]; then
    printf 'Evidence paths missing from the target or merged tree:' >&2
    printf ' %q' "${missing_evidence[@]}" >&2
    printf '\n' >&2
    abort_with unclassified-broad-verification-failed || true
    fail "target ownership could not be proven; branch restored to $pre_head"
  fi

  if [ "${#changed_evidence[@]}" -gt 0 ]; then
    printf 'Branch-changed failure inputs:' >&2
    printf ' %q' "${changed_evidence[@]}" >&2
    printf '\n' >&2
    abort_with branch-caused || true
    fail "the branch changed a broad-verification input; branch restored to $pre_head"
  fi

  outcome='target-owned'
  printf 'Target-owned evidence unchanged from %s (%s):' "$target_ref" "$target_sha"
  printf ' %q' "${evidence_paths[@]}"
  printf '\n'
fi

git commit -m "$message" >/dev/null || {
  git merge --abort >/dev/null 2>&1 || true
  fail "git commit failed; branch restored to $pre_head when possible"
}
head="$(git rev-parse HEAD)"
printf 'outcome=%s scoped=passed broad=%s head=%s\n' \
  "$outcome" "$([ "$broad_status" -eq 0 ] && printf passed || printf target-owned-failure)" "$head"
echo "Committed verified target merge as $head."
