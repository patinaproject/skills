#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HELPER="$REPO_ROOT/skills/update-branch/scripts/update-context.sh"
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
    "$HELPER" push "$pr_number" "$base_ref" "$head_ref" "$base_repo" "$head_repo" 2>&1)"; then
    fail "$description scenario unexpectedly succeeded"
  elif ! grep -Fq "$expected_message" <<< "$output"; then
    fail "$description error was not actionable: $output"
  fi
  after="$(git --git-dir="$origin" rev-parse refs/heads/feature)"
  assert_equal "$after" "$before" "$description should block the remote update"
}

assert_identity_refusal() {
  local scenario="$1" message="$2" output before after
  shift 2
  before="$(git -C "$clone" rev-parse HEAD; for repo in "$identity_fixture"/*.git; do git --git-dir="$repo" rev-parse feature; done)"
  if output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO="$scenario" "$HELPER" "$@" 2>&1)"; then
    fail "repository mismatch unexpectedly succeeded: $*"
  elif ! grep -Fq "$message" <<< "$output"; then
    fail "repository mismatch refusal was not actionable: $output"
  elif grep -Fq "Updated pull request" <<< "$output"; then
    fail "repository mismatch falsely reported a PR update"
  fi
  after="$(git -C "$clone" rev-parse HEAD; for repo in "$identity_fixture"/*.git; do git --git-dir="$repo" rev-parse feature; done)"
  assert_equal "$after" "$before" "repository mismatch should preserve local and all remote heads"
}

FAKE_BIN="$TMP_ROOT/bin"
mkdir -p "$FAKE_BIN"
export REAL_GIT
REAL_GIT="$(command -v git)"
cat > "$FAKE_BIN/git" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
if [ "${1:-}" = remote ] && [ "${2:-}" = get-url ]; then
  urls="$("$REAL_GIT" "$@")"
  while IFS= read -r url; do
    case "$url" in
      */origin.git|*/missing-origin.git) printf 'https://github.com/example/project.git\n' ;;
      */fork.git) printf 'git@github.com:contributor/project.git\n' ;;
      */unrelated.git) printf 'ssh://git@github.com/other/project.git\n' ;;
      *) printf '%s\n' "$url" ;;
    esac
  done <<< "$urls"
else
  exec "$REAL_GIT" "$@"
fi
STUB
chmod +x "$FAKE_BIN/git"
cat > "$FAKE_BIN/gh" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" != "pr" ] || [ "${2:-}" != "list" ]; then
  echo "unexpected gh command: $*" >&2
  exit 2
fi

case "${GH_SCENARIO:?GH_SCENARIO must be set}" in
  open-pr)
    printf '324\thttps://github.com/example/project/pull/324\trelease/1.x\tfeature\texample/project\n'
    ;;
  no-pr)
    ;;
  retargeted-pr)
    printf '324\thttps://github.com/example/project/pull/324\tmain\tfeature\texample/project\n'
    ;;
  replaced-pr)
    printf '325\thttps://github.com/example/project/pull/325\trelease/1.x\tfeature\texample/project\n'
    ;;
  changed-head)
    printf '324\thttps://github.com/example/project/pull/324\trelease/1.x\tfeature-renamed\texample/project\n'
    ;;
  post-push-retarget|post-push-repository|post-push-lookup-failure)
    call_count=0
    if [ -f "${GH_CALL_LOG:?GH_CALL_LOG must be set}" ]; then
      call_count="$(wc -l < "$GH_CALL_LOG" | tr -d '[:space:]')"
    fi
    printf 'call\n' >> "$GH_CALL_LOG"
    if [ "$call_count" -eq 0 ]; then
      printf '324\thttps://github.com/example/project/pull/324\trelease/1.x\tfeature\texample/project\n'
    elif [ "$GH_SCENARIO" = post-push-repository ]; then
      printf '324\thttps://github.com/example/project/pull/324\trelease/1.x\tfeature\tcontributor/project\n'
    elif [ "$GH_SCENARIO" = post-push-lookup-failure ]; then
      exit 1
    else
      printf '324\thttps://github.com/example/project/pull/324\tmain\tfeature\texample/project\n'
    fi
    ;;
  multiple-prs)
    printf '324\thttps://github.com/example/project/pull/324\trelease/1.x\tfeature\texample/project\n'
    printf '325\thttps://github.com/example/project/pull/325\tmain\tfeature\texample/project\n'
    ;;
  fork-pr)
    printf '324\thttps://github.com/example/project/pull/324\trelease/1.x\tfeature\tcontributor/project\n'
    ;;
  fork-name-collision)
    printf '323\thttps://github.com/example/project/pull/323\tmain\tfeature\tother/project\n'
    printf '324\thttps://github.com/example/project/pull/324\trelease/1.x\tfeature\tcontributor/project\n'
    ;;
  missing-head-repository)
    printf '324\thttps://github.com/example/project/pull/324\trelease/1.x\tfeature\t-\n'
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
  git -C "$seed" "${GIT_ID[@]}" commit -q --allow-empty -m common
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
  git -C "$clone" push -q -u origin feature
  SANDBOX_CLONE="$clone"
}

