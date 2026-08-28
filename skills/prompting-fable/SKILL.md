---
name: prompting-fable
description: Write prompts and choose settings for Claude Fable 5. Use when the user asks about Fable prompts, reasoning effort, long-running goals, worktrees, workflows, subagents, model selection, or Fable-related CLAUDE.md instructions.
---

# Prompting Fable

Check the current task against every section below.

## Ask for end-to-end completion

Fable works best when one prompt states the final result and lets it complete
the implementation, tests, verification, and useful delegation.

- State the result first. Name the exact result categories the final report
  must use, such as `ready to merge`, `needs a rebase`, or `rewrite needed`.
- Give explicit permission to use workflows or subagents when you want them.
- For broad work, ask Fable to propose the separate work areas before starting.
  Review that breakdown before spending time on implementation.

## Use high reasoning or lower

Reasoning effort applies to each step, not the whole run. Start with `high` for
hard work and use `low` or `medium` for routine steps. `xhigh` and `max` often
spend more time reconsidering ordinary steps and can produce larger changes
than the task needs.

## Define long-running goals with checks

For a backlog or other long program, include:

- the exact conditions that finish the work
- the actions Fable may take without asking, such as creating worktrees,
  branching, rebasing, merging, or closing pull requests
- the reviews or approvals that still require a pause

An action not granted in the prompt may require user approval later. Make every
completion condition observable, such as every item in `to-do.md` being checked
off and committed.

## Choose the coordination method

- Use a workflow when several independent tasks can run together and one final
  check can verify the combined result.
- Use separate worktree sessions when each task must pass CI, human review, or a
  product decision before the next starts.
- Within a worktree program, workflows still work well for independent review
  passes before each merge.

Let Fable choose the reviewer roles for the specific task instead of defining a
fixed set of reviewer personalities.

## Choose models by task needs

[glossary.md](glossary.md) defines cost, intelligence, and taste, with example
model scores. Copy it into `CLAUDE.md` when the project needs repeatable model
selection, then update the scores for the available models and subscriptions.

- Use the least expensive model that reliably handles clear implementation,
  log searches, document reading, migrations, or computer use.
- Use a model with strong taste for user-facing UI, writing, and API design.
- Use the strongest reasoning model for plan and implementation reviews. A
  cheaper model can add another independent opinion.

Allow a task to retry with a stronger model when the first result is not good
enough. When work runs outside Claude through a CLI or wrapper, follow
[delegation.md](delegation.md).

## Treat fix time as useful evidence

A fix that takes a few minutes is usually straightforward. Review a fix that
takes around fifteen minutes more carefully. An hour-long fix often points to a
design problem. A suspiciously fast answer that describes code the repository
does not contain also needs investigation.

## Improve instructions after mistakes

Start with short `CLAUDE.md` instructions or a small skill. When Fable makes a
repeatable mistake, ask what instruction would have prevented it, shorten that
answer, and add only the useful rule. Keep exact CLI commands when a mistaken
invocation would be costly. Put the full use and do-not-use condition in a
skill's description because that is the only text available before the skill
loads.
