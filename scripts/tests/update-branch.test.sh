#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HELPER="$REPO_ROOT/skills/update-branch/scripts/update-context.sh"
VERIFY_HELPER="$REPO_ROOT/skills/update-branch/scripts/update-verify.sh"
REQUIRED_CHECKS="$REPO_ROOT/skills/update-branch/scripts/current-head-required-checks.sh"
GIT_ID=(-c user.email=test@example.com -c user.name=test)
TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

FAIL_COUNT=0
fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

assert_equal() {
  local actual="$1" expected="$2" message="$3"
  if [ "$actual" != "$expected" ]; then
    fail "$message (expected '$expected', got '$actual')"
  fi
}

assert_context_change_blocks_push() {
  local scenario="$1" expected_message="$2" description="$3"
  local origin before after output
  origin="$(git -C "$clone" remote get-url origin)"
  before="$(git --git-dir="$origin" rev-parse refs/heads/feature)"
  if output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO="$scenario" \
    "$HELPER" push "$pr_number" "$base_ref" "$head_ref" 2>&1)"; then
    fail "$description scenario unexpectedly succeeded"
  elif ! grep -Fq "$expected_message" <<< "$output"; then
    fail "$description error was not actionable: $output"
  fi
  after="$(git --git-dir="$origin" rev-parse refs/heads/feature)"
  assert_equal "$after" "$before" "$description should block the remote update"
}

assert_merge_aborted() {
  local dir="$1" pre_head="$2" description="$3"
  if git -C "$dir" rev-parse -q --verify MERGE_HEAD >/dev/null; then
    fail "$description should abort the merge"
  fi
  assert_equal "$(git -C "$dir" rev-parse HEAD)" "$pre_head" \
    "$description should restore the pre-merge head"
}

FAKE_BIN="$TMP_ROOT/bin"
mkdir -p "$FAKE_BIN"
cat > "$FAKE_BIN/gh" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail

