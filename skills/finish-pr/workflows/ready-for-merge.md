# Ready for Merge Workflow

**Goal:** Carry completed branch-local work through publication, checks, and
PR feedback until the pull request is ready to merge or human input is required.

## Preconditions

Use this workflow only after implementation is complete or the user explicitly
asks to finish, publish, or open a ready PR. Stay in the current working
directory's default `gh` repository.

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
   - Summarize acceptance criteria and verification evidence in the template's
     verification section when the linked issue defines acceptance criteria.
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

8. Resolve the mergeability gate before watching checks:

   ```sh
   git fetch origin <base-branch>
   git merge --no-commit --no-ff origin/<base-branch>
   ```

   Use the `gh pr view` mergeability fields as the remote signal and the local
   merge attempt as the source of truth when GitHub reports `UNKNOWN`, stale, or
   conflicting state. Do not use browser automation, GitHub's web conflict UI,
   or the "Automatically merge & resolve" button.

   If the branch is already up to date, leave the branch unchanged and continue.
   If the merge applies cleanly and changes the branch, keep the merge result in
   the working tree, run documented verification, commit the merge with the
   repository's normal issue-tagged format, push, and restart the readiness loop
   on the new head. If verification fails on this clean merge, run
   `git merge --abort` and stop under the verification stop condition.

   If the merge conflicts, resolve conflicts only when the correct result is
   branch-local, in scope, and verifiable. Prefer repository behavior, tests,
   generators, and documented verification over ad hoc reasoning. Preserve both
   sides when that is clearly correct. After resolving, run documented
   verification, commit the resolution with the repository's normal issue-tagged
   format, push, and restart the readiness loop on the new head.

   Stop when conflicts require product judgment, secrets, permissions,
   destructive git operations, unrelated scope, or unverifiable semantic
   choices. Do not rebase or force-push by default. Do not merge the pull
   request itself. Before any stop path that leaves an uncommitted or conflicted
   merge in the working tree, run:

   ```sh
   git merge --abort
   ```

   Report the aborted merge state and the reason human input is required.

9. Watch all checks to terminal state:

   ```sh
   gh pr checks --watch
   ```

   Do not use `--fail-fast` by default. Do not filter to required checks only;
   optional checks can produce review comments or useful blocking evidence.
   Check completion is the synchronization point for GitHub Action-authored
   feedback. Do not add arbitrary settle sleeps, pass-count caps, or wall-clock
   caps. If the check set shows no state change after a reasonable observation
   window, stop for operator feedback instead of waiting indefinitely.

10. Triage every non-pass, canceled, or otherwise problematic check with
    [triage.md](triage.md). Fix `fix-now` outcomes in branch-local follow-up
    commits, verify locally, push, and restart the loop on the new head. Continue
    for `explain`, `stale`, and `defer` outcomes only with concrete evidence.
    Stop only when a check returns `needs-human`.

11. Fetch the full PR feedback surface after checks finish:

    - Unresolved inline review threads through paginated GraphQL.
    - Top-level PR comments, including bot summaries with `Findings`,
      severity counts, or line-keyed observations.
    - Review bodies and latest review state.
    - Review decision, when available.

    Prefer inline threads when duplicate feedback exists. Triage each item with
    [triage.md](triage.md). Maintain an in-memory handled inventory for this
    run with comment or review identifiers, URLs, authors, body hash or update
    time when available, classification, and evidence status. Do not persist
    handled state in files.

12. Handle feedback. Fix `fix-now` outcomes in branch-local follow-up commits,
    verify locally, push, and restart the loop on the new head. For `explain`,
    `stale`, and `defer`, reply or report with concrete evidence and continue.
    Stop only when feedback returns `needs-human`. When a top-level review
    comment contains findings, handle each finding separately with a
    per-finding disposition: fixed in a named commit, explained with evidence,
    stale, deferred as out of scope, or blocked for human judgment. Severity
    labels such as `Minor` do not make findings optional; unaddressed findings
    are blockers until they have a disposition recorded in the PR or final
    report.

13. Resolve eligible inline threads only after the relevant fix or explanation
    is present on the latest head and checks pass. Use GraphQL
    `resolveReviewThread`, then verify GraphQL `isResolved` after resolving. If
    permissions do not allow resolution, leave an evidence-bearing reply and
    report the unresolved state. Do not treat replies as resolution.

14. Final unresolved review-thread gate: immediately before declaring the PR
    ready, re-query paginated GraphQL review threads for the latest PR head.
    Distinguish unresolved actionable feedback from outdated or stale feedback
    that is already fixed on the latest head. For stale fixed threads, resolve
    them with `resolveReviewThread` when permissions allow, then verify
    `isResolved: true` from GraphQL. If any thread remains unresolved because it
    still needs action, cannot be resolved automatically, lacks current-head
    evidence, or needs human judgment, report it as a blocker instead of
    reporting ready-to-merge. Restart the readiness loop after branch-local
    fixes or newly pushed commits. Unresolved threads are blockers until they
    are resolved, fixed, or evidence-classified as stale or non-blocking.

15. When the loop reaches the ready state, mark a draft PR ready for review:

    ```sh
    gh pr ready
    ```

    Keep the no-merge guardrail: stop when merge is the next action.

16. Final report includes:

    - PR URL.
    - Latest head SHA.
    - Verification commands and results.
    - Mergeability and conflict-handling evidence, including the base branch,
      merge state, local merge result, and any merge or conflict-resolution
      commit pushed during the loop.
    - Check status.
    - Final unresolved review-thread gate result.
    - Feedback handled, deferred, stale, explained, or blocked, including a
      per-finding disposition for every top-level review finding.
    - Human blockers, if any.

## Stop Conditions

- Issue inference is ambiguous.
- Change staging would include unrelated or ambiguous files.
- Local verification fails for a reason that is not branch-local or in scope.
- Merge conflict resolution requires product judgment, secrets, permissions,
  destructive git operations, unrelated scope, or unverifiable semantic choices.
- Check or feedback triage returns `needs-human`.
- Review feedback changes requirements, acceptance criteria, or product scope.
- Another actor pushes to the PR while the readiness loop is running.
- Merge is the next action.

## Non-Goals

Do not merge the PR, rebase or force-push by default, use browser conflict
resolution, create follow-up issues, persist handled feedback state, wait
indefinitely for new human comments after the PR is ready, or add agent
attribution by default.
