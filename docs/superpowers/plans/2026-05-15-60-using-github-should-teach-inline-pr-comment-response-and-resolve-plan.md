# Plan: using-github should teach inline PR comment response and resolve [#60](https://github.com/patinaproject/skills/issues/60)

## Approved design

- Design artifact: `docs/superpowers/specs/2026-05-15-60-using-github-should-teach-inline-pr-comment-response-and-resolve-design.md`
- Gate 1 approval: operator explicitly approved with `lgtm` on 2026-05-15.
- Handoff commit: `6f89e01529b49cb45df274a9088026e6577dc172`
- Binding ACs: `AC-60-1` through `AC-60-8`.

## Goal

Teach `using-github` agents how to safely enumerate, classify, reply to, and
optionally resolve inline PR review comments without treating replies as
resolution, skipping pagination, replying to stale state, or bypassing
Superteam requirement-routing gates.

Requirement-changing deltas are out of scope for Executor. If implementation
uncovers a need to change the approved ownership model, remove latest-head
verification, weaken pagination, skip threaded replies, alter Superteam routing,
or otherwise revise the requirements, halt and route the delta back to
Brainstormer before continuing.

## Workstreams

### W1: Register the PR comments procedure

Update `skills/using-github/SKILL.md`.

Tasks:

- W1.1 Add one concise Required Procedures bullet for PR comments.
- W1.2 Point the bullet to `workflows/pr-comments.md`.
- W1.3 State that agents follow the procedure before replying to, resolving, or
  reporting PR review feedback handled.
- W1.4 Keep detailed GitHub API mechanics out of `SKILL.md`; the main skill
  entry point should stay concise.

Acceptance criteria covered: `AC-60-1`.

### W2: Add the PR comment handling workflow

Add `skills/using-github/workflows/pr-comments.md`.

Tasks:

- W2.1 Use the existing workflow-file style: concise goal, preconditions,
  checklist, command examples, halt conditions, and common mistakes.
- W2.2 Define the target use case as handling inline PR review feedback in the
  current working directory's default `gh` repository.
- W2.3 Require agents to capture repository owner, repository name, PR number,
  branch, and latest PR head SHA before handling comments.
- W2.4 Require paginated GraphQL review-thread enumeration with `--paginate`.
  The command must retain thread IDs, `isResolved`, stale/outdated context where
  available, comment database IDs, URLs, paths, line/original-line fields, and
  comment commit OIDs.
- W2.5 Explicitly state that REST review comments alone are insufficient for
  thread resolution state and that the first page must not be treated as
  complete.
- W2.6 Explain that a thread with replies is still unresolved when
  `isResolved: false`; reply count and elapsed time are not completion evidence.
- W2.7 Require current-head verification before replying to or resolving a
  thread: inspect the relevant file and nearby lines, compare path and line
  context, compare the comment commit OID to the current implementation, and
  classify stale or outdated comments as non-blocking only with concrete
  evidence.
- W2.8 Require threaded inline replies through
  `gh api -X POST repos/<owner>/<repo>/pulls/<n>/comments/<id>/replies`, and
  explain that `<id>` is the numeric review comment database ID rather than the
  GraphQL node ID.
- W2.9 Require evidence-bearing replies. When a fix commit exists, include the
  relevant commit SHA or short SHA and a concise latest-head explanation. When
  no fix commit exists, include the stale, duplicate, informational, or
  not-applicable evidence instead.
- W2.10 Add explicit classification and routing for requirement-bearing
  feedback. Changes to requirements, acceptance criteria, scope, user-visible
  behavior, or workflow contracts route through
  `Brainstormer -> Planner -> Executor` before returning to PR comment
  handling. Implementation-detail feedback that preserves approved requirements
  may route directly to the implementation owner, but the workflow must say that
  classification out loud.
- W2.11 Include optional GraphQL `resolveReviewThread` mutation guidance only
  after current-head verification and concrete handling evidence. If resolution
  permissions are unavailable or the mutation fails, the workflow must leave an
  evidence-bearing threaded reply and report the thread as unresolved instead of
  claiming it is resolved.
- W2.12 Define "handled" as addressed and verified on latest head, replied to
  with evidence and optionally resolved, routed through the proper Superteam
  owner path, or classified non-blocking with evidence.
- W2.13 Warn that silence, elapsed time, local intent, reply without
  verification, PR creation, and green CI alone are not proof that feedback was
  handled.

Acceptance criteria covered: `AC-60-2`, `AC-60-3`, `AC-60-4`, `AC-60-5`,
`AC-60-6`, `AC-60-7`, `AC-60-8`.

### W3: Verify the skill and workflow changes

Run targeted checks plus the repo-level verification relevant to a skill/docs
change.

Commands and expected outcomes:

- W3.1 `pnpm exec markdownlint-cli2 skills/using-github/SKILL.md skills/using-github/workflows/pr-comments.md docs/superpowers/plans/2026-05-15-60-using-github-should-teach-inline-pr-comment-response-and-resolve-plan.md`
  should pass.
- W3.2 `pnpm lint:md` should pass for tracked Markdown files. If unrelated
  pre-existing lint failures appear, capture the exact file and rule, then keep
  the targeted lint command above as the issue-owned evidence.
- W3.3 `pnpm verify:dogfood` should pass, confirming all six in-repo skills
  remain discoverable through the flat layout.
- W3.4 `pnpm verify:marketplace` should pass, confirming marketplace metadata
  remains valid after the skill documentation change.
- W3.5 `rg -n "pr-comments.md|PR comments|Pull request comments" skills/using-github`
  should show the `SKILL.md` Required Procedures reference and the new workflow
  file.
- W3.6 `rg -n -- "--paginate|isResolved|databaseId|resolveReviewThread|comments/<id>/replies|Brainstormer -> Planner -> Executor|latest head|green CI" skills/using-github/workflows/pr-comments.md`
  should show the approved workflow mechanics and guardrails.

Acceptance criteria covered: `AC-60-1` through `AC-60-8`.

### W4: Prepare PR body expectations for Finisher

When implementation is complete and reviewed, the PR body should use the
current repository template contract.

Tasks:

- W4.1 Use `## Linked issue` with `Closes #60`.
- W4.2 Use `## Coverage and risks` as the single AC, evidence, and risk
  summary.
- W4.3 Include one table row per relevant AC from `AC-60-1` through `AC-60-8`.
- W4.4 Put operator-owned manual verification decisions, if any, under
  `## Testing steps`.
- W4.5 Put only pre-merge operational chores, if any, under
  `## Do before merging`.
- W4.6 Do not add a separate AC-to-file:line mapping table.

Acceptance criteria covered: `AC-60-1` through `AC-60-8`.

## Blockers

None.
