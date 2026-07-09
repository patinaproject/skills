# Ready for Merge Workflow

**Goal:** Carry completed branch-local work through publication, checks, and
PR feedback until the pull request is ready to merge or every visible non-ready
state has a concrete disposition. A failing check is evidence to triage and
report, not a halt condition by itself.

## Preconditions

Use this workflow only after implementation is complete or the user explicitly
asks to finish, publish, or open a ready PR. Stay in the current working
directory's default `gh` repository.

## Operating Contract

Treat this as one durable, resumable workflow. The objective is to carry
completed branch-local work through PR publication, feedback, checks, and final
readiness without broadening into unrelated issue work or merging the pull
request.

The validation loop is the readiness loop below: inspect the current PR state,
handle currently available feedback, observe all visible checks, triage every
non-ready state, publish branch-local fixes when appropriate, and repeat on the
new head. End only when the final ready-to-merge gates pass or a documented
stop condition requires human input.

Progress reports should name the current checkpoint, evidence gathered, next
action, and blocker status. Keep stop reports concrete enough for a human to
decide the next move.

## Reporting Guidance

Progress reports and final handoffs should say whether the PR is ready to
merge, not ready to merge, or waiting on a human decision. Keep the full command
results, check snapshots, and gate evidence available for workflow decisions.
Report user-visible details when work failed, skipped, interrupted, otherwise
changes readiness, explains a blocker, identifies residual risk, or creates a
human next action.

Leave out exact verification commands, command inventories, pass counts, green
check names, and gate inventories when everything passes. Progress reports
should mention the current checkpoint and next action without repeated check
lists. Show exact commands, failed check names, skipped verification,
interrupted runs, or unresolved feedback only when they explain a blocker or
tell the human what to do next.

## Steps

1. Resolve context:

   - Current branch.
   - Issue number, preferably from the branch prefix.
   - Existing PR for the branch, if any.
   - Repository visibility and default branch.

   Ask before guessing when the issue is ambiguous.

2. Inspect changes:

   ```sh
   git status --short
   git diff --stat
   ```

   Stage exact relevant paths. Ask before including ambiguous or unrelated
   files. If there are no local changes and a PR already exists, continue with
   checks and feedback handling.

3. Verify locally using documented repository guidance. Prefer commands listed
   in `AGENTS.md`, README files, or package scripts. Do not invent expensive or
   unrelated checks when guidance is absent.

4. Commit, when there are staged changes, using the repository's required
   format. For this repository, use:

   ```text
   type: #<issue> short description
   ```

5. Push only when there are commits not present on the remote branch.

6. Create or update the PR:

   - Read `.github/pull_request_template.md`.
   - Use the repository's PR title format.
   - Include `Closes #<issue>` or another required closing keyword.
   - Write a reviewer-friendly PR body: summarize what changed and why in
     `What changed` instead of narrating the implementation transcript.
   - GitHub Checks are the source of truth for routine automated verification.
     Do not copy command transcripts or successful lint, test, type-check,
     hook, package, or similar command results into the PR body.
   - Include `Testing steps` only when a human reviewer has meaningful behavior
     or artifact verification to perform. Make each unchecked item
     outcome-oriented, and use command-based manual checks only when no
     realistic app or artifact review path exists; name the behavior or
     repository contract the command verifies.
   - Create a ready-for-review PR by default.

7. Enter the readiness loop. Each loop pass starts by capturing the current PR
   head SHA, base branch, and GitHub mergeability state, then verifying local
   `HEAD` matches the PR head:

   ```sh
   gh pr view --json headRefOid,baseRefName,mergeable,mergeStateStatus,isDraft,reviewDecision,statusCheckRollup
   git rev-parse HEAD
   ```

   If another actor pushed a different PR head while this workflow is running,
   stop for operator feedback before checking, resolving, replying, or
   reporting.

