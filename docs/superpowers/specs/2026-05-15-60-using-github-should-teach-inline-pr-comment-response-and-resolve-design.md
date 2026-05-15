# Design: using-github should teach inline PR comment response and resolve [#60](https://github.com/patinaproject/skills/issues/60)

## Summary

Add a focused pull request comment workflow to `using-github` so agents can
enumerate unresolved PR review threads, distinguish threads that merely have
replies from threads that are actually resolved, verify each comment still
applies to the current head, reply inline with evidence, and optionally resolve
threads through GraphQL.

The recommended direction is a new supporting workflow file at
`skills/using-github/workflows/pr-comments.md`, referenced from the
`skills/using-github/SKILL.md` Required Procedures list. This keeps
`SKILL.md` concise while giving agents the concrete commands and checks needed
for safe PR comment handling.

## Skill guidance

This design touches `skills/**/*.md` and changes a skill/workflow surface.
`superpowers:brainstorming` and `superpowers:writing-skills` are not installed
in this environment, so this artifact compensates by including structured
brainstorming and an explicit workflow-contract review. The review dimensions
used here are:

- RED/GREEN baseline obligations
- rationalization resistance
- red flags
- token-efficiency targets
- role ownership
- stage-gate bypass paths

The installed `write-a-skill` guidance was reviewed before authoring. It favors
concise `SKILL.md` files, detailed one-level supporting workflow files for
complex procedures, concrete examples and checklists, and no time-sensitive
instructions.

## Problem

`using-github` currently tells agents how to start issues, edit issues, write
changelogs, and prepare pull requests, but it does not teach the mechanics of
handling inline PR review feedback. Agents therefore fall back to ad-hoc
behavior: they may treat a replied thread as resolved, reply to stale code,
omit fix commit evidence, resolve comments without verifying the current head,
or implement requirement-bearing feedback directly instead of routing it through
the proper Superteam design and planning path.

Issue #60 asks for a procedure that makes inline PR comment response and
resolution explicit and repeatable.

## Goals

- Add a required `using-github` procedure for PR comment handling.
- Teach paginated enumeration of unresolved review threads and review comments.
- Distinguish unresolved threads from threads that have merely received replies.
- Require current-head verification before replying to or resolving a thread.
- Standardize threaded replies through the GitHub REST replies endpoint.
- Link replies to the fix commit SHA when available.
- Preserve Superteam ownership by routing requirement-bearing feedback through
  `Brainstormer -> Planner -> Executor`.
- Allow optional GraphQL thread resolution only after the workflow has verified
  the thread is handled.
- Keep the main skill entry point concise by placing detailed commands and
  checklists in a supporting workflow file.

## Non-Goals

- Create a separate installable `pr-comments` skill.
- Replace Superteam's latest-head PR completion gate or Finisher ownership.
- Auto-resolve every replied thread.
- Add hidden workflow state, commit trailers, sidecar files, labels, or other
  durable markers outside GitHub's visible PR surfaces.
- Change GitHub branch protection, review requirements, or CI behavior.
- Implement the workflow in this design step.

## Recommended Direction

Create `skills/using-github/workflows/pr-comments.md` as a required procedure
and add one Required Procedures bullet in `skills/using-github/SKILL.md`, for
example:

> PR comments: follow `workflows/pr-comments.md` before replying to, resolving,
> or reporting PR review feedback handled.

The workflow file should be command-oriented and checklist-based. It should
cover discovery, classification, current-head verification, reply drafting,
threaded reply creation, optional GraphQL resolution, and escalation/routing.

This is better than expanding `SKILL.md` because PR comment handling has enough
GitHub API details to bloat the entry point. A supporting file follows the
repo's existing pattern for `new-issue.md`, `edit-issue.md`, `new-branch.md`,
and `write-changelog.md`, while keeping the trigger surface easy to scan.

## Requirements

### R1: Required procedure registration

`skills/using-github/SKILL.md` must reference the new PR comment procedure under
Required Procedures. The reference must make clear that agents should follow it
before replying to, resolving, or reporting PR review feedback handled.

### R2: Supporting workflow file

Add `skills/using-github/workflows/pr-comments.md`. The file should be a
supporting workflow contract, not a separate installable skill. It should use
the same general style as the existing workflow files: concise goal,
preconditions, checklist, explicit commands, halt conditions, and common
mistakes.

### R3: Enumerate unresolved review threads with pagination

The workflow must require paginated enumeration of review threads for the target
PR. It should prefer GraphQL for thread resolution state because REST review
comments alone do not expose the full unresolved thread model. The procedure
must avoid assuming the first page is complete.

The workflow should include a command shape equivalent to:

