# Design: Introduce /using-github as the central GitHub behavior guide [#15](https://github.com/patinaproject/github-flows/issues/15)

## Intent

Introduce `/using-github` as the entry-point skill for GitHub behavior in this
repository. The new skill should orient agents to the repository's GitHub
operating rules and then route them to the existing specialized skills when a
task calls for issue filing, branch setup, issue editing, or changelog writing.

## Requirements

- Create a self-contained `skills/using-github/` skill with `SKILL.md` as the
  main contract.
- Make `/using-github` the starting point for repository-specific GitHub
  behavior, not a replacement for the existing workflow skills.
- Direct agents from `/using-github` to the current specialized skills for
  filing issues, editing issues, creating issue branches, and writing
  changelogs.
- Include the GitHub conventions that apply across workflows: canonical labels,
  issue and PR templates, same-repo relationship rules, public-repo leak
  safety, branch naming, commit title format, PR title format, and release-label
  reservations.
- Update user-facing docs and editor guidance so they center GitHub work around
  `/using-github`.
- Use `superpowers:writing-skills` discipline for the new skill: capture a
  baseline pressure scenario before the skill exists, then verify the written
  skill closes the observed behavior gap.
- Keep instructions concise, imperative, and compatible with Markdown linting.

## Approaches Considered

### Recommended: Umbrella Skill With Routed Workflows

Add `skills/using-github/SKILL.md` as an umbrella behavior guide. The skill owns
the cross-cutting GitHub posture and points to the existing workflow skills for
task-specific procedures.

This keeps the current skills authoritative, avoids duplicating long procedural
steps, and gives agents one obvious starting point when the user asks for
GitHub work.

### Alternative: Merge Existing Skills Into One Large Skill

The repository could collapse all GitHub flows into `/using-github`.

This would create a single command, but it would also make the skill harder to
review, harder to test, and more likely to drift from the individual workflows
that already work.

### Alternative: Documentation-Only Reorientation

The repository could update `README.md`, `AGENTS.md`, and editor guidance to
mention `/using-github` without adding a real skill.

This would improve discoverability slightly, but agents would still lack a
portable skill contract to invoke across runtimes.

## Design

Add `skills/using-github/SKILL.md` with frontmatter that describes the skill as
the behavior guide for GitHub work in repositories that use this plugin.
Following `superpowers:writing-skills`, the description should describe when to
use the skill, not summarize the workflow. Its body should tell agents to:

- discover repository guidance before acting;
- use `/github-flows:new-issue` for new issues;
- use `/github-flows:edit-issue` for issue metadata or body edits;
- use `/github-flows:new-branch` when starting work from an issue;
- use `/github-flows:write-changelog` for milestone changelogs;
- follow canonical labels, templates, relationship, public-safety, commit, and
  PR-title rules from repository docs;
- avoid mutating reserved release labels manually.

The skill should be an orienting contract, not a procedural clone. It should
name the current source documents and specialized skills, then defer to them
for detailed steps.

Update `README.md` so the "What you get" and quick-start guidance introduce
`/using-github` first. The specialized skills should remain visible as routed
workflows available through the umbrella behavior.

Update repository guidance surfaces that teach agents how to behave in this
repo. At minimum, `AGENTS.md`, `.github/copilot-instructions.md`,
`.cursor/rules/github-flows.mdc`, and `.windsurfrules` should point GitHub work
toward `/using-github` before listing individual conventions. `docs/file-structure.md`
should mention the new skill directory as part of the skill inventory.

## Acceptance Criteria

- AC-15-1: Given an agent is asked to perform GitHub work in this repository,
  when the `/using-github` skill is available, then the agent can use it as the
  central behavior guide for repository-specific GitHub conventions.
- AC-15-2: Given the repository's existing GitHub-flow skills remain in place,
  when `/using-github` references issue, branch, PR, changelog, label, template,
  or public-safety behavior, then it directs agents to the current prescribed
  workflows instead of duplicating conflicting instructions.
- AC-15-3: Given contributor-facing docs describe GitHub work, when they are
  updated, then they center the guidance around `/using-github` as the starting
  point for agent behavior.

## Testing

- Before writing the final skill text, run or document a RED pressure scenario
  showing the current behavior without `/using-github`. The scenario should ask
  an agent to handle a mixed GitHub task and record whether it discovers the
  specialized workflows and shared repository rules without the umbrella skill.
- After writing the skill, run or document the matching GREEN pressure scenario
  showing that `/using-github` routes the agent to existing workflows and shared
  GitHub conventions without copying conflicting procedure.
- Run `pnpm lint:md`.
- Use `rg "using-github|new-issue|new-branch|edit-issue|write-changelog"` to
  confirm the new skill and docs route to the expected workflows.
- Review `skills/using-github/SKILL.md` directly for contradictions,
  placeholders, and accidental duplication of detailed workflow steps.

## Out of Scope

- Rewriting the behavior of `new-issue`, `edit-issue`, `new-branch`, or
  `write-changelog`.
- Adding new GitHub API behavior.
- Changing release automation or label inventory.

## Concerns

No approval-relevant concerns remain. The main implementation risk is drift:
`/using-github` must stay concise and route to the existing workflow files
instead of copying their steps. The implementation plan must include the
`writing-skills` pressure-test loop so the skill is verified as process
documentation, not only linted as Markdown.