case "${GH_SCENARIO:?GH_SCENARIO must be set}" in
required-check-failed | required-check-passed | required-check-state-changed | required-check-delayed | required-status-app-delayed | required-status-app-context-passed | required-status-app-context-wrong-source | required-status-app-context-ambiguous | required-status-app-context-ambiguous-failed | required-status-any-latest-passed | required-status-pass-check-fail | required-status-fail-check-pass | required-workflow-delayed | required-workflow-same-job-passed | required-workflow-duplicate-job-failed | required-workflow-partial-rerun-failed | required-workflow-superseded-passed | required-workflow-queued-rerun | required-workflow-cancelled-unstarted-superseded | required-workflow-cancelled-unstarted-latest | required-workflow-startup-failure-latest | required-workflow-version-delayed | required-workflow-ref-moved | required-config-changed | no-config-zero-runs | no-config-optional-only)
  if [ "${1:-}" = pr ] && [ "${2:-}" = view ]; then
    printf '%s\tmain\tPR_node\n' "${EXPECTED_HEAD:?EXPECTED_HEAD must be set}"
    exit 0
  fi
  if [ "${1:-}" = repo ] && [ "${2:-}" = view ]; then
    printf 'example/project\n'
    exit 0
  fi
  if [ "${1:-}" = api ] && [ "${2:-}" = graphql ]; then
    if [[ "$*" == *statusCheckRollup* ]]; then
      if [[ "$*" != *databaseId* ]]; then
        echo 'status rollup query omitted the stable CheckRun identifier' >&2
        exit 2
      fi
      if [[ "$*" != *runAttempt* ]]; then
        echo 'status rollup query omitted the workflow execution attempt' >&2
        exit 2
      fi
      case "$GH_SCENARIO" in
        required-check-failed)
          printf 'check\tTest Gate\t77\tFAILURE\t00000000000000000100\t\t\t\n'
          ;;
        required-check-passed)
          printf 'check\tTest Gate\t77\tSUCCESS\t00000000000000000100\t\t\t\n'
          ;;
        required-check-state-changed)
          if [ -s "${GH_CHECK_LOG:?GH_CHECK_LOG must be set}" ]; then
            printf 'check\tTest Gate\t77\tPENDING\t00000000000000000100\t\t\t\n'
          else
            printf 'check\tTest Gate\t77\tSUCCESS\t00000000000000000100\t\t\t\n'
          fi
          printf 'call\n' >> "$GH_CHECK_LOG"
          ;;
        required-status-app-delayed)
          printf 'check\tShared Gate\t11\tSUCCESS\t00000000000000000100\t\t\t\n'
          ;;
        required-status-app-context-passed)
          printf 'status\tShared Gate\tany\tSUCCESS\t2026-08-27T00:00:00Z\t\t\t\n'
          ;;
        required-status-app-context-wrong-source)
          # GitHub reports the wrong-source StatusContext as not required, so
          # select(.isRequired) omits it from the helper's observation rows.
          ;;
        required-status-app-context-ambiguous)
          printf 'status\tShared Gate\tany\tSUCCESS\t2026-08-27T00:00:00Z\t\t\t\n'
          ;;
        required-status-app-context-ambiguous-failed)
          printf 'check\tShared Gate\t11\tSUCCESS\t00000000000000000100\t\t\t\n'
          printf 'check\tShared Gate\t22\tSUCCESS\t00000000000000000101\t\t\t\n'
          printf 'status\tShared Gate\tany\tFAILURE\t2026-08-27T00:00:00Z\t\t\t\n'
          ;;
        required-status-any-latest-passed)
          printf 'check\tShared Gate\t11\tFAILURE\t00000000000000000100\t\t\t\n'
          printf 'check\tShared Gate\t22\tSUCCESS\t00000000000000000101\t\t\t\n'
          ;;
        required-status-pass-check-fail)
          printf 'status\tShared Gate\tany\tSUCCESS\t2026-08-27T00:00:00Z\t\t\t\n'
          printf 'check\tShared Gate\t22\tFAILURE\t00000000000000000101\t\t\t\n'
          ;;
        required-status-fail-check-pass)
          printf 'check\tShared Gate\t22\tSUCCESS\t00000000000000000100\t\t\t\n'
          printf 'status\tShared Gate\tany\tFAILURE\t2026-08-27T00:01:00Z\t\t\t\n'
          ;;
        required-workflow-delayed)
          printf 'check\tA job 1\t77\tSUCCESS\t00000000000000000100\texample/workflows-a\t.github/workflows/a.yml\thttps://github.com/example/workflows-a/blob/SHA_A/.github/workflows/a.yml\t00000000000000000100:0000000001\n'
          printf 'check\tA job 2\t77\tSUCCESS\t00000000000000000101\texample/workflows-a\t.github/workflows/a.yml\thttps://github.com/example/workflows-a/blob/SHA_A/.github/workflows/a.yml\t00000000000000000100:0000000001\n'
          ;;
        required-workflow-same-job-passed)
          printf 'check\tGate\t77\tSUCCESS\t00000000000000000100\texample/workflows-a\t.github/workflows/a.yml\thttps://github.com/example/workflows-a/blob/SHA_A/.github/workflows/a.yml\t00000000000000000100:0000000001\n'
          printf 'check\tGate\t77\tSUCCESS\t00000000000000000101\texample/workflows-b\t.github/workflows/b.yml\thttps://github.com/example/workflows-b/blob/SHA_B/.github/workflows/b.yml\t00000000000000000101:0000000001\n'
          ;;
        required-workflow-duplicate-job-failed)
          printf 'check\tGate\t77\tFAILURE\t00000000000000000100\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000001\n'
          printf 'check\tGate\t77\tSUCCESS\t00000000000000000101\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000001\n'
          ;;
        required-workflow-partial-rerun-failed)
          printf 'check\tA\t77\tFAILURE\t00000000000000000100\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000001\tFAILURE\n'
          printf 'check\tB\t77\tFAILURE\t00000000000000000101\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000001\tFAILURE\n'
          printf 'check\tA\t77\tSUCCESS\t00000000000000000102\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000002\tFAILURE\n'
          ;;
        required-workflow-superseded-passed)
          printf 'check\tGate\t77\tFAILURE\t00000000000000000100\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_OLD/.github/workflows/shared.yml\t00000000000000000100:0000000001\n'
          printf 'check\tGate\t77\tSUCCESS\t00000000000000000101\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000101:0000000001\n'
          ;;
        required-workflow-queued-rerun)
          printf 'check\tGate\t77\tSUCCESS\t00000000000000000100\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000001\n'
          printf 'check\tGate\t77\tQUEUED\t00000000000000000101\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000002\n'
          ;;
        required-workflow-cancelled-unstarted-superseded)
          # The older run finishes cancellation after the newer run starts;
          # creation order, not lifecycle timestamps, identifies the rerun.
          printf 'check\tGate\t77\tCANCELLED\t00000000000000000100\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000001\n'
          printf 'check\tGate\t77\tSUCCESS\t00000000000000000101\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000002\n'
          ;;
        required-workflow-cancelled-unstarted-latest)
          printf 'check\tGate\t77\tSUCCESS\t00000000000000000100\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000001\n'
          printf 'check\tGate\t77\tCANCELLED\t00000000000000000101\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000002\n'
          ;;
        required-workflow-startup-failure-latest)
          printf 'check\tGate\t77\tSUCCESS\t00000000000000000100\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000001\n'
          printf 'check\tGate\t77\tSTARTUP_FAILURE\t00000000000000000101\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_NEW/.github/workflows/shared.yml\t00000000000000000100:0000000002\n'
          ;;
        required-workflow-version-delayed)
          printf 'check\tA job 1\t77\tSUCCESS\t00000000000000000100\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_V1/.github/workflows/shared.yml\t00000000000000000100:0000000001\n'
          ;;
        required-workflow-ref-moved)
          printf 'check\tA job 1\t77\tSUCCESS\t00000000000000000100\texample/workflows\t.github/workflows/shared.yml\thttps://github.com/example/workflows/blob/SHA_OLD/.github/workflows/shared.yml\t00000000000000000100:0000000001\n'
          ;;
      esac
    fi
    exit 0
  fi
  if [ "${1:-}" = api ]; then
    if [ "${2:-}" = repositories/101 ]; then
      printf 'example/workflows-a\tmain\n'
      exit 0
    elif [ "${2:-}" = repositories/102 ]; then
      printf 'example/workflows-b\tmain\n'
      exit 0
    elif [ "${2:-}" = repositories/103 ]; then
      printf 'example/workflows\tmain\n'
      exit 0
    elif [ "${2:-}" = repos/example/workflows-a/commits/main ]; then
      printf 'SHA_A\n'
      exit 0
    elif [ "${2:-}" = repos/example/workflows-b/commits/main ]; then
      printf 'SHA_B\n'
      exit 0
    elif [ "${2:-}" = repos/example/workflows/commits/v1 ]; then
      printf 'SHA_V1\n'
      exit 0
    elif [ "${2:-}" = repos/example/workflows/commits/v2 ]; then
      printf 'SHA_V2\n'
      exit 0
    elif [ "${2:-}" = repos/example/workflows/commits/main ]; then
      if [ "$GH_SCENARIO" = required-workflow-ref-moved ]; then
        if [ -s "${GH_WORKFLOW_REF_LOG:?GH_WORKFLOW_REF_LOG must be set}" ]; then
          printf 'SHA_NEW\n'
        else
          printf 'SHA_OLD\n'
        fi
        printf 'call\n' >> "$GH_WORKFLOW_REF_LOG"
      else
        printf 'SHA_NEW\n'
      fi
      exit 0
    fi
    case "$GH_SCENARIO" in
      required-check-failed | required-check-passed | required-check-state-changed | required-check-delayed)
        printf 'status\tTest Gate\t77\n'
        ;;
      required-status-app-delayed)
        printf 'status\tShared Gate\t11\n'
        printf 'status\tShared Gate\t22\n'
        ;;
      required-status-app-context-passed | required-status-app-context-wrong-source)
        printf 'status\tShared Gate\t22\n'
        ;;
      required-status-app-context-ambiguous | required-status-app-context-ambiguous-failed)
        printf 'status\tShared Gate\t11\n'
        printf 'status\tShared Gate\t22\n'
        ;;
      required-status-any-latest-passed | required-status-pass-check-fail | required-status-fail-check-pass)
        printf 'status\tShared Gate\tany\n'
        ;;
      required-workflow-delayed | required-workflow-same-job-passed)
        printf 'workflow\t101\t.github/workflows/a.yml\tmain\n'
        printf 'workflow\t102\t.github/workflows/b.yml\tmain\n'
        ;;
      required-workflow-version-delayed)
        printf 'workflow\t103\t.github/workflows/shared.yml\tv1\n'
        printf 'workflow\t103\t.github/workflows/shared.yml\tv2\n'
        ;;
      required-workflow-superseded-passed | required-workflow-duplicate-job-failed | required-workflow-partial-rerun-failed)
        printf 'workflow\t103\t.github/workflows/shared.yml\tmain\n'
        ;;
      required-workflow-queued-rerun)
        printf 'workflow\t103\t.github/workflows/shared.yml\tmain\n'
        ;;
      required-workflow-cancelled-unstarted-superseded | required-workflow-cancelled-unstarted-latest | required-workflow-startup-failure-latest)
        printf 'workflow\t103\t.github/workflows/shared.yml\tmain\n'
        ;;
      required-workflow-ref-moved)
        printf 'workflow\t103\t.github/workflows/shared.yml\tmain\n'
        ;;
      required-config-changed)
        if [ -s "${GH_CALL_LOG:?GH_CALL_LOG must be set}" ]; then
          printf 'status\tLate Gate\t77\n'
        fi
        printf 'call\n' >> "$GH_CALL_LOG"
        ;;
      no-config-zero-runs | no-config-optional-only) ;;
    esac
    exit 0
  fi
  if [ "${1:-}" = pr ] && [ "${2:-}" = checks ]; then
    case "$GH_SCENARIO" in
      required-check-failed) printf 'Test Gate\tfail\n'; exit 0 ;;
      required-check-passed) printf 'Test Gate\tpass\n'; exit 0 ;;
      required-check-state-changed)
        if [ -s "${GH_CHECK_LOG:?GH_CHECK_LOG must be set}" ]; then
          printf 'Test Gate\tpending\n'
        else
          printf 'Test Gate\tpass\n'
        fi
        printf 'call\n' >> "$GH_CHECK_LOG"
        exit 0
        ;;
      required-check-delayed) printf "no required checks reported on the 'feature' branch\n" >&2 ;;
      required-workflow-delayed | required-workflow-same-job-passed | required-workflow-duplicate-job-failed | required-workflow-partial-rerun-failed | required-workflow-superseded-passed | required-workflow-queued-rerun | required-workflow-cancelled-unstarted-superseded | required-workflow-cancelled-unstarted-latest | required-workflow-startup-failure-latest | required-workflow-version-delayed | required-workflow-ref-moved)
        printf 'A job 1\tpass\n'
        printf 'A job 2\tpass\n'
        exit 0
        ;;
      *) echo "unexpected checks query without configured requirements" >&2; exit 2 ;;
    esac
    exit 1
  fi
  ;;
