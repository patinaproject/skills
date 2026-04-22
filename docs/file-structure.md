# Repository File Structure

This repository keeps installable skill content in `skills/` and supporting documentation in `docs/`.

## Top level

- `skills/`: installable or shareable skill packages
- `docs/`: repository docs, design docs, and planning artifacts
- `package.json`: minimal repo tooling managed with `pnpm`
- `commitlint.config.js`: commit message rules
- `.husky/`: git hooks, including `commit-msg`

## Skills

Each skill should live in its own directory under `skills/`.

Example:

```text
skills/
  superteam/
    SKILL.md
    agent-spawn-template.md
    pr-body-template.md
```

- `SKILL.md`: the main skill contract, workflow, and routing rules
- `agent-spawn-template.md`: reusable spawn guidance for multi-agent roles
- `pr-body-template.md`: PR checklist and reporting template for finish-stage work

Keep skill directories self-contained. Prefer adjacent support files over hidden, tool-specific wrappers unless a runtime requires them.

## Docs

Use `docs/` for durable repository documentation and implementation artifacts.

Example:

```text
docs/
  file-structure.md
  superpowers/
    plans/
      2026-04-22-superteam-import-plan.md
```

- `docs/file-structure.md`: contributor-facing layout guide
- `docs/superpowers/specs/`: design documents created during brainstorming
- `docs/superpowers/plans/`: implementation plans created after design approval

## Contributor expectation

When adding a new skill, mirror the `skills/superteam/` pattern: create a dedicated directory, keep the main contract in `SKILL.md`, and place supporting templates or references next to it. Update `docs/` when the repository structure or contributor workflow changes.
