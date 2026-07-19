---
name: codex-pr-feedback-loop
description: Loops a Codex app worktree on an existing PR's review feedback. Use when a Codex app chat should keep iterating on a pull request after its first successful push.
---

# PR Feedback Loop

## Quick Start

1. Develop, verify, commit, push, and create or update the PR with the normal
   issue pipeline (`working-on-issue` → build → `polish` → `finish-pr`).
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
- At loop exit, run the completion step: when the review loop is clean (the
  code-review run on the latest head has completed, has actually reviewed it,
  and no unresolved review threads remain), flip the draft to ready only when
  its body contains the exact `<!-- patinaproject-agent-authored-pr -->` marker.
  The flip is one-way and can cover a marked draft that a prior `finish-pr` run
  opened. Never add the marker retroactively, flip an unmarked human draft, or
  write issue state from the PR loop.
- Do not merge the PR.
