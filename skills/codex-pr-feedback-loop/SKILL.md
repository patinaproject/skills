---
name: codex-pr-feedback-loop
description: Keeps an issue-linked Codex app PR polling for unresolved review feedback, objective low-risk cleanup, verified fixes, replies, and pushed updates. Use when a Codex app worktree should continue iterating on an existing pull request after the first successful push.
---

# PR Feedback Loop

Use this skill when the user wants a Codex app worktree chat to develop an
issue and then keep iterating on PR review feedback after the first push.

## Quick Start

For issue-linked development, start with the repository's normal GitHub
workflow through `new-branch` and `finish-pr`:

1. Develop, verify, commit, push, and create or update the PR with the normal
   issue workflow.
2. After the first successful PR push, follow
   [workflows/thread-automation.md](workflows/thread-automation.md) to create a
   Codex app thread automation for the same chat.

Suggested user prompt:

```text
Use $codex-pr-feedback-loop for issue #123.
```

## Automation Contract

The automation is a Codex app thread automation attached to the current
chat/worktree, not a GitHub webhook or CI workflow.

See [workflows/thread-automation.md](workflows/thread-automation.md) for the
canonical create/fallback procedure, automation name, schedule, scope, stop
condition, prompt, and guardrails. Keep this file as a routing summary, not a
second copy of the runtime rules.

At this skill level, the durable boundaries are:

- Stay in the current working directory's default `gh` repository.
- Preserve this chat's context with a thread automation.
- Do not merge the PR.