8. Resolve the mergeability gate before watching checks. The working tree must
   be clean before the local base-merge attempt; stop for operator feedback if
   a prior step left staged, unstaged, or conflicted changes. In the commands
   below, `<base-branch>` is the `baseRefName` captured in step 7 and is fetched
   from the working directory's default `gh` repository remote:

   ```sh
   git fetch origin <base-branch>
   git merge --no-commit --no-ff origin/<base-branch>
   ```

   Use the `gh pr view` mergeability fields as the remote signal and the local
   merge attempt as the source of truth when GitHub reports `UNKNOWN`, stale, or
   conflicting state. Do not use browser automation, GitHub's web conflict UI,
   or the "Automatically merge & resolve" button.

   If the merge reports `Already up to date.`, leave the branch unchanged and
   continue. If the merge applies cleanly and changes the branch, keep the merge
   result in the working tree, run documented verification, commit the merge
   with the repository's normal issue-tagged format, push, and restart the
   readiness loop on the new head. If verification fails on this clean merge,
   run `git merge --abort` and stop under the verification stop condition. If
   two consecutive base merges keep changing the branch without reaching a
   stable PR head in the same finish-pr run, stop for operator feedback instead
   of pushing indefinitely.

   If the merge conflicts, resolve conflicts only when the correct result is
   branch-local, in scope, and verifiable. Prefer repository behavior, tests,
   generators, and documented verification over ad hoc reasoning. Preserve both
   sides when that is clearly correct. After resolving, run documented
   verification, commit the resolution with the repository's normal issue-tagged
   format, push, and restart the readiness loop on the new head. Use
   [triage.md](triage.md) as the source of truth for conflict classification;
   this workflow owns the git sequence and readiness-loop restart.

   Stop when conflicts require product judgment, secrets, permissions,
   destructive git operations, unrelated scope, or unverifiable semantic
   choices. Do not rebase or force-push by default. Do not merge the pull
   request itself. Before any stop path that leaves an uncommitted or conflicted
   merge in the working tree, run:

   ```sh
   git merge --abort
   ```

   Report the aborted merge state and the reason human input is required.

9. Fetch the full PR feedback surface before watching checks:

   - Unresolved inline review threads through paginated GraphQL.
   - Top-level PR comments, including bot summaries with `Findings`,
     severity counts, or line-keyed observations.
   - Review bodies and latest review state.
   - Review decision, when available.

   Prefer inline threads when duplicate feedback exists. Maintain an in-memory
   handled inventory for this run with comment or review identifiers, URLs,
   authors, body hash or update time when available, classification, and
   evidence status. Do not persist handled state in files.

10. Triage every currently available feedback item with
    [triage.md](triage.md). A `fix-now` finding interrupts pending checks:
    patch, verify, commit, push, and restart the readiness loop on the new head
    before waiting on check runs that the fix will make stale. For `explain`,
    `stale`, and `defer`, reply or report with concrete evidence; handle
    `explain`, `stale`, and `defer` before checks unless the evidence itself
    depends on check results. Stop only when feedback returns `needs-human`.

    When a top-level review comment contains findings, handle each finding
    separately with a per-finding disposition: fixed in a named commit,
    explained with evidence, stale, deferred as out of scope, or blocked for
    human judgment. Severity labels such as `Minor` do not make findings
    optional; unaddressed findings are blockers until they have a disposition
    recorded in the PR or final report.

11. Resolve eligible inline threads once the disposition is valid and an
    evidence-bearing reply for that disposition is present on the latest head.
    Every resolved thread carries a reply first; never resolve a thread
    silently. Explanation, stale, and deferral dispositions are eligible after
    their evidence-bearing reply is present on the latest head. Code-fix
    dispositions are eligible only after the fix is present on the latest head,
    local verification passes, and an evidence-bearing reply is posted that
    names what changed, the commit or verification result when useful, and
    whether the fix covers only the commented line or the broader pattern. For
    pattern-based feedback that names a construct, helper, or anti-pattern, run
    a direct semantic or pattern check before resolving when feasible: a repo
    search, an AST query, or a lint rule. Account for every remaining match in
    the reply and do not resolve while unexplained matches remain. Use GraphQL
    `resolveReviewThread`, then verify GraphQL `isResolved` after resolving. If
    permissions do not allow resolution, leave the evidence-bearing reply and
    report the unresolved state. Do not treat replies as resolution.

