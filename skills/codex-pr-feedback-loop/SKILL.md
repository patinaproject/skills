---
name: codex-pr-feedback-loop
description: Keep a Codex app task working through feedback on an existing pull request. Use after the task has pushed the pull request once and should continue handling new automated review feedback.
---

# Pull request feedback loop

First use the repository's normal development process to implement, review,
commit, push, and create or update the pull request. After the first successful
push, read [the task automation instructions](workflows/thread-automation.md)
and create the automation for the current Codex task.

The automation belongs to this task and worktree. It is not a GitHub webhook or
CI job. The linked instructions define its name, schedule, prompt, fallback,
and stop condition.

Follow these rules:

- Work only in the current directory's default GitHub repository.
- Use a task automation so later runs retain this conversation's context.
- Reply to and resolve a review thread only when a bot or GitHub App started
  it. Fix code requested by a human reviewer, but leave their thread open for
  the reviewer or operator to answer and resolve.
- If a human says a previously fixed bug remains or returned, reproduce that
  report again before changing more code.
- Before stopping, apply `ready-pr`'s
  [readiness checks](../ready-pr/references/readiness-predicate.md).
- Leave issue status unchanged.
- Do not merge the pull request.
