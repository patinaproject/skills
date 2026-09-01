---
name: develop-with-workflow
description: Split one issue or instruction set into independent parts, build those parts in parallel with the Claude Workflow tool, and combine them on one branch. Use only when the user asks for parallel implementation.
---

# Develop with a workflow

Use this skill only when the user wants parallel implementation. It produces
one branch with all completed parts combined and verified. It does not run
`polish` or open a pull request. Run `polish`, then `ready-pr`, afterward.

The request may contain an issue, written instructions, or both. Written
instructions control what to build. `working-on-issues` finds the issue and its
branch when one exists.

## Required tools and skills

Confirm these are available before planning:

- Claude Workflow tool
- `working-on-issues`
- `implement`
- `tdd`
- `code-review`
- `resolving-merge-conflicts`
- `to-tickets`
- `polish`
- `ready-pr`
- `codebase-design`

Stop and name anything missing. Provide a project-local install command for its
current source.

The user chose this skill, so the Claude Workflow tool may create parallel
agents in separate worktrees for this run.

## Steps

1. Run `working-on-issues` with the full request. If it finds no issue, warn that
   later commits and a pull request may need an issue reference, then continue
   on the current branch.
2. Use `to-tickets` as a planning guide. Split the request into parts that each
   deliver working behavior through every affected layer. Record what each part
   builds, how to verify it, and which earlier parts it needs. Do not create
   tracker issues.
3. For a broad mechanical change such as renaming a shared symbol, use three
   phases instead: add the new form beside the old one, move callers in
   independent batches, then remove the old form after every caller has moved.
   If a batch cannot pass verification alone, combine and verify the batches
   before removal.
4. Show the proposed parts to the user as a numbered list. Include the title,
   dependencies, implementation, and checks for each part. Ask about part size
   and dependencies. Start implementation only after the user approves the
   list.
5. Count parts that can start without waiting for one another. If fewer than
   two can run together, use `implement` on the current branch and continue to
   step 8.
6. Group the approved parts in dependency order. For each group, use the Claude
   Workflow tool to run every independent part at the same time, one agent per
   part with `isolation: 'worktree'`. Give each agent only that part's work and
   checks. Each agent uses `implement` and `tdd`.
7. After each group finishes, combine its worktrees onto the one branch with
   `resolving-merge-conflicts`, then run the repository's documented checks.
   Ask the user about conflicts that require a product or design decision.
   Start dependent parts from the combined branch so they include the work they
   depend on.
8. Finish when every approved part is on the one branch and the repository's
   checks pass.

## Final report

Report:

- the branch and the parts combined on it
- the number of parts and dependency groups
- whether parallel work ran or the skill used one `implement` run
- conflicts resolved and conflicts that need a user decision
- verification results
- the next steps, `polish` and then `ready-pr`
