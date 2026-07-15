# Thread Automation Workflow

**Goal:** After the first successful PR push, create a Codex app thread
automation that polls the current PR, fixes blocking review feedback and
low-risk cleanup comments worth handling, pushes updates, replies with
evidence, and — when no actionable review work remains — runs the completion
step that flips the draft to ready and moves the linked issue to `In review`
before stopping.

## Preconditions

- A PR exists for the current branch.
- The branch has been pushed successfully.
- `gh` is authenticated for the current repository.
- The Codex app automation tool is available, or the user can create the
  automation manually from the app's Automations menu.

Before creating the automation, resolve and report:

```sh
gh repo view --json nameWithOwner --jq .nameWithOwner
gh pr view --json number,headRefName,headRefOid,url
```

If no PR exists for the current branch, finish the PR workflow first.

## Canonical Settings

- Name: `PR feedback loop`
- Kind: thread/heartbeat automation
- Destination: current thread
- Polling interval: user-selected minutes; default to 10 minutes when the user
  gives no preference
- Schedule: `FREQ=MINUTELY;INTERVAL=<polling-minutes>`
- Status: `ACTIVE`
- Stop condition: defined by the final paragraph of the automation prompt below

## Create The Automation

When `codex_app.automation_update` is available, create a heartbeat/thread
automation using the canonical settings above and the prompt below.

Before creating the automation, ask the user for a polling interval when they
have not already provided one. Use a positive whole number of minutes. If they
do not care, use 10 minutes.

Use this prompt exactly except for small repository-specific additions that make
the current PR easier to resolve:

```text
Poll the current branch's GitHub PR for new unresolved review feedback. Use the current working directory's default gh repository. Resolve the fields listed in Preconditions with gh before acting.

Enumerate pull request review threads with paginated GraphQL. Do not rely on REST review comments alone. Retain each thread ID, resolution state, outdated state, path, line context, comment URL, numeric review comment database ID, author, body, and comment commit OID.

Classify each unresolved item as actionable/blocking, requirement-changing, scope-changing, low-severity, informational, duplicate, stale, already handled, or not applicable. Low-severity comments are not automatic skips, but only auto-fix objective low-severity classes: typos; broken links; stale names, paths, commands, schedules, or field lists; factual drift from a named canonical source; and duplicated machine-checkable settings or field summaries where the fix is to point at that canonical source. Treat subjective clarity, tone, wording, organization, naming preference, broad redundancy, or style comments as report-only unless the user explicitly asks this thread to handle them.

Automatically fix actionable/blocking feedback and objective low-severity cleanup that preserves accepted requirements, accepted scope, implementation strategy, test strategy, dependency-security conclusions, CI/workflow contracts, and product behavior.

Stop and report human input is required if feedback changes requirements, accepted scope, implementation strategy, test strategy, dependency-security conclusions, CI/workflow contracts, or product behavior. Also stop for secrets, permission blockers, policy blockers, or merge conflicts that cannot be resolved cleanly.

For each actionable/blocking item, inspect the latest head and current file context before editing. Implement the smallest correct root-cause fix. Follow the repository's documented guidance — `AGENTS.md`/`CLAUDE.md` and the docs they import — and its commit and test conventions. Prefer offensive fixes over defensive workarounds.

After edits, run the narrowest local verification command that covers the changed behavior. Do not use hidden skip env vars, broad bypass knobs, or --no-verify. If local verification is blocked, report the exact blocker instead of claiming success.

When fixes are verified, commit focused changes with this repo's commit rules and push the PR branch. Reply to each handled review thread using the REST threaded replies endpoint with evidence: fix commit SHA, verification command, and how the latest head addresses the comment. Resolve eligible review threads through GraphQL only after latest-head verification succeeds.

Before stopping, run the completion step. The readiness predicate is the whole gate: the code-review run — the repository's code-review check that posts review threads — has actually reviewed the latest PR head (it concluded `success` or `neutral`, or it posted review threads that are now resolved; a run that errored, timed out, or was cancelled without posting threads never reviewed, so do not flip) and zero unresolved GraphQL review threads remain on the latest head. When the predicate holds, flip the draft to ready with `gh pr ready`, then advance the linked issue's board Status to `In review` by invoking working-on-github-issue with stage in-review — the single writer of issue lifecycle state; do not write that board state directly. If working-on-github-issue is unavailable, still flip the PR and report the skipped board move. The flip is one-way: never re-draft a ready PR, and flip only an agent-authored draft (identified by the PR's agent author) — a draft a prior finish-pr run opened is a legitimate flip target — never a human's work-in-progress draft. A PR that runs no code-review loop on its draft (a repo with no code-review automation, a repo whose code review skips drafts, or a per-PR skip such as a `skip-code-review` label) is opened non-draft and has nothing to flip.

Stop this automation when no unresolved actionable/blocking review feedback remains and every low-severity item is either handled as objective cleanup or explicitly classified as stale, duplicate, already handled, informational, subjective/report-only, or requiring a human decision, and the completion step above has run. Report the PR URL, latest head SHA, handled thread URLs, verification evidence, whether the PR was flipped to ready and the issue moved to In review, and any remaining non-blocking items with the reason they were left open.
```

## Manual Fallback

If the automation tool is unavailable, tell the user to create a Codex app
thread automation from the Automations menu using the canonical settings and
the exact prompt above. Include the selected polling interval, or 10 minutes
when the user gives no preference.

Do not create a standalone project automation as a fallback unless the user
explicitly asks for independent runs instead of preserving this chat's context.