esac

if [ "${1:-}" != "pr" ] || [ "${2:-}" != "list" ]; then
  echo "unexpected gh command: $*" >&2
  exit 2
fi

case "${GH_SCENARIO:?GH_SCENARIO must be set}" in
  open-pr)
    printf '324\thttps://github.com/example/project/pull/324\trelease/1.x\tfeature\n'
    ;;
  no-pr)
    ;;
  retargeted-pr)
    printf '324\thttps://github.com/example/project/pull/324\tmain\tfeature\n'
    ;;
  replaced-pr)
    printf '325\thttps://github.com/example/project/pull/325\trelease/1.x\tfeature\n'
    ;;
  changed-head)
    printf '324\thttps://github.com/example/project/pull/324\trelease/1.x\tfeature-renamed\n'
    ;;
  post-push-retarget)
    call_count=0
    if [ -f "${GH_CALL_LOG:?GH_CALL_LOG must be set}" ]; then
      call_count="$(wc -l < "$GH_CALL_LOG" | tr -d '[:space:]')"
    fi
    printf 'call\n' >> "$GH_CALL_LOG"
    if [ "$call_count" -eq 0 ]; then
      printf '324\thttps://github.com/example/project/pull/324\trelease/1.x\tfeature\n'
    else
      printf '324\thttps://github.com/example/project/pull/324\tmain\tfeature\n'
    fi
    ;;
  multiple-prs)
    printf '324\thttps://github.com/example/project/pull/324\trelease/1.x\tfeature\n'
    printf '325\thttps://github.com/example/project/pull/325\tmain\tfeature\n'
    ;;
  *)
    echo "unknown GH_SCENARIO: $GH_SCENARIO" >&2
    exit 2
    ;;