12. Watch all checks only through the fail-fast bounded-watch policy. Before
    each watch window, confirm all currently available feedback and known
    problematic check states have been triaged. Use 10-minute observation
    windows and watch all checks with a tool-enforced 10-minute timeout. Use an
    equivalent host tool when needed; examples include GNU `timeout`, Homebrew
    `gtimeout`, and a portable `perl` fallback:

    ```sh
    timeout 10m gh pr checks --watch --fail-fast
    gtimeout 10m gh pr checks --watch --fail-fast
    perl -e 'my $seconds = shift; my $pid = fork; die "fork failed: $!" unless defined $pid; if ($pid == 0) { setpgrp(0, 0); exec @ARGV } $SIG{ALRM}=sub { kill q(TERM), -$pid; exit 124 }; alarm $seconds; waitpid($pid, 0); exit(($? & 127) ? 128 + ($? & 127) : ($? >> 8))' 600 gh pr checks --watch --fail-fast
    ```

    Treat exit code 124 from the timeout tool as a watch timeout. Treat a
    non-zero `gh` exit before the timeout as a fail-fast watch exit.

    Watch all checks, including optional ones; optional checks can produce review
    comments or useful blocking evidence. After any watch command exit,
    immediately snapshot all check states and perform a full PR state resync:
    all check buckets, unresolved review threads, top-level PR comments, review
    bodies, review decision, and current PR head. After any watch timeout,
    immediately snapshot all check states and perform the same full PR state
    resync before choosing the next action. Treat a failed, canceled,
    skipped-problematic, or otherwise non-pass check as a triage item before
    starting another watch window.

    Define no progress as no meaningful change in check buckets, check start or
    completion timestamps, PR head SHA, or feedback inventory between
    observation windows. Stop for operator input after two consecutive
    10-minute no-progress windows instead of waiting indefinitely.

13. Triage every non-pass, canceled, or otherwise problematic check with
    [triage.md](triage.md), using the full PR state snapshot rather than
    tunneling into only the first failed check. Fix branch-local check causes,
    push follow-up commits when appropriate, and restart the readiness loop on
    the new head. Continue for `explain`, `stale`, and `defer` outcomes with
    concrete evidence. Do not halt solely because a check failed, was canceled,
    is flaky, is infrastructure-owned, lacks agent permissions, depends on
    missing secrets, or is outside the PR scope; record that disposition and
    continue to the feedback and final reporting gates.

14. Re-query the full PR feedback surface after checks finish, fail fast, or
    time out because GitHub Actions or review automation may have posted new
    comments or updated existing comments while checks were running. Compare
    comment and review identifiers plus body hash or update time from the
    in-memory handled inventory. Triage and handle any newly available,
    changed, unresolved, or evidence-pending feedback before the final gate,
    including deferred-until-checks dispositions whose evidence depended on
    check results. Prior eligible resolutions stand unless the re-query shows
    changed or newly unresolved thread state. Apply the same disposition rules
    from steps 10 and 11, including immediate loop restart for `fix-now`
    feedback and GraphQL verification for resolved inline threads.

