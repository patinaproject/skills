# Ready for Merge Workflow

**Goal:** Carry completed branch-local work through publication, checks, and
existing review feedback until the pull request is ready to merge.

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
     `Test coverage` section when the linked issue defines ACs.
   - Create a ready-for-review PR by default.

7. Watch checks fail-fast:

   ```sh
   gh pr checks --watch --fail-fast
   ```

   Triage failures with [triage.md](triage.md). Fix branch-local failures,
   verify, commit, push, and watch again. Stop for secrets, permissions,
   infrastructure, flaky runs that need human judgment, or scope decisions.

8. Handle existing review feedback after checks pass. Include unresolved inline
   threads, top-level PR comments, and review bodies. Prefer inline threads when
   duplicate feedback exists. Triage each item with [triage.md](triage.md).

9. Resolve eligible inline threads only after the relevant fix is on the latest
   head and checks pass. If permissions do not allow resolution, leave an
   evidence-bearing reply and report the unresolved state.

10. Final report includes:

    - PR URL.
    - Latest head SHA.
    - Verification commands and results.
    - Check status.
    - Feedback handled, deferred, stale, explained, or blocked.

## Stop Conditions

- Issue inference is ambiguous.
- Change staging would include unrelated or ambiguous files.
- Local verification fails for a reason that is not branch-local or in scope.
- Check or feedback triage returns `needs-human`.
- Review feedback changes requirements, acceptance criteria, or product scope.
- Merge is the next action.

## Non-Goals

Do not merge the PR, rewrite history, force-push, create follow-up issues, wait
for new human comments, or add agent attribution by default.
