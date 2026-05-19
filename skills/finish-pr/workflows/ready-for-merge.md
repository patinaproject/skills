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
   head SHA and verifying local `HEAD` matches it:

   ```sh
   gh pr view --json headRefOid,isDraft,reviewDecision,statusCheckRollup
   git rev-parse HEAD
   ```

   If another actor pushed a different PR head while this workflow is running,
   stop for operator feedback before checking, resolving, replying, or
   reporting.

8. Watch all checks to terminal state:

   ```sh
   gh pr checks --watch
   ```

   Do not use `--fail-fast` by default. Do not filter to required checks only;
   optional checks can produce review comments or useful blocking evidence.
   Check completion is the synchronization point for GitHub Action-authored
   feedback. Do not add arbitrary settle sleeps, pass-count caps, or wall-clock
   caps.

9. Triage every non-pass, canceled, or otherwise problematic check with
   [triage.md](triage.md). Fix `fix-now` outcomes in branch-local follow-up
   commits, verify locally, push, and restart the loop on the new head. Continue
   for `explain`, `stale`, and `defer` outcomes only with concrete evidence.
   Stop only when a check returns `needs-human`.

10. Fetch the full PR feedback surface after checks finish:

    - Unresolved inline review threads through paginated GraphQL.
    - Top-level PR comments.
    - Review bodies and latest review state.
    - Review decision, when available.

    Prefer inline threads when duplicate feedback exists. Triage each item with
    [triage.md](triage.md). Maintain an in-memory handled inventory for this
    run with comment or review identifiers, URLs, authors, body hash or update
    time when available, classification, and evidence status. Do not persist
    handled state in files.

11. Handle feedback. Fix `fix-now` outcomes in branch-local follow-up commits,
    verify locally, push, and restart the loop on the new head. For `explain`,
    `stale`, and `defer`, reply or report with concrete evidence and continue.
    Stop only when feedback returns `needs-human`.

12. Resolve eligible inline threads only after the relevant fix or explanation
    is present on the latest head and checks pass. Verify GraphQL `isResolved`
    after resolving. If permissions do not allow resolution, leave an
    evidence-bearing reply and report the unresolved state. Do not treat replies
    as resolution.

13. When the loop reaches the ready state, mark a draft PR ready for review:

    ```sh
    gh pr ready
    ```

    Keep the no-merge guardrail: stop when merge is the next action.

14. Final report includes:

    - PR URL.
    - Latest head SHA.
    - Verification commands and results.
    - Check status.
    - Feedback handled, deferred, stale, explained, or blocked.
    - Human blockers, if any.

## Stop Conditions

- Issue inference is ambiguous.
- Change staging would include unrelated or ambiguous files.
- Local verification fails for a reason that is not branch-local or in scope.
- Check or feedback triage returns `needs-human`.
- Review feedback changes requirements, acceptance criteria, or product scope.
- Another actor pushes to the PR while the readiness loop is running.
- Merge is the next action.

## Non-Goals

Do not merge the PR, rewrite history, force-push, create follow-up issues,
persist handled feedback state, wait indefinitely for new human comments after
the PR is ready, or add agent attribution by default.