15. Final unresolved review-thread gate: immediately before declaring the PR
    ready, re-query paginated GraphQL review threads for the latest PR head.
    Distinguish unresolved actionable feedback from outdated or stale feedback
    that is already fixed on the latest head. For stale fixed threads, post a
    brief current-head evidence reply first, then resolve them with
    `resolveReviewThread` when permissions allow, and verify `isResolved: true`
    from GraphQL. If any thread remains unresolved because it
    still needs action, cannot be resolved automatically, lacks current-head
    evidence, or needs human judgment, report it as a blocker instead of
    reporting ready-to-merge. Restart the readiness loop after branch-local
    fixes or newly pushed commits. Unresolved threads are blockers until they
    are resolved, fixed, or evidence-classified as stale or non-blocking.

16. When all currently visible failing checks have been fixed or dispositioned,
    mark a draft PR ready for review:

    ```sh
    gh pr ready
    ```

    Ready-for-review is distinct from ready-to-merge. A draft PR can become
    ready for review even when known failing checks remain, as long as each
    failing check has a concrete disposition and no human-owned stop condition
    remains.

    Keep the no-merge guardrail: stop when merge is the next action.

17. Mandatory final ready-to-merge check. Run this immediately before the final
    response, after all feedback, check, draft, and branch-freshness handling is
    complete. Re-capture the local checkout, PR identity, GitHub merge state,
    current checks, and paginated GraphQL review threads; do not reuse earlier
    readiness-loop evidence as the final answer.

    ```sh
    pwd
    git branch --show-current
    git status --short
    git rev-parse HEAD
    gh pr view <pr-number-or-url> --json url,headRefName,headRefOid,baseRefName,mergeable,mergeStateStatus,isDraft,reviewDecision,statusCheckRollup
    gh pr checks <pr-number-or-url>
    ```

    Also enumerate review threads with paginated GraphQL for the PR immediately
    before reporting. REST review comments are not sufficient, and replies do
    not count as resolution. Use this self-contained query shape, preserving the
    pagination and fields needed to identify unresolved actionable feedback.
    Replace `<pr-number-or-url>`, `<owner>`, `<repo>`, and `<pr-number>` with
    the resolved PR identity from this workflow before running these commands:

    ```sh
    gh api graphql --paginate \
      -F owner=<owner> -F repo=<repo> -F number=<pr-number> \
      -f query='query($owner:String!,$repo:String!,$number:Int!,$endCursor:String){
        repository(owner:$owner,name:$repo){
          pullRequest(number:$number){
            reviewThreads(first:100, after:$endCursor){
              nodes{
                id
                isResolved
                path
                line
                comments(first:100){
                  nodes{id author{login} body url createdAt path line originalLine diffHunk}
                }
              }
              pageInfo{hasNextPage endCursor}
            }
          }
        }
      }'
    ```

    Classify the worktree before the gate. Enumerate every uncommitted path
    from `git status --short` — tracked modifications and untracked (`??`) paths
    alike — and give each path exactly one provable disposition:

    - **in-scope**: the path is part of this PR's change. It must be committed
      and pushed to the PR head before ready-to-merge. An in-scope path left
      uncommitted means the PR is not finished — commit it (looping back through
      verification and the readiness loop on the new head) or report
      `not ready-to-merge`.
    - **out-of-scope**: the path provably belongs to a different issue or
      branch. Name that issue or branch as the attribution. A path is
      out-of-scope only when the attribution is provable; "probably unrelated,"
      "looks like leftover," or "belongs to the other batch" is not proof.

    A path that is ambiguous, unattributed, or plausibly in-scope is treated as
    in-scope: it forces `not ready-to-merge`, or a halt for the human when
    committing it needs judgment the workflow does not have. Never fold an
    unattributed path into "clean," and never self-classify an in-scope change
    as belonging to a different PR to pass the gate.

    The PR is `ready-to-merge` only when every final gate below is true:

    - every uncommitted path has a provable disposition per the classification
      above: in-scope paths are all committed to the PR head, every remaining
      path is out-of-scope with a named issue or branch, and any ambiguous or
      unattributed path fails this gate.
    - local branch equals the PR `headRefName`.
    - local `HEAD` equals the PR `headRefOid`.
    - `mergeStateStatus` is `CLEAN`.
    - PR is not a draft.
    - every current check has status `COMPLETED` and conclusion `SUCCESS`.
    - no paginated GraphQL review thread has `isResolved: false`.
    - no human blocker or no-progress stop condition remains.

    If every gate passes, report `ready-to-merge`. If any gate fails, report
    `not ready-to-merge` and list the blocker in human-friendly language, with
    just enough evidence to make the state clear. Do not dump the full command
    output or every collected field unless the user asks for it. Check
    dispositions, stale feedback explanations, and evidence-bearing replies may
    explain why the workflow is blocked, but they do not permit ready-to-merge
    wording when a gate is false. Do not describe a blocked outcome as
    finished.