esac
STUB
chmod +x "$FAKE_BIN/gh"

build_sandbox() {
  local name="$1" base origin seed clone
  base="$TMP_ROOT/$name"
  origin="$base/origin.git"
  seed="$base/seed"
  clone="$base/clone"
  mkdir -p "$base"
  git init -q --bare "$origin"
  git init -q -b main "$seed"
  printf 'target violation\n' >"$seed/failing-source.txt"
  printf 'rule input\n' >"$seed/lint-rule.txt"
  printf '#!/usr/bin/env bash\nexit 1\n' >"$seed/lint-runner.sh"
  git -C "$seed" add failing-source.txt lint-rule.txt lint-runner.sh
  git -C "$seed" "${GIT_ID[@]}" commit -q -m common
  git -C "$seed" remote add origin "$origin"
  git -C "$seed" push -q -u origin main

  git -C "$seed" switch -q -c release/1.x
  git -C "$seed" "${GIT_ID[@]}" commit -q --allow-empty -m release-only
  git -C "$seed" push -q -u origin release/1.x
  SANDBOX_RELEASE_SHA="$(git -C "$seed" rev-parse HEAD)"

  git -C "$seed" switch -q main
  git -C "$seed" "${GIT_ID[@]}" commit -q --allow-empty -m default-only
  git -C "$seed" push -q
  SANDBOX_DEFAULT_SHA="$(git -C "$seed" rev-parse HEAD)"

  git --git-dir="$origin" symbolic-ref HEAD refs/heads/main
  git clone -q "$origin" "$clone"
  git -C "$clone" config user.email test@example.com
  git -C "$clone" config user.name test
  git -C "$clone" switch -q -c feature HEAD~1
  printf 'feature behavior\n' >"$clone/feature.txt"
  git -C "$clone" add feature.txt
  git -C "$clone" commit -q -m feature
  git -C "$clone" push -q -u origin feature
  SANDBOX_CLONE="$clone"
}

if [ ! -x "$HELPER" ]; then
  fail "missing executable helper: $HELPER"
