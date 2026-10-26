---
name: update-branch
description: Merge the current pull request's target branch into the current work branch with Git, keeping remote updates opt-in. Without a pull request, merge an explicit or default target locally. Use when the user says update branch or asks to merge the base or default branch.
---

# Update a branch

Run from a local work branch.

```text
/update-branch
/update-branch release/1.x
```

When the current branch has one open pull request, always use that pull
request's target branch, even if the user supplied another target. Without an
open pull request, use the supplied target or fall back to `origin/HEAD`.

Use `git` for fetch and merge. Use `gh` only to read pull request data.
The bundled `scripts/update-context.sh` selects the target and verifies the
pull request context. A branch without a pull request stays local. This run
never pushes a remote branch unless the operator explicitly requests that
remote update with the helper's `push` command.

## Requirements

- Accept zero or one target argument.
- Stop on a detached HEAD or missing `origin` remote.
- Require `gh` for the pull request lookup. A failed lookup is an error, not
  proof that no pull request exists.
- Without a pull request or explicit target, require `origin/HEAD`. If it is
  missing, tell the user to run `git remote set-head origin -a`.
- Never assume the default branch is named `main` or `master`.
- Do not update the repository's default branch unless the user supplied a
  target and explicitly confirmed the default branch should change.
- Use `fix-merge-conflicts` for every merge conflict. Before editing a
  conflict, run `"$UPDATE_BRANCH_HELPER" require-conflict-skill`. Install the
  skill or stop when the helper says it is missing.

## Workflow

1. Read repository instructions for commits, checks, and protected branches.
2. Record `git branch --show-current` and compare it with the repository default
   branch. Stop on the default branch unless the user explicitly authorized it.
3. Keep the consumer repository as the working directory. Resolve this skill's
   installed directory to an absolute path, then run:

   ```sh
   UPDATE_BRANCH_HELPER="<absolute installed skill directory>/scripts/update-context.sh"
   "$UPDATE_BRANCH_HELPER" resolve [target]
   ```

   Record the returned mode, current branch, normalized target, pull request
   number and URL, pull request head, and both repository identities.
   The helper requires a fetch remote matching the pull request's base
   repository and a configured upstream whose push URL matches its head
   repository. It refuses missing, ambiguous, or mismatched identities before
   the workflow changes local or remote state. `pull-request` mode uses the pull
   request target. `local-only` mode uses the explicit target or `origin/HEAD`.
4. Split the selected target at its first `/` into remote and branch. Fetch
   that branch from that remote. Fork pull requests can select a base remote
   such as `upstream`; local-only targets use `origin`.
   Record `git rev-parse <target>` as the exact target commit.
5. Run `git status --short` and inspect staged, unstaged, and untracked files.
   Commit existing work automatically only when every changed file belongs to
   one clear change, contains no likely secret, and can use the repository's
   required commit format. Before committing, tell the user the exact files and
   commit message. Stop for mixed or unclear changes, generated files with an
   unknown source, possible secrets, or a required issue reference that cannot
   be determined.
6. Start the merge without committing it:

   ```sh
   git merge --no-commit --no-ff <target>
   ```

   If Git says `Already up to date`, no merge commit is needed.
7. If conflicts occur, run the required skill check and use
   `fix-merge-conflicts` for conflicts whose correct result belongs to
   this change and can be verified. Abort the merge and ask the user when a
   conflict needs a product decision, unrelated work, unavailable access,
   secret handling, generated-file knowledge, or a guess about behavior.
   Run the skill check from the consumer repository:

   ```sh
   "$UPDATE_BRANCH_HELPER" require-conflict-skill
   ```

8. Check whether the merge changed package manifests, lockfiles, workspace
   files, or toolchain versions. If so, run the install or setup command from
   repository instructions before verification. Stop if no command is
   documented. Include generated dependency changes only when that documented
   command produced them and they belong to this branch update.
9. Run the repository's documented checks that cover the changed code, resolved
   conflicts, and affected dependencies. If no local check applies, state that.

   A separate full-repository check is required only when repository
   instructions require it for this change. If a required or relevant check
   fails, abort the merge and stop.

   When the relevant checks pass but an extra full-repository check fails, you
   may continue only after proving that the same problem already exists on the
   fetched target commit. Prove that by showing either:

   - the failing source and the rule, configuration, or input that causes the
     failure are unchanged from the target commit
   - the same failure occurs when the command runs on the target commit

   Record the target commit, command, failing check, and comparison. Do not
   continue when the branch changed an input involved in the failure, the merge
   caused the failure through interaction, or repository instructions require
   the full-repository command. On a later run, reuse the comparison only when
   the target commit, command, failing check, and comparison are unchanged.
10. If the merge is still open after verification, create the merge commit with
    the repository's normal commit format and hooks.
11. Finish without changing the remote. In `pull-request` mode, report the
    local merge and the captured pull request context. If the operator
    explicitly requests the remote update, run:

    ```sh
    "$UPDATE_BRANCH_HELPER" push <pr-number> <target> <pr-head> <base-repository> <head-repository>
    ```

    Pass the identities captured by `resolve` unchanged. The helper verifies
    the pull request and both remote identities, pushes to the configured
    upstream, and verifies the pull request again. If the pull request changes
    or its lookup fails during the push, say
    that the remote branch moved but the pull request result is uncertain.
    On any failure, report the helper message or failed `git push` output and
    do not claim the pull request was updated. In `local-only` mode, report
    that the branch remains unpushed and include the optional command
    `git push origin HEAD`.

## Merge safety

Keep a merge open only while resolving clear conflicts covered by this branch
update. Run `git merge --abort` before stopping so the branch returns to its
pre-merge state. Do not rebase, force-push, rewrite history, or include unrelated
files.

## Final report

Report the current branch, selected target, exact target commit, and how the
target was chosen. State whether existing work was committed, a merge commit
was created, dependencies were refreshed, conflicts were resolved, checks
passed, and the remote branch was pushed. For an extra full-repository failure
that did not stop the update, include the target commit, command, failed check,
and comparison. For local-only work, say that the branch remains unpushed and
include `git push origin HEAD`.
