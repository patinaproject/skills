---
name: codex-pr-feedback-loop
description: Loops a Codex app worktree on an existing PR's review feedback. Use when a Codex app chat should keep iterating on a pull request after its first successful push.
---

# PR Feedback Loop

## Quick Start

1. Develop, verify, commit, push, and create or update the PR with the normal
   issue pipeline (`working-on-issue` → build → `polish` → `ready-pr`).
2. After the first successful PR push, follow
   [workflows/thread-automation.md](workflows/thread-automation.md) to start the
   Codex app thread automation that runs the loop for this chat.

Suggested user prompt:

```text
Use $codex-pr-feedback-loop for <issue-reference>.
```

## Automation Contract

The loop runs as a Codex app thread automation attached to the current
chat/worktree — not a GitHub webhook or CI workflow.

[workflows/thread-automation.md](workflows/thread-automation.md) holds the
canonical runtime rules: create/fallback procedure, automation name, schedule,
scope, stop condition, the exact polling prompt, and guardrails. Read it before
creating the automation.

The durable boundaries at this skill level:

- Stay in the current working directory's default `gh` repository.
- Preserve this chat's context with a thread automation.
- Reply on, resolve, dismiss, and re-request review only on **agent-authored**
  threads, those whose first comment comes from a bot or GitHub App. A
  **human-authored** thread belongs to its author: fix the code it asks for,
  then use the repository's
  `docs/pr-review-readiness.md#who-owns-a-review-conversation` handoff contract
  and leave the conversation for the operator to answer and close.
- A human report that a previously handled bug persists or has returned
  restarts the repository's human-bug-report loop even when the PR head is
  unchanged. Follow that contract before more fix work, or report a blocker.
- At loop exit, run the completion step: when the review loop is clean (the
  code-review run on the latest head has completed, has actually reviewed it,
  and no unresolved agent-authored review threads remain), flip the draft to
  ready. That predicate is the only precondition, and a human's thread never
  gates it; putting the work in front of humans is what the flip is for. The
  flip is one-way and covers any draft that satisfies the predicate, including
  one a prior `ready-pr` run opened. Never re-draft a ready PR or write issue
  state from the PR loop.
- Do not merge the PR.