```bash
gh api graphql --paginate -f owner="$owner" -f repo="$repo" -F number="$pr" -f query='
query($owner: String!, $repo: String!, $number: Int!, $endCursor: String) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      reviewThreads(first: 100, after: $endCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          originalLine
          comments(first: 100) {
            nodes {
              id
              databaseId
              author { login }
              body
              url
              path
              line
              originalLine
              commit { oid }
              createdAt
            }
          }
        }
      }
    }
  }
}'
```

The exact implementation may adjust fields, but it must retain pagination,
thread IDs, `isResolved`, stale/outdated context where available, comment
database IDs for REST replies, URLs, paths, lines, and commit OIDs.

### R4: Distinguish unresolved from merely replied

The workflow must explicitly state that a thread with replies is not necessarily
resolved. `isResolved: false` remains unresolved even if the agent or author has
already replied. Agents must inspect thread resolution state, not infer closure
from reply count or elapsed time.

### R5: Verify referenced state against current HEAD

Before replying to or resolving a thread, the workflow must require agents to
verify whether the referenced state still applies to the current head. The
procedure should instruct agents to:

- capture the latest head SHA for the PR branch
- inspect the relevant file/path and nearby lines in the working tree
- compare the comment's path, line/original line, and comment commit OID to the
  current implementation
- classify stale or outdated comments as non-blocking only with concrete
  evidence
- route comments that still apply to the proper owner before replying as if the
  work is complete

### R6: Threaded inline replies through REST

The workflow must use threaded replies for inline PR review comments, using the
GitHub REST endpoint:

```bash
gh api -X POST repos/<owner>/<repo>/pulls/<n>/comments/<id>/replies \
  -f body="$body"
```

The workflow must explain that `<id>` is the numeric review comment database ID,
not the GraphQL node ID, and must include guidance for extracting it from the
thread inventory.

### R7: Link replies to fix commit SHA when available

When a fix commit exists, replies should include the relevant commit SHA or
short SHA and a concise explanation of how the latest head addresses the
comment. If no fix commit exists because the comment is stale, duplicate,
informational, or not applicable, the reply must state the evidence for that
classification instead.

### R8: Requirement-bearing feedback routes through Superteam owners

The workflow must warn that feedback changing requirements, acceptance criteria,
scope, user-visible behavior, or workflow contracts cannot route straight to an
implementation reply. It must go through `Brainstormer -> Planner -> Executor`
before `Finisher` or the acting GitHub owner returns to PR comment handling.

Implementation-detail feedback that preserves requirements and acceptance
intent may route directly to the implementation owner, but the workflow should
make that classification explicit.

### R9: Optional GraphQL resolution after handling

The workflow may include optional thread resolution through GraphQL, but only
after current-head verification and either a concrete fix, a concrete
non-blocking classification, or the required Superteam routing path. The
procedure should include the mutation shape:

```bash
gh api graphql -f threadId="$thread_id" -f query='
mutation($threadId: ID!) {
  resolveReviewThread(input: { threadId: $threadId }) {
    thread { id isResolved }
  }
}'
```

If GraphQL resolution fails or permissions are unavailable, the workflow should
fall back to leaving a threaded reply and reporting the thread as unresolved
instead of claiming it is resolved.

### R10: Completion and reporting standard

The workflow must define what "handled" means for a PR comment:

- addressed in code, tests, docs, or workflow contracts and verified on latest
  head
- replied to with evidence and optionally resolved through GraphQL
- routed through the proper Superteam owner path when requirement-bearing
- classified non-blocking with evidence

The workflow must warn that silence, elapsed time, a local intent to fix, a
reply without verification, or green CI alone is not proof that feedback was
handled.

## Acceptance Criteria

### AC-60-1

Given an agent uses `using-github` for PR review feedback, when they inspect
Required Procedures in `skills/using-github/SKILL.md`, then they see a PR
comments procedure pointing to `workflows/pr-comments.md`.

### AC-60-2

Given a PR has more than one page of review threads, when the workflow
enumerates unresolved feedback, then it uses paginated GitHub API calls and does
not treat the first page as complete.

### AC-60-3

Given a review thread has replies but `isResolved` remains false, when the
workflow classifies the thread, then it treats the thread as unresolved rather
than assuming replies equal resolution.

### AC-60-4

Given a PR review comment references an older path, line, or commit, when the
agent prepares to reply or resolve it, then the workflow requires verification
against the current PR head before claiming the comment is handled.

### AC-60-5

Given an inline PR review comment should receive a response, when the workflow
posts the response, then it uses the REST threaded replies endpoint with the
numeric review comment database ID and includes the fix commit SHA when
available.

### AC-60-6

Given PR feedback changes requirements, acceptance criteria, scope, user-visible
behavior, or workflow contracts, when the workflow classifies the feedback, then
it routes through `Brainstormer -> Planner -> Executor` before returning to PR
comment handling.

