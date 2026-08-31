---
name: codex-pr-feedback-loop
description: Keep a Codex develop task active across turns, or continue feedback work on an existing pull request. Use when develop needs durable continuation or a pushed pull request should keep handling automated review feedback.
---

# Pull request feedback loop

For a durable `develop` run, read
[the task automation instructions](workflows/thread-automation.md) and create
the automation before implementation. For standalone feedback work on an
existing pull request, create it after the first successful push.

The automation belongs to this task and worktree. It is not a GitHub webhook or
CI job. The linked instructions define its name, schedule, prompt, fallback,
and stop condition.

Follow these rules:

- Work only in the current directory's default GitHub repository.
- Use a task automation so later runs retain this conversation's context and
  worktree.
- Reply to and resolve a review thread only when a bot or GitHub App started
  it. Fix code requested by a human reviewer, but leave their thread open for
  the reviewer or user to answer and resolve.
- If a human says a previously fixed bug remains or returned, reproduce that
  report again before changing more code.
- Before stopping, apply `ready-pr`'s
  [readiness checks](../ready-pr/references/readiness-predicate.md).
- Leave issue status unchanged.
- Do not merge the pull request.