else
  build_sandbox pr-target
  clone="$SANDBOX_CLONE"
  RELEASE_SHA="$SANDBOX_RELEASE_SHA"
  DEFAULT_SHA="$SANDBOX_DEFAULT_SHA"
  context="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=open-pr "$HELPER" resolve main)"
  IFS=$'\t' read -r mode branch base_ref pr_number pr_url head_ref <<< "$context"
  assert_equal "$mode" "pull-request" "open PR should select the pushed workflow"
  assert_equal "$branch" "feature" "current branch should be retained"
  assert_equal "$base_ref" "origin/release/1.x" "PR target should override both explicit and default bases"
  assert_equal "$pr_number" "324" "open PR number should be reported"
  assert_equal "$pr_url" "https://github.com/example/project/pull/324" "open PR URL should be reported"
  assert_equal "$head_ref" "feature" "open PR head should be reported"

  if multiple_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=multiple-prs \
    "$HELPER" resolve 2>&1)"; then
    fail "multiple-PR context unexpectedly selected a base"
  elif ! grep -Fq "found 2 open pull requests" <<< "$multiple_output"; then
    fail "multiple-PR refusal was not actionable: $multiple_output"
  fi

  git -C "$clone" fetch -q origin release/1.x
  git -C "$clone" merge -q --no-ff "$base_ref" -m "merge release target"
  git -C "$clone" merge-base --is-ancestor "$RELEASE_SHA" HEAD ||
    fail "non-default PR target commit was not merged"
  if git -C "$clone" merge-base --is-ancestor "$DEFAULT_SHA" HEAD; then
    fail "default-only commit was introduced while merging a non-default PR target"
  fi

  git -C "$clone" "${GIT_ID[@]}" commit -q --allow-empty -m local-update
  if ! push_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=open-pr \
    "$HELPER" push "$pr_number" "$base_ref" "$head_ref" 2>&1)"; then
    fail "open PR push failed unexpectedly: $push_output"
  else
    remote_sha="$(git --git-dir="$TMP_ROOT/pr-target/origin.git" rev-parse refs/heads/feature)"
    local_sha="$(git -C "$clone" rev-parse HEAD)"
    assert_equal "$remote_sha" "$local_sha" "successful open PR path should update the configured remote branch"
  fi

  git -C "$clone" "${GIT_ID[@]}" commit -q --allow-empty -m another-local-update
  git -C "$clone" remote set-url origin "$TMP_ROOT/missing-origin.git"
  if push_failure="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=open-pr \
    "$HELPER" push "$pr_number" "$base_ref" "$head_ref" 2>&1)"; then
    fail "push failure scenario unexpectedly succeeded"
  elif ! grep -Fq "git push origin HEAD:feature" <<< "$push_failure"; then
    fail "push failure did not report the exact failed command: $push_failure"
  fi

  git -C "$clone" remote set-url origin "$TMP_ROOT/pr-target/origin.git"
  assert_context_change_blocks_push \
    retargeted-pr \
    "target changed from release/1.x to main" \
    "changed PR target"
  assert_context_change_blocks_push \
    replaced-pr \
    "pull request changed from #324 to #325" \
    "changed PR identity"
  assert_context_change_blocks_push \
    changed-head \
    "head changed from feature to feature-renamed" \
    "changed PR head"

  post_push_log="$TMP_ROOT/gh-post-push.log"
  if post_push_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=post-push-retarget GH_CALL_LOG="$post_push_log" \
    "$HELPER" push "$pr_number" "$base_ref" "$head_ref" 2>&1)"; then
    fail "post-push PR context change unexpectedly reported success"
  elif ! grep -Fq "succeeded, but pull request context changed" <<< "$post_push_output"; then
    fail "post-push PR context change was not reported as indeterminate: $post_push_output"
  elif grep -Fq "Updated pull request" <<< "$post_push_output"; then
    fail "post-push PR context change incorrectly claimed the pull request was updated"
  fi
  remote_sha="$(git --git-dir="$TMP_ROOT/pr-target/origin.git" rev-parse refs/heads/feature)"
  local_sha="$(git -C "$clone" rev-parse HEAD)"
  assert_equal "$remote_sha" "$local_sha" "post-push context change should still report that the remote branch moved"

  build_sandbox no-pr
  clone="$SANDBOX_CLONE"
  explicit_context="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=no-pr "$HELPER" resolve release/1.x)"
  IFS=$'\t' read -r mode _ base_ref _ <<< "$explicit_context"
  assert_equal "$mode" "local-only" "no-PR explicit-base path should remain local-only"
  assert_equal "$base_ref" "origin/release/1.x" "no-PR explicit base should be preserved"

  default_context="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=no-pr "$HELPER" resolve)"
  IFS=$'\t' read -r mode _ base_ref _ <<< "$default_context"
  assert_equal "$mode" "local-only" "no-PR default-base path should remain local-only"
  assert_equal "$base_ref" "origin/main" "no-PR fallback should use origin/HEAD"

  before_push="$(git --git-dir="$TMP_ROOT/no-pr/origin.git" rev-parse refs/heads/feature)"
  if no_pr_push="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=no-pr \
    "$HELPER" push 324 origin/release/1.x feature 2>&1)"; then
    fail "no-PR path should refuse remote updates"
  elif ! grep -Fq "no open pull request" <<< "$no_pr_push"; then
    fail "no-PR push refusal was not actionable: $no_pr_push"
  fi
  after_push="$(git --git-dir="$TMP_ROOT/no-pr/origin.git" rev-parse refs/heads/feature)"
  assert_equal "$after_push" "$before_push" "no-PR path should leave the remote branch unchanged"

  conflict_root="$TMP_ROOT/conflict-skills"
  mkdir -p "$conflict_root/resolving-merge-conflicts"
  touch "$conflict_root/resolving-merge-conflicts/SKILL.md"
  if ! conflict_path="$(UPDATE_BRANCH_SKILLS_DIR="$conflict_root" "$HELPER" require-conflict-skill)"; then
    fail "available conflict skill was not resolved"
  else
    assert_equal "$conflict_path" "$conflict_root/resolving-merge-conflicts/SKILL.md" \
      "conflict delegation should resolve the declared skill"
  fi

  if missing_conflict="$(UPDATE_BRANCH_SKILLS_DIR="$TMP_ROOT/missing-skills" "$HELPER" require-conflict-skill 2>&1)"; then
    fail "missing conflict skill scenario unexpectedly succeeded"
  elif ! grep -Fq "mattpocock/skills@resolving-merge-conflicts" <<< "$missing_conflict"; then
    fail "missing conflict skill error did not include installation guidance: $missing_conflict"
  fi

  scoped_pass="$TMP_ROOT/scoped-pass.sh"
  cat >"$scoped_pass" <<'VERIFY'
