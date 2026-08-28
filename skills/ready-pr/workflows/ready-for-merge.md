# Ready a pull request to merge

Use these instructions after implementation is complete or when the user asks
to finish, publish, or open a pull request. Work in the current directory's
default `gh` repository.

Continue until the pull request is ready to merge or the next step needs the
user. A failed check or review comment requires investigation, not an immediate
stop. Fix problems introduced by this branch and report other causes with
evidence.

Do not merge the pull request or enable auto-merge.

## Updates to the user

Say whether the pull request is ready, not ready, or waiting for a decision.
During long work, report the current step, useful evidence, next action, and any
blocker. When everything passes, summarize verification in one sentence. Show
exact failed commands, skipped checks, or unresolved feedback only when they
explain what remains.

## Publish local work

1. Resolve the current branch, repository visibility, default branch, issue,
   and existing pull request. Use the existing pull request or branch to find
   the issue. Ask when more than one issue could apply.
2. Inspect local files:

   ```sh
   git status --short
   git diff --stat
   ```

   Stage only files that belong to this work. Ask before including unclear or
   unrelated files. If there are no local changes and a pull request exists,
   continue with its current state.
3. Run the repository's documented local checks. Prefer `AGENTS.md`, README
   files, and package scripts. Do not invent expensive unrelated checks.
4. Commit with the repository's format. Run any required local review on that
   exact commit. Fix and commit clear findings, then repeat checks and review
   until the current commit passes.
5. Push only after the exact commit passes. Every later fix commit returns to
   step 3 before another push.

## Create or update the pull request

1. Read `.github/pull_request_template.md`.
2. Derive the title type from the complete branch diff against the pull request
   target and the repository's title rules. Recheck an existing title instead
   of assuming it is still correct.
3. Include the required issue-closing line and keep the template headings in
   order.
4. Explain what changed and why. Do not copy successful command output into the
   body. Add `Testing steps` only when a reviewer must inspect behavior or a
   produced file.
5. Open agent-created work as a draft. Leave a draft created by a person
   unchanged unless the user asks the agent to take it over.

## Check the current pull request commit

At the start of every pass, capture current GitHub state and local `HEAD`:

```sh
gh pr view --json headRefOid,baseRefName,mergeable,mergeStateStatus,isDraft,reviewDecision,statusCheckRollup
git rev-parse HEAD
```

If another actor pushed a different pull request commit, stop before replying,
resolving, or reporting. Ask the user how to continue.

## Merge the target branch locally

Require a clean worktree, then fetch and test the current pull request target:

```sh
git fetch origin <base-branch>
git merge --no-commit --no-ff origin/<base-branch>
```

Use the local Git result when GitHub reports an unknown or outdated merge state.
Do not use browser conflict tools.

- If Git reports `Already up to date.`, continue.
- If the merge is clean and changes the branch, follow
  [the clean merge instructions](../references/base-update-recovery.md). After
  `verified` or `recovered`, rerun local checks and review, push, and start the
  pull request checks again. After `reproducible` or `drifted`, report the
  failed command and stopped merge.
