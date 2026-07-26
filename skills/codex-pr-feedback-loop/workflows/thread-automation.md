# Thread Automation Workflow

**Goal:** After the first successful PR push, create a Codex app thread
automation that polls the current PR, fixes blocking review feedback and
low-risk cleanup comments worth handling, pushes updates, replies with evidence
on agent-authored threads, briefs the operator on human-authored ones, and —
when no actionable review work remains — runs the completion step that flips
the draft to ready before stopping.

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

Enumerate pull request review threads with paginated GraphQL. Do not rely on REST review comments alone. Retain each thread ID, resolution state, outdated state, path, line context, comment URL, numeric review comment database ID, author, body, and comment commit OID. Also retain each thread's authorship from the opening comment's `author.__typename`: `Bot` is agent-authored (a GitHub App's comments resolve to `Bot` too, so that is one case rather than two), anything else is human-authored, and an unclear author counts as human-authored. Authorship is fixed when the thread opens and later replies never change it.

Classify each unresolved item as actionable/blocking, requirement-changing, scope-changing, low-severity, informational, duplicate, stale, already handled, or not applicable. Low-severity comments are not automatic skips, but only auto-fix objective low-severity classes: typos; broken links; stale names, paths, commands, schedules, or field lists; factual drift from a named canonical source; and duplicated machine-checkable settings or field summaries where the fix is to point at that canonical source. Treat subjective clarity, tone, wording, organization, naming preference, broad redundancy, or style comments as report-only unless the user explicitly asks this thread to handle them.

Automatically fix actionable/blocking feedback and objective low-severity cleanup that preserves accepted requirements, accepted scope, implementation strategy, test strategy, dependency-security conclusions, CI/workflow contracts, and product behavior.

Stop and report human input is required if feedback changes requirements, accepted scope, implementation strategy, test strategy, dependency-security conclusions, CI/workflow contracts, or product behavior. Also stop for secrets, permission blockers, policy blockers, or merge conflicts that cannot be resolved cleanly.

For each actionable/blocking item, inspect the latest head and current file context before editing. Implement the smallest correct root-cause fix. Follow the repository's documented guidance — `AGENTS.md`/`CLAUDE.md` and the docs they import — and its commit and test conventions. Prefer offensive fixes over defensive workarounds.

After edits, run the narrowest local verification command that covers the changed behavior. Do not use hidden skip env vars, broad bypass knobs, or --no-verify. If local verification is blocked, report the exact blocker instead of claiming success.

When fixes are verified, commit focused changes with this repo's commit rules and push the PR branch. Reply to each handled agent-authored review thread using the REST threaded replies endpoint with evidence: fix commit SHA, verification command, and how the latest head addresses the comment. Resolve eligible review threads, the agent-authored ones, through GraphQL only after latest-head verification succeeds.

Fix human-authored threads the same way, but leave the conversation alone: no reply, no resolve, no dismissal, and no re-requested review, however strong the evidence. Report each unresolved human-authored thread to the operator with its link, the finding or acceptance criterion it maps to, its state on the latest head with the evidence behind that state, and a suggested reply the operator edits before sending. Grade that evidence: say what has been observed on the latest head and what remains unverified, so the operator relays a claim they can stand behind.

A human report that a previously handled bug persists or has returned is renewed evidence, not a duplicate, stale comment, or ordinary actionable item. It immediately invalidates the earlier verified or fixed disposition even when the PR head SHA has not changed. Before more fix work, map the latest report to the existing finding or acceptance criterion, keep same-behavior reports together, and re-derive or amend the reproduction from the human's latest expected and actual wording. Follow the repository's human-bug-report or fix-claims contract when it has one. Observe the reproduction fail on the environment and exact build the human used, then after the fix observe it pass on the deployed exact final head. If it does not fail, leave verification unmet and route provenance, attribution, or conflicting expectations through the repository's owner instead of preserving the earlier fixed claim. Put the renewed report, invalidated prior evidence, and new red/green evidence or unmet state in the operator brief; leave the human-authored conversation untouched.

Before stopping, run the completion step. The readiness predicate is the whole gate: the code-review run — the repository's code-review check that posts review threads — has completed and has actually reviewed the latest PR head. Its check run for the current head SHA must have status `completed`, and either it concluded `success` or `neutral`, or it posted review threads that are now resolved. A queued or in-progress run does not satisfy the predicate even if it has already posted threads. A completed run that errored, timed out, or was cancelled without posting threads never reviewed, so do not flip. Zero unresolved agent-authored GraphQL review threads must also remain on the latest head; a human-authored thread never gates the flip, because putting the work in front of humans is what the flip is for. When the predicate holds, flip the draft to ready with `gh pr ready`. The PR transition does not write issue state; integration automation owns issue lifecycle changes. The flip is one-way: never re-draft a ready PR. Any draft satisfying the predicate is a legitimate flip target, including one a prior ready-pr run opened; a human work-in-progress draft is excluded by the predicate itself, since it has no completed code-review run on its head with every thread resolved. A PR that runs no code-review loop on its draft (a repo with no code-review automation, a repo whose code review skips drafts, or a per-PR skip such as a `skip-code-review` label) is opened non-draft and has nothing to flip.

Stop this automation when no unresolved actionable/blocking review feedback remains and every low-severity item is either handled as objective cleanup or explicitly classified as stale, duplicate, already handled, informational, subjective/report-only, or requiring a human decision, and the completion step above has run. A human-authored thread counts as handled once its code fix is on the latest head and its operator-brief entry is written; a renewed bug report also requires repeated red/green evidence or an explicitly unmet verification state. Waiting for the operator to answer it is not this automation's job. Report the PR URL, latest head SHA, handled thread URLs, verification evidence, whether the PR was flipped to ready, the operator brief for every unresolved human-authored thread, and any remaining non-blocking items with the reason they were left open.
```

## Manual Fallback

If the automation tool is unavailable, tell the user to create a Codex app
thread automation from the Automations menu using the canonical settings and
the exact prompt above. Include the selected polling interval, or 10 minutes
when the user gives no preference.

Do not create a standalone project automation as a fallback unless the user
explicitly asks for independent runs instead of preserving this chat's context.
