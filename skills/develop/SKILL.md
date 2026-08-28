---
name: develop
description: Build one issue or instruction set through implementation, local review, and a ready-to-merge pull request. Use when the user runs `/develop` or asks to develop one change from start to finish.
---

# Develop

`develop` takes one request from implementation through a ready-to-merge pull
request. The request can contain an issue reference, written instructions, or
both.

It runs four skills in order:

1. `working-on-issue` finds the issue, switches to its branch, assigns it, and
   marks it started.
2. `implement` changes the code and adds tests.
3. `polish` reviews the committed changes and fixes problems before
   publication.
4. `ready-pr` commits any remaining work, pushes the branch, updates the pull
   request, handles review feedback, and checks whether it is ready to merge.

`develop` never merges the pull request. It also uses the regular
`implement` flow. Use `develop-with-workflow` when the user asks for parallel
implementation.

## Input

Examples:

```text
/develop <issue-reference>
/develop "add null checks to the login handler"
/develop <issue-reference> change only the validation path
```

Written instructions control what to build. When they differ from the linked
issue, follow the written instructions. Use the issue for its branch name,
required commit reference, and pull request link.

Ask the user when the request is too vague to implement without making a
product or design decision. A formal list of acceptance criteria is optional.
Clear written instructions are enough.

When `working-on-issue` finds no issue, warn the user and continue with the
implementation and local review. Before committing or opening a pull request,
read the repository rules. Stop if they require an issue reference.

When the finished work differs from the issue body, keep the required closing
reference in the pull request. Tell the user about the difference and ask
before editing the issue.

## Required skills

Confirm these skills are installed before implementation:

- `working-on-issue`
- `new-branch`
- `implement`
- `tdd`
- `polish`
- `code-review`
- `codebase-design`
- `diagnosing-bugs`
- `update-branch`
- `ready-pr`

Stop and name any missing skill. Give a project-local install command for its
current source.

Use `writing-for-agents` when the request changes a skill, its instructions,
frontmatter, examples, references, or bundled scripts.

Use `prototype` only when the user asks for a throwaway prototype or needs to
compare possible behavior or UI. Delete the prototype or move its useful parts
into the real implementation before `polish`, unless the user asked to keep it.

Before using either skill, confirm that it is installed. If it is missing, stop,
name it, and give a project-local install command for its current source.

## Workflow

1. Read `AGENTS.md`, `CLAUDE.md`, and any files they require.
2. Confirm the required skills are installed.
3. Run `working-on-issue` with the full request. Keep its issue, branch, and
   status results for the final report.
4. Confirm that the request is clear enough to implement. Stop when work needs
   a product decision, design decision, credentials, permissions, external
   access, or instructions that resolve a conflict.
5. Run `writing-for-agents` or `prototype` when the request needs them.
6. Use the build and test steps from `implement`. Follow the written
   instructions when they differ from the issue body. Skip `implement`'s final
   standalone code review because `polish` performs that review.
7. Run the verification commands documented by the repository. Add or update
   tests when the change affects executable behavior. After merging the target
   branch, follow `update-branch`'s
   [verification rules](../update-branch/SKILL.md#workflow). A proven problem
   that already exists on the target branch does not stop `develop`. Keep the
   target commit, command, failure, and proof for the final report.
8. Run `polish` against the current commit. Pass it the issue and the
   written instructions. Fix accepted findings, commit the fixes, and run
   `polish` again. Continue until it passes with no findings or asks for a
   human decision.
9. If the repository requires an issue reference and step 3 found no issue,
   stop before `ready-pr`. Report the completed local work and ask the user for
   an issue.
10. Run `ready-pr`. Let it commit and push the branch, create or update the
    pull request, handle available feedback, and check the current pull request
    state.
11. When local checks or pull request checks fail, fix problems caused by this
    branch. Do the same when review feedback identifies one. Verify and review
    each new commit, push it, and repeat until the pull request is ready to
    merge or the next step needs a person.

## When the work is done

Report that the pull request is ready to merge only when all of these statements
are true:

- The implementation covers the written instructions and any relevant issue
  requirements.
- Repository verification completed.
- Tests cover changed behavior where useful.
- `polish` passed on the current commit with no findings.
- Pull request feedback has an answer or a fix.
- Every required pull request check passes on the latest commit.
- `ready-pr` reports that the pull request is ready to merge.
- No unresolved decision or access problem remains.

A proven target-branch failure from an extra full-repository command does not
block the pull request. Include its recorded proof in the final report.

Report that the work is blocked when the next step needs a product or design
decision, credentials, permissions, external access, conflicting instructions,
or valid work outside this request.

When the issue has a required branch, finish on that branch. Use a different
branch only when the user explicitly requires it. Name the branch and the reason
in the final report.

## Final report

Lead with `Ready to merge` or `Blocked`. Then tell the user:

- what changed
- where the work lives
- what verification passed or failed
- what `polish` changed
- whether pull request feedback and checks are clear
- what the user must do next
- any specific remaining risk or test gap

Link the issue and pull request when links are available. Mention the branch
only when it differs from the issue branch.

When all checks pass, summarize verification in one sentence. Include exact
commands only for failures, skipped checks, or steps the user must run. Do not
repeat GitHub status fields or list every successful check.

During a long run, keep a short note with the request, issue, branch, current
result, blocker, and next step. Use that note to resume without repeating
completed work. If an extra full-repository command found a proven target-branch
problem, also keep the target commit, command, failure, and proof. Apply
`update-branch`'s verification rules again before reusing that proof.