#!/usr/bin/env bash
set -euo pipefail
test "$(cat feature.txt)" = 'feature behavior'
VERIFY
  chmod +x "$scoped_pass"

  scoped_blocked="$TMP_ROOT/scoped-blocked.sh"
  cat >"$scoped_blocked" <<'VERIFY'
#!/usr/bin/env bash
exit 19
VERIFY
  chmod +x "$scoped_blocked"

  broad_failure="$TMP_ROOT/broad-failure.sh"
  cat >"$broad_failure" <<'VERIFY'
#!/usr/bin/env bash
grep -Fq 'target violation' failing-source.txt
exit 23
VERIFY
  chmod +x "$broad_failure"

  build_sandbox target-owned-verification
  clone="$SANDBOX_CLONE"
  git -C "$clone" fetch -q origin release/1.x
  git -C "$clone" merge -q --no-commit --no-ff origin/release/1.x
  if ! verification_output="$(cd "$clone" && "$VERIFY_HELPER" \
    --message 'chore: #324 merge release target' \
    --target origin/release/1.x \
    --scoped "$scoped_pass" \
    --broad "$broad_failure" \
    --contract 'house lint rejects target-owned source' \
    --evidence failing-source.txt \
    --evidence lint-rule.txt \
    --evidence lint-runner.sh 2>&1)"; then
    fail "target-owned broad failure blocked the verified merge: $verification_output"
  elif ! grep -Fq 'outcome=target-owned' <<< "$verification_output"; then
    fail "target-owned outcome was not recorded: $verification_output"
  fi
  if [ "$(git -C "$clone" rev-list --parents -n1 HEAD | wc -w | tr -d '[:space:]')" != '3' ]; then
    fail 'target-owned broad failure did not create a merge commit'
  fi
  context="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=open-pr "$HELPER" resolve)"
  IFS=$'\t' read -r _ _ base_ref pr_number _ head_ref <<< "$context"
  if ! (cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=open-pr \
    "$HELPER" push "$pr_number" "$base_ref" "$head_ref") >/dev/null; then
    fail 'target-owned broad failure prevented the verified merge from being pushed'
  fi
  assert_equal \
    "$(git --git-dir="$TMP_ROOT/target-owned-verification/origin.git" rev-parse refs/heads/feature)" \
    "$(git -C "$clone" rev-parse HEAD)" \
    'target-owned scenario should push the verified merge'
  pushed_head="$(git -C "$clone" rev-parse HEAD)"
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-check-failed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'failed required check on the pushed merge unexpectedly passed readiness'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "pushed-head required-check failure was not recorded: $check_output"
  fi
  if ! check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-check-passed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail "passing configured required check did not satisfy readiness: $check_output"
  elif ! grep -Fq 'outcome=required-checks-passed configured=1' <<< "$check_output"; then
    fail "passing configured required check was not recorded: $check_output"
  fi
  for empty_scenario in no-config-zero-runs no-config-optional-only; do
    if ! check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
      GH_SCENARIO="$empty_scenario" EXPECTED_HEAD="$pushed_head" \
      "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
      fail "$empty_scenario did not satisfy an empty required-check set: $check_output"
    elif ! grep -Fq 'outcome=required-checks-passed configured=0' <<< "$check_output"; then
      fail "$empty_scenario did not record an empty passing outcome: $check_output"
    fi
  done
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-check-delayed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'configured required check that had not registered unexpectedly passed readiness'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "delayed required check was not recorded as non-pass: $check_output"
  fi
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-status-app-delayed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'one app masked a second delayed app-qualified status requirement'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "delayed app-qualified status check was not recorded as non-pass: $check_output"
  fi
  if ! check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-status-app-context-passed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail "qualifying app-owned StatusContext did not satisfy readiness: $check_output"
  elif ! grep -Fq 'outcome=required-checks-passed configured=1' <<< "$check_output"; then
    fail "qualifying app-owned StatusContext was not recorded: $check_output"
  fi
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-status-app-context-wrong-source EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'wrong-source StatusContext unexpectedly satisfied an app-qualified requirement'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "wrong-source StatusContext omission was not recorded as non-pass: $check_output"
  fi
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-status-app-context-ambiguous EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'one source-less StatusContext satisfied two app-qualified requirements'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "ambiguous app-owned StatusContext was not recorded as non-pass: $check_output"
  fi
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-status-app-context-ambiguous-failed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'passing app checks masked an ambiguous required StatusContext failure'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "ambiguous required StatusContext failure was not recorded: $check_output"
  fi
  if ! check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-status-any-latest-passed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail "newer passing app did not satisfy any-source status requirement: $check_output"
  elif ! grep -Fq 'outcome=required-checks-passed configured=1' <<< "$check_output"; then
    fail "any-source latest passing result was not recorded: $check_output"
  fi
  for mixed_scenario in required-status-pass-check-fail required-status-fail-check-pass; do
    if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
      GH_SCENARIO="$mixed_scenario" EXPECTED_HEAD="$pushed_head" \
      "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
      fail "$mixed_scenario let one observation type mask the other"
    elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
      fail "$mixed_scenario was not recorded as non-pass: $check_output"
    fi
  done
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-workflow-delayed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'multiple jobs from one workflow masked a second delayed required workflow'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "delayed required workflow was not recorded as non-pass: $check_output"
  fi
  if ! check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-workflow-same-job-passed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail "two passing required workflows with the same job name were not accepted: $check_output"
  elif ! grep -Fq 'outcome=required-checks-passed configured=2' <<< "$check_output"; then
    fail "same-job required workflows did not record a passing outcome: $check_output"
  fi
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-workflow-duplicate-job-failed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'passing duplicate-name job hid a failure in the same required workflow execution'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "duplicate-name workflow job failure was not recorded: $check_output"
  fi
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-workflow-partial-rerun-failed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'partial rerun hid a failed job omitted from the latest workflow attempt'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "partial-rerun workflow failure was not recorded: $check_output"
  fi
  if ! check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-workflow-superseded-passed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail "superseded workflow revision blocked the configured passing revision: $check_output"
  elif ! grep -Fq 'outcome=required-checks-passed configured=1' <<< "$check_output"; then
    fail "configured passing workflow revision was not recorded: $check_output"
  fi
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-workflow-queued-rerun EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'queued rerun without startedAt was hidden by an older passing run'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "queued required-workflow rerun was not recorded as non-pass: $check_output"
  fi
  if ! check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-workflow-cancelled-unstarted-superseded EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail "completed unstarted cancellation hid a newer passing run: $check_output"
  elif ! grep -Fq 'outcome=required-checks-passed configured=1' <<< "$check_output"; then
    fail "newer pass after unstarted cancellation was not recorded: $check_output"
  fi
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-workflow-cancelled-unstarted-latest EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'newer completed unstarted cancellation was hidden by an older passing run'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "newer unstarted cancellation was not recorded as non-pass: $check_output"
  fi
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-workflow-startup-failure-latest EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'newer completed startup failure was hidden by an older passing run'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "newer startup failure was not recorded as non-pass: $check_output"
  fi
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-workflow-version-delayed EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'one workflow revision masked a second delayed required revision'
  elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
    fail "delayed required workflow revision was not recorded as non-pass: $check_output"
  fi
  workflow_ref_log="$TMP_ROOT/required-workflow-ref-calls.log"
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-workflow-ref-moved GH_WORKFLOW_REF_LOG="$workflow_ref_log" \
    EXPECTED_HEAD="$pushed_head" "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'moving required-workflow ref did not invalidate the snapshot'
  elif ! grep -Fq 'reason=required-workflow-resolution-changed' <<< "$check_output"; then
    fail "moving required-workflow ref was not identified: $check_output"
  fi
  config_log="$TMP_ROOT/required-config-calls.log"
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-config-changed GH_CALL_LOG="$config_log" EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'required-check configuration changed during capture but the snapshot passed'
  elif ! grep -Fq 'reason=required-check-configuration-changed' <<< "$check_output"; then
    fail "required-check configuration change was not identified: $check_output"
  fi
  check_log="$TMP_ROOT/required-check-calls.log"
  if check_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=required-check-state-changed GH_CHECK_LOG="$check_log" EXPECTED_HEAD="$pushed_head" \
    "$REQUIRED_CHECKS" --pr 324 --head "$pushed_head" 2>&1)"; then
    fail 'required check changed from pass to pending during capture but the snapshot passed'
  elif ! grep -Fq 'reason=required-check-observations-changed' <<< "$check_output"; then
    fail "required-check observation change was not identified: $check_output"
  fi

  build_sandbox hook-mutated-verification
  clone="$SANDBOX_CLONE"
  cat >"$clone/.git/hooks/pre-commit" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