- If the merge conflicts, follow
  [the conflict instructions](triage.md#merge-conflicts) and `update-branch`.
  Resolve only changes covered by this pull request whose correct behavior can
  be checked. Run checks for changed code, resolved conflicts, and affected
  dependencies. An extra full-repository failure may be ignored only when
  `update-branch` proves that the same problem exists on the exact target
  commit. Commit, rerun local checks and review, push, and start again.

Run `git merge --abort` before stopping with an open merge. Ask the user when a
conflict needs a product decision, secret, permission, destructive Git change,
unrelated work, or a guess about behavior. Do not rebase or force-push.

Stop after two consecutive target merges change the branch without reaching a
stable pull request commit during one run.

## Handle feedback

Before waiting for checks, read:

- every paginated GraphQL inline thread
- top-level comments, including bot summaries
- review bodies and latest review state
- current review decision

Use [the comment instructions](../../using-github/workflows/pr-comments.md) for
thread IDs, author type, replies, and resolution. Use
[the feedback rules](triage.md) for decisions.

Fix clear problems before waiting for checks. Verify, commit, return to the
local checks and review, push, and restart on the new pull request commit.

For an explanation, outdated item, or item outside this pull request, provide
current evidence. A `Minor` label does not make feedback optional. Handle every
finding separately.

Fix valid code feedback from human-started threads but leave the conversation
for the reviewer or user. If a person says a previously fixed bug remains or
returned, reproduce the new report before changing more code.

## Watch required checks

Follow [the failed check instructions](triage.md#failed-checks). Watch required
checks in ten-minute windows with a fail-fast command and tool-enforced timeout.
After every exit or timeout, refresh:

- required, optional, and replaced check runs
- pull request commit and merge state
- unresolved inline threads
- top-level comments and review bodies
- review decision

Fix every failure introduced by the branch. Optional checks and replaced runs
are history, but comments they posted still require attention. Stop after two
unchanged ten-minute windows.

After checks finish, fail, or time out, fetch all feedback again. Handle any new
or changed item before reporting.

## Mark an agent-created draft ready

Immediately before changing draft state, follow
[the draft readiness checks](../references/readiness-predicate.md). When they
pass, run:

```sh
gh pr ready
```

Do not change issue status. Ready for human review and ready to merge are
different results, so continue to the final check below.

## Final ready check

Fetch fresh state immediately before the final response:

```sh
pwd
git branch --show-current
git status --short
git rev-parse HEAD
gh pr view <pr-number-or-url> --json url,headRefName,headRefOid,baseRefName,mergeable,mergeStateStatus,isDraft,reviewDecision,statusCheckRollup
gh pr checks <pr-number-or-url> --required
```

Use paginated GraphQL as described in
[the comment instructions](../../using-github/workflows/pr-comments.md) to read
every review thread. A REST comment list is not enough.

Account for every path from `git status --short`:

- A file for this pull request must be committed, checked, reviewed, and pushed.
- A file for other work must name the exact issue or branch it belongs to.
- An unclear file blocks a ready result. Ask the user when deciding whether to
  commit it would change the request.

The pull request is ready to merge only when:

- every file for this pull request is committed and pushed
- any remaining file belongs to a named different issue or branch
- the local branch equals `headRefName`
- local `HEAD` equals `headRefOid`
- GitHub reports `mergeStateStatus: CLEAN`
- the pull request is not a draft
- every context from `gh pr checks --required` passes on the latest commit
- every paginated GraphQL review thread has `isResolved: true`
- no pending decision, permission, credential, or stopped check needs the user

Optional and replaced check runs do not change the required-check result.
Passing checks do not replace a clean merge state. Replies do not replace thread
resolution.

If every condition passes, report `ready to merge`. Otherwise report `not ready
to merge` and name the remaining problem. Never describe a blocked pull request
as finished.

## Final report

Lead with the pull request result and link. Mention meaningful fixes, useful
verification, handled feedback, open human-started threads, and the one next
action when needed. Include another branch's local files only when they remain
in the worktree, with the issue or branch they belong to.

Apply the
[reporter-fidelity handoff](../references/reporter-fidelity.md). Report its
`verified` or `pending` verdict and most direct requested-change link separately
from pull request readiness. Passing checks do not change that verdict.

When all conditions pass, do not list them one by one. One sentence stating
that routine checks, review threads, and merge state are clear is enough.

When GitHub reports a merge state other than `CLEAN`, include the exact
`mergeStateStatus`, `mergeable`, and `reviewDecision` values. If GitHub gives no
reason, say so instead of guessing.

## Stop and ask the user

Stop when the issue is unclear, local files cannot be assigned to this or named
other work, a required check for changed code cannot pass, a target branch
failure cannot be proven unchanged, a conflict needs judgment, feedback changes
requirements, another actor changes the pull request commit, checks make no
progress for two windows, or merging is the next action.

Do not create follow-up issues, store handled-comment state in repository files,
wait indefinitely for new comments, or add agent attribution unless required.