### AC-60-7

Given a comment has been verified as fixed, stale, duplicate, informational, or
otherwise non-blocking with evidence, when the agent has permission to resolve
the thread, then the workflow may optionally use GraphQL `resolveReviewThread`;
otherwise it leaves an evidence-bearing threaded reply and reports the remaining
unresolved state.

### AC-60-8

Given the workflow reports PR feedback handled, when a reviewer audits the
response, then the report is based on latest-head verification, concrete reply
or resolution evidence, and any required Superteam routing rather than silence,
elapsed time, or green CI alone.

## Alternatives Considered

### Leave PR comment handling ad-hoc

Rejected. The issue exists because ad-hoc handling leaves too much room for
unsafe shortcuts: replying to stale code, skipping pagination, treating replies
as resolution, or bypassing requirement routing.

### Put the full procedure in `SKILL.md`

Rejected. The workflow needs API examples, pagination details, classification
rules, and common mistakes. Putting all of that in `SKILL.md` would bloat the
skill entry point and violate the `write-a-skill` preference for concise main
files with detailed references split out.

### Create a separate `pr-comments` skill

Rejected. PR comment handling is part of GitHub work and should remain under
the `using-github` entry point. A separate skill would fragment ownership and
make it easier for agents to miss shared repo rules, templates, and leak-guard
expectations.

### Auto-resolve every handled thread

Rejected. Some runs will not have permission to resolve threads, and some
reviewers may prefer explicit replies without agent resolution. Resolution
should be optional and evidence-gated.

## Risks and Tradeoffs

- GraphQL review thread enumeration is more complex than REST-only comment
  listing, but it is necessary to see thread resolution state.
- GitHub API fields and permissions vary by token. The workflow must define
  fallback behavior when resolution is unavailable instead of pretending the
  thread is closed.
- Current-head verification costs time, but it prevents misleading replies on
  stale or outdated comments.
- Requiring Superteam routing for requirement-bearing feedback adds process, but
  it preserves the design and planning gates that keep scope changes deliberate.
- Including command examples in a workflow file adds maintenance surface. The
  examples should use stable GitHub CLI/API shapes and avoid time-sensitive
  repository-specific values.

## Workflow-Contract Self-Review

### RED/GREEN baseline obligations

RED cases:

- A workflow that lists only the first page of review threads is insufficient.
- A workflow that treats "has replies" as resolved is insufficient.
- A workflow that resolves comments without current-head verification is
  insufficient.
- A workflow that implements requirement changes directly without
  `Brainstormer -> Planner -> Executor` routing is insufficient.

GREEN cases:

- The new workflow requires paginated thread inventory, resolution-state
  inspection, latest-head verification, threaded replies, optional
  evidence-gated resolution, and explicit Superteam routing for
  requirement-bearing feedback.

### Rationalization resistance

The design closes likely shortcuts: "the first page was enough", "I replied so
it is resolved", "CI is green so the comment is handled", "the code probably
still matches", and "this requirement change is small enough to implement
directly." Each shortcut is countered by a requirement or acceptance criterion.

### Red flags

Implementation should be reviewed for these failure modes:

- `SKILL.md` absorbs detailed API instructions instead of linking to the
  workflow file.
- The workflow uses REST review comments only and never inspects GraphQL
  `isResolved`.
- The workflow omits pagination.
- The workflow omits current-head verification before replies or resolution.
- The workflow resolves a thread without evidence in a reply or report.
- Requirement-bearing feedback routes straight to implementation.

### Token-efficiency targets

The main skill should gain only a short Required Procedures bullet. Detailed
commands, examples, and checklists belong in `workflows/pr-comments.md`. The
workflow should be concise enough to execute, but complete enough that agents do
not need to rediscover GitHub API mechanics from the issue body.

### Role ownership

`using-github` owns the generic GitHub procedure. In Superteam contexts,
`Finisher` or the acting GitHub owner owns PR feedback intake and thread
handling, while `Brainstormer`, `Planner`, and `Executor` own remediation after
feedback is classified and routed. The workflow must not let the comment
handler absorb requirement-bearing changes.

### Stage-gate bypass paths

The design blocks stage-gate bypass by requiring requirement-bearing PR feedback
to return to `Brainstormer -> Planner -> Executor` before PR comment handling
resumes. It also prevents completion-style claims until comment handling is
based on latest-head verification and visible GitHub evidence.

## Light Self-Review Findings

No approval-blocking findings remain from self-review. The required issue
content is represented in requirements and ACs, the design recommends a
supporting workflow file instead of bloating `SKILL.md`, and the
workflow-contract review dimensions are explicit.

Self-review is not the Team Lead adversarial pass required before Gate 1
approval. It is a same-thread Brainstormer check to reduce obvious misses before
handoff.