printf 'hook output\n' >hook-output.txt
git add hook-output.txt
HOOK
  chmod +x "$clone/.git/hooks/pre-commit"
  git -C "$clone" fetch -q origin release/1.x
  git -C "$clone" merge -q --no-commit --no-ff origin/release/1.x
  if ! hook_output="$(cd "$clone" && "$VERIFY_HELPER" \
    --message 'chore: #324 merge release target' \
    --target origin/release/1.x \
    --scoped "$scoped_pass" \
    --broad "$broad_failure" \
    --contract 'house lint rejects target-owned source' \
    --evidence failing-source.txt \
    --evidence lint-rule.txt \
    --evidence lint-runner.sh 2>&1)"; then
    fail "commit-hook tree change was not reverified: $hook_output"
  elif ! grep -Fq 'post-commit-reverified=true' <<< "$hook_output"; then
    fail "commit-hook re-verification was not recorded: $hook_output"
  elif [ "$(git -C "$clone" show HEAD:hook-output.txt)" != 'hook output' ]; then
    fail 'commit-hook output was not present in the reverified merge commit'
  fi

  build_sandbox branch-caused-verification
  clone="$SANDBOX_CLONE"
  printf 'branch interaction\n' >>"$clone/failing-source.txt"
  git -C "$clone" add failing-source.txt
  git -C "$clone" commit -q -m 'change failing input'
  git -C "$clone" push -q
  pre_head="$(git -C "$clone" rev-parse HEAD)"
  git -C "$clone" fetch -q origin release/1.x
  git -C "$clone" merge -q --no-commit --no-ff origin/release/1.x
  if branch_output="$(cd "$clone" && "$VERIFY_HELPER" \
    --message 'chore: #324 merge release target' \
    --target origin/release/1.x \
    --scoped "$scoped_pass" \
    --broad "$broad_failure" \
    --contract 'house lint rejects target-owned source' \
    --evidence failing-source.txt \
    --evidence lint-rule.txt \
    --evidence lint-runner.sh 2>&1)"; then
    fail 'branch-caused broad failure unexpectedly committed the merge'
  elif ! grep -Fq 'reason=branch-caused' <<< "$branch_output"; then
    fail "branch-caused failure was not identified: $branch_output"
  fi
  assert_merge_aborted "$clone" "$pre_head" 'branch-caused broad failure'

  build_sandbox scoped-verification-blocked
  clone="$SANDBOX_CLONE"
  pre_head="$(git -C "$clone" rev-parse HEAD)"
  git -C "$clone" fetch -q origin release/1.x
  git -C "$clone" merge -q --no-commit --no-ff origin/release/1.x
  if scoped_output="$(cd "$clone" && "$VERIFY_HELPER" \
    --message 'chore: #324 merge release target' \
    --target origin/release/1.x \
    --scoped "$scoped_blocked" \
    --broad "$broad_failure" \
    --contract 'house lint rejects target-owned source' \
    --evidence failing-source.txt \
    --evidence lint-rule.txt \
    --evidence lint-runner.sh 2>&1)"; then
    fail 'unavailable scoped verification unexpectedly committed the merge'
  elif ! grep -Fq 'reason=scoped-verification-failed' <<< "$scoped_output"; then
    fail "scoped verification blocker was not identified: $scoped_output"
  fi
  assert_merge_aborted "$clone" "$pre_head" 'unavailable scoped verification'

  build_sandbox mandatory-broad-verification
  clone="$SANDBOX_CLONE"
  pre_head="$(git -C "$clone" rev-parse HEAD)"
  git -C "$clone" fetch -q origin release/1.x
  git -C "$clone" merge -q --no-commit --no-ff origin/release/1.x
  if mandatory_output="$(cd "$clone" && "$VERIFY_HELPER" \
    --message 'chore: #324 merge release target' \
    --target origin/release/1.x \
    --broad-required \
    --scoped "$scoped_pass" \
    --broad "$broad_failure" \
    --contract 'house lint rejects target-owned source' \
    --evidence failing-source.txt \
    --evidence lint-rule.txt \
    --evidence lint-runner.sh 2>&1)"; then
    fail 'mandatory broad failure unexpectedly committed the merge'
  elif ! grep -Fq 'reason=required-broad-verification-failed' <<< "$mandatory_output"; then
    fail "mandatory broad failure was not identified: $mandatory_output"
  fi
  assert_merge_aborted "$clone" "$pre_head" 'mandatory broad failure'
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT update-branch assertion(s) failed" >&2
  exit 1
fi

echo "OK: update-branch behavior assertions passed"