if [ ! -x "$HELPER" ]; then
  fail "missing executable helper: $HELPER"
else
  install_repo="$TMP_ROOT/installed-skill"
  installed_helper="$install_repo/skills/update-branch/scripts/update-context.sh"
  mkdir -p "$(dirname "$installed_helper")"
  git init -q -b install-main "$install_repo"
  cp "$HELPER" "$installed_helper"
  chmod +x "$installed_helper"
  git -C "$install_repo" add skills/update-branch/scripts/update-context.sh
  git -C "$install_repo" "${GIT_ID[@]}" commit -q -m "install update-branch"
  install_head_before="$(git -C "$install_repo" rev-parse HEAD)"
  install_refs_before="$(git -C "$install_repo" show-ref)"

  build_sandbox installed-helper-consumer
  clone="$SANDBOX_CLONE"
  RELEASE_SHA="$SANDBOX_RELEASE_SHA"
  context="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=open-pr \
    "$installed_helper" resolve)"
  IFS=$'\t' read -r mode branch base_ref _ <<< "$context"
  assert_equal "$mode" "pull-request" "installed helper should resolve the consumer pull request"
  assert_equal "$branch" "feature" "installed helper should retain the consumer branch"
  assert_equal "$base_ref" "origin/release/1.x" "installed helper should select the consumer target"
  git -C "$clone" fetch -q origin release/1.x
  git -C "$clone" merge -q --no-ff "$base_ref" -m "merge installed-helper target"
  git -C "$clone" merge-base --is-ancestor "$RELEASE_SHA" HEAD ||
    fail "installed helper target was not merged into the consumer branch"
  assert_equal "$(git -C "$clone" branch --show-current)" "feature" \
    "installed helper workflow should leave the consumer branch checked out"
  assert_equal "$(git -C "$install_repo" rev-parse HEAD)" "$install_head_before" \
    "installed helper workflow should preserve the install repository head"
  assert_equal "$(git -C "$install_repo" show-ref)" "$install_refs_before" \
    "installed helper workflow should preserve the install repository refs"

  build_sandbox pr-target
  clone="$SANDBOX_CLONE"
  RELEASE_SHA="$SANDBOX_RELEASE_SHA"
  DEFAULT_SHA="$SANDBOX_DEFAULT_SHA"
  context="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=open-pr "$HELPER" resolve main)"
  IFS=$'\t' read -r mode branch base_ref pr_number pr_url head_ref base_repo head_repo <<< "$context"
  assert_equal "$mode" "pull-request" "open PR should select the pushed workflow"
  assert_equal "$branch" "feature" "current branch should be retained"
  assert_equal "$base_ref" "origin/release/1.x" "PR target should override both explicit and default bases"
  assert_equal "$pr_number" "324" "open PR number should be reported"
  assert_equal "$pr_url" "https://github.com/example/project/pull/324" "open PR URL should be reported"
  assert_equal "$head_ref" "feature" "open PR head should be reported"
  assert_equal "$base_repo" "github.com/example/project" "PR base repository should be captured"
  assert_equal "$head_repo" "github.com/example/project" "PR head repository should be captured"

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
    "$HELPER" push "$pr_number" "$base_ref" "$head_ref" "$base_repo" "$head_repo" 2>&1)"; then
    fail "open PR push failed unexpectedly: $push_output"
  else
    remote_sha="$(git --git-dir="$TMP_ROOT/pr-target/origin.git" rev-parse refs/heads/feature)"
    local_sha="$(git -C "$clone" rev-parse HEAD)"
    assert_equal "$remote_sha" "$local_sha" "successful open PR path should update the configured remote branch"
  fi

  git -C "$clone" "${GIT_ID[@]}" commit -q --allow-empty -m another-local-update
  git -C "$clone" remote set-url origin "$TMP_ROOT/missing-origin.git"
  if push_failure="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=open-pr \
    "$HELPER" push "$pr_number" "$base_ref" "$head_ref" "$base_repo" "$head_repo" 2>&1)"; then
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
  assert_context_change_blocks_push fork-pr "pull request repositories changed" "changed head repository"

  post_push_log="$TMP_ROOT/gh-post-push.log"
  if post_push_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" \
    GH_SCENARIO=post-push-retarget GH_CALL_LOG="$post_push_log" \
    "$HELPER" push "$pr_number" "$base_ref" "$head_ref" "$base_repo" "$head_repo" 2>&1)"; then
    fail "post-push PR context change unexpectedly reported success"
  elif ! grep -Fq "succeeded, but pull request context changed" <<< "$post_push_output"; then
    fail "post-push PR context change was not reported as indeterminate: $post_push_output"
  elif grep -Fq "Updated pull request" <<< "$post_push_output"; then
    fail "post-push PR context change incorrectly claimed the pull request was updated"
  fi
  remote_sha="$(git --git-dir="$TMP_ROOT/pr-target/origin.git" rev-parse refs/heads/feature)"
  local_sha="$(git -C "$clone" rev-parse HEAD)"
  assert_equal "$remote_sha" "$local_sha" "post-push context change should still report that the remote branch moved"
  for scenario in post-push-repository post-push-lookup-failure; do
    git -C "$clone" "${GIT_ID[@]}" commit -q --allow-empty -m "$scenario"
    if output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO="$scenario" \
      GH_CALL_LOG="$TMP_ROOT/$scenario.log" "$HELPER" push "$pr_number" "$base_ref" "$head_ref" "$base_repo" "$head_repo" 2>&1)"; then
      fail "$scenario unexpectedly reported success"
    elif ! grep -Fq "the remote branch moved and the pull request update is indeterminate" <<< "$output"; then
      fail "$scenario did not report uncertainty: $output"
    elif grep -Fq "Updated pull request" <<< "$output"; then
      fail "$scenario falsely reported a PR update"
    fi
    assert_equal "$(git --git-dir="$TMP_ROOT/pr-target/origin.git" rev-parse feature)" \
      "$(git -C "$clone" rev-parse HEAD)" "$scenario should report the completed remote update"
  done

  build_sandbox repository-identity
  clone="$SANDBOX_CLONE"
  identity_fixture="$TMP_ROOT/repository-identity"
  git clone -q --bare "$identity_fixture/origin.git" "$identity_fixture/fork.git"
  git clone -q --bare "$identity_fixture/origin.git" "$identity_fixture/unrelated.git"
  git -C "$clone" remote add unrelated "$identity_fixture/unrelated.git"
  git -C "$clone" "${GIT_ID[@]}" commit -q --allow-empty -m identity-update
  git -C "$clone" config branch.feature.remote unrelated
  assert_identity_refusal open-pr "push remote unrelated does not match" resolve
  assert_identity_refusal open-pr "push remote unrelated does not match" \
    push 324 origin/release/1.x feature github.com/example/project github.com/example/project

  git -C "$clone" config branch.feature.remote origin
  git -C "$clone" config branch.feature.merge refs/heads/other
  assert_identity_refusal open-pr "does not match pull request head feature" resolve
  git -C "$clone" config branch.feature.merge refs/heads/feature
  git -C "$clone" remote set-url --push origin "$identity_fixture/unrelated.git"
  assert_identity_refusal open-pr "push remote origin does not match" \
    push 324 origin/release/1.x feature github.com/example/project github.com/example/project
  git -C "$clone" remote set-url --push origin "$identity_fixture/origin.git"
  git -C "$clone" remote set-url --add --push origin "$identity_fixture/unrelated.git"
  assert_identity_refusal open-pr "cannot identify a single push destination" resolve
  git -C "$clone" config --unset-all remote.origin.pushurl

  git -C "$clone" remote set-url origin "$identity_fixture/unrelated.git"
  assert_identity_refusal open-pr "no fetch remote matches" resolve
  assert_identity_refusal open-pr "base fetch remote does not match" \
    push 324 origin/release/1.x feature github.com/example/project github.com/example/project
  git -C "$clone" remote set-url origin "$identity_fixture/origin.git"
  assert_identity_refusal missing-head-repository "cannot identify pull request head repository" resolve

  git -C "$clone" remote rename origin upstream
  git -C "$clone" remote add origin "$identity_fixture/fork.git"
  git -C "$clone" config branch.feature.remote origin
  context="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=fork-name-collision \
    "$HELPER" resolve main)"
  IFS=$'\t' read -r mode branch base_ref pr_number pr_url head_ref base_repo head_repo <<< "$context"
  assert_equal "$pr_number" "324" "fork PR lookup should select the configured head repository"
  assert_equal "$base_ref" "upstream/release/1.x" "fork PR collision should retain the selected PR target"
  assert_equal "$head_repo" "github.com/contributor/project" \
    "fork PR collision should retain the configured head repository"

  context="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=fork-pr "$HELPER" resolve main)"
  IFS=$'\t' read -r mode branch base_ref pr_number pr_url head_ref base_repo head_repo <<< "$context"
  assert_equal "$base_ref" "upstream/release/1.x" "fork PR should select the base repository's remote"
  assert_equal "$head_repo" "github.com/contributor/project" "fork PR should capture its distinct head repository"
  git -C "$clone" fetch -q upstream release/1.x
  git -C "$clone" merge -q --no-ff "$base_ref" -m "merge fork PR base"
  git -C "$clone" merge-base --is-ancestor "$SANDBOX_RELEASE_SHA" HEAD || fail "fork PR base was not merged"
  before="$(git --git-dir="$identity_fixture/origin.git" rev-parse feature)"
  push_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=fork-name-collision \
    "$HELPER" push "$pr_number" "$base_ref" "$head_ref" "$base_repo" "$head_repo")"
  assert_equal "$(git --git-dir="$identity_fixture/fork.git" rev-parse feature)" \
    "$(git -C "$clone" rev-parse HEAD)" "fork PR push should update the actual head repository"
  assert_equal "$(git --git-dir="$identity_fixture/origin.git" rev-parse feature)" "$before" \
    "fork PR push should preserve same-named branch in the base repository"

  build_sandbox no-pr
  clone="$SANDBOX_CLONE"
  no_pr_clone="$clone"
  explicit_context="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=no-pr "$HELPER" resolve release/1.x)"
  IFS=$'\t' read -r mode _ base_ref _ <<< "$explicit_context"
  assert_equal "$mode" "local-only" "no-PR explicit-base path should remain local-only"
  assert_equal "$base_ref" "origin/release/1.x" "no-PR explicit base should be preserved"

  default_context="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=no-pr "$HELPER" resolve)"
  IFS=$'\t' read -r mode _ base_ref _ <<< "$default_context"
  assert_equal "$mode" "local-only" "no-PR default-base path should remain local-only"
  assert_equal "$base_ref" "origin/main" "no-PR fallback should use origin/HEAD"

  build_sandbox missing-origin
  clone="$SANDBOX_CLONE"
  missing_origin_head="$(git -C "$clone" rev-parse HEAD)"
  git -C "$clone" remote remove origin
  if missing_origin_output="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=no-pr \
    "$HELPER" resolve release/1.x 2>&1)"; then
    fail "explicit target without origin unexpectedly resolved"
  elif ! grep -Fq "requires an origin remote" <<< "$missing_origin_output"; then
    fail "missing-origin refusal was not actionable: $missing_origin_output"
  fi
  assert_equal "$(git -C "$clone" rev-parse HEAD)" "$missing_origin_head" \
    "missing-origin refusal should preserve the consumer head"

  clone="$no_pr_clone"

  before_push="$(git --git-dir="$TMP_ROOT/no-pr/origin.git" rev-parse refs/heads/feature)"
  if no_pr_push="$(cd "$clone" && PATH="$FAKE_BIN:$PATH" GH_SCENARIO=no-pr \
    "$HELPER" push 324 origin/release/1.x feature github.com/example/project github.com/example/project 2>&1)"; then
    fail "no-PR path should refuse remote updates"
  elif ! grep -Fq "no open pull request" <<< "$no_pr_push"; then
    fail "no-PR push refusal was not actionable: $no_pr_push"
  fi
  after_push="$(git --git-dir="$TMP_ROOT/no-pr/origin.git" rev-parse refs/heads/feature)"
  assert_equal "$after_push" "$before_push" "no-PR path should leave the remote branch unchanged"

  conflict_root="$TMP_ROOT/conflict-skills"
  mkdir -p "$conflict_root/fix-merge-conflicts"
  touch "$conflict_root/fix-merge-conflicts/SKILL.md"
  if ! conflict_path="$(UPDATE_BRANCH_SKILLS_DIR="$conflict_root" "$HELPER" require-conflict-skill)"; then
    fail "available conflict skill was not resolved"
  else
    assert_equal "$conflict_path" "$conflict_root/fix-merge-conflicts/SKILL.md" \
      "conflict delegation should resolve the declared skill"
  fi

  if missing_conflict="$(UPDATE_BRANCH_SKILLS_DIR="$TMP_ROOT/missing-skills" "$HELPER" require-conflict-skill 2>&1)"; then
    fail "missing conflict skill scenario unexpectedly succeeded"
  elif ! grep -Fq "fix-merge-conflicts is unavailable" <<< "$missing_conflict"; then
    fail "missing conflict skill error did not include installation guidance: $missing_conflict"
  fi
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT update-branch assertion(s) failed" >&2
  exit 1
fi

echo "OK: update-branch behavior assertions passed"