18. Final report includes a short human handoff:

    Write the final response as a short human handoff, not as a readiness audit.
    The gate evidence from step 17 proves the state; it should not become the
    shape of the message.

    Include:

    - PR URL.
    - Latest head SHA only when it helps identify a pushed fix or conflict
      resolution.
    - Meaningful changes since the previous report, especially conflict
      resolution or feedback fixes.
    - Verification commands and results, summarized at the highest useful
      level.
    - When the worktree legitimately holds another branch's uncommitted work,
      the out-of-scope paths and the issue or branch they belong to. Do not call
      the worktree "clean" while such paths remain.
    - Feedback handled, deferred, stale, explained, or blocked, including a
      per-finding disposition for every top-level review finding and
      per-failing-check dispositions when they change what the human should
      know.
    - For resolved review threads, report each as resolved after an
      evidence-bearing reply. Distinguish threads resolved after an evidence
      reply from any thread that was fixed silently, and flag a silent
      resolution as a defect to correct rather than a completed disposition.
    - Human blockers, if any.

    Compress ready-to-merge evidence into one human line when every final gate
    passes. Do not write gate inventories such as clean worktree, head SHA
    equality, merge state, all checks passed, and no unresolved review threads.
    That evidence is required for the workflow decision, but it is routine proof
    when everything passes.

    Good final output:

    ```md
    Done: PR #197 is ready to merge.

    Updated the branch with latest `main`, resolved the skill guidance conflict,
    and pushed `2635d83`.

    Verified: routine checks passed. No human action needed before merge.
    ```

    Avoid final output shaped like a readiness checklist:

    ```md
    PR #197 is ready-to-merge.

    Final readiness:
    - every uncommitted path has a provable disposition
    - local branch equals `headRefName`
    - local HEAD equals `headRefOid`
    - mergeStateStatus is CLEAN
    - every current check is SUCCESS
    - no unresolved review threads
    ```

    When any final gate fails, report `not ready-to-merge` and name the blocker
    in human-friendly language. Include exact failed or skipped commands,
    unresolved feedback, or check dispositions only when they explain what needs
    attention.

## Stop Conditions

- Issue inference is ambiguous.
- Change staging would include unrelated or ambiguous files.
- An uncommitted path cannot be provably attributed to a different issue or
  branch, and committing it in-scope needs judgment the workflow does not have.
- Local verification fails for a reason that is not branch-local or in scope.
- Merge conflict resolution requires product judgment, secrets, permissions,
  destructive git operations, unrelated scope, or unverifiable semantic choices.
- Feedback triage returns `needs-human`.
- Check triage uncovers a non-check human blocker, such as a required product
  decision or ambiguous branch scope. The failing check itself is not the halt
  condition.
- Two consecutive 10-minute no-progress check observation windows complete.
- Review feedback changes requirements, acceptance criteria, or product scope.
- Another actor pushes to the PR while the readiness loop is running.
- Merge is the next action.

## Non-Goals

Do not merge the PR, rebase or force-push by default, use browser conflict
resolution, create follow-up issues, persist handled feedback state, wait
indefinitely for new human comments after the PR is ready, or add agent
attribution by default.
