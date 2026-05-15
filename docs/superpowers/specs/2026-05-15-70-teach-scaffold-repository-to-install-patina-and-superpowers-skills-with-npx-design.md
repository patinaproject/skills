# Design: Teach scaffold-repository to install Patina and Superpowers skills with npx [#70](https://github.com/patinaproject/skills/issues/70)

## Context

`scaffold-repository` already emits Superteam-oriented repository shape: `docs/superpowers/` skeletons and `.claude/settings.json` plugin enablement for `superteam@patinaproject-skills` and `superpowers@claude-plugins-official`. That declarative setup is useful for hosts with marketplace support, but it leaves a gap for portable skill installation across runtimes that can use the `npx skills` CLI.

Issue #70 closes that gap by making the generated repository tell users how to install both the Patina Project skills and Superpowers skills through `npx skills`, and by adding a repeatable package-script path when scaffolded repos emit package commands for skill installation.

## Requirements

- `AC-70-1`: Generated scaffold documentation tells users how to install the Patina Project skills with `npx skills`.
- `AC-70-2`: Generated scaffold documentation tells users how to install Superpowers skills with `npx skills`.
- `AC-70-3`: When scaffold-repository emits package scripts or helper scripts for skill installation, those scripts install both the Patina Project skills and Superpowers skills through the `npx skills` structure.
- `AC-70-4`: The scaffolded Superteam option no longer relies only on declarative plugin enablement or `docs/superpowers/` skeletons; it gives users a repeatable install path for the skills required to run Superteam.
- `AC-70-5`: Existing host marketplace instructions remain available where appropriate, while `npx skills` becomes the portable cross-runtime installation structure.

## Proposed Approach

Use the existing scaffold templates as the product surface. The generated `README.md` for agent-plugin repositories should lead with an `npx skills` install path for portable runtime setup, then keep Claude Code and Codex marketplace instructions as host-specific alternatives. The generated `AGENTS.md` should make the Superteam opt-in explicit: if the repo uses Superteam, contributors must install both Patina Project skills and Superpowers skills through the package script or direct `npx skills` commands before expecting Superteam to run.

Add a generated package script to `templates/core/package.json.tmpl`, tentatively named `skills:install`, that runs the two `npx skills` installs in sequence. This satisfies the helper-script/package-command portion without adding a custom shell script unless the implementation discovers quoting or portability problems in `package.json` scripts. The script should install:

- Patina Project skills from `patinaproject/skills`
- Superpowers skills from the official Superpowers source used by the existing project plugin setting

The generated docs should show both the script form and the underlying direct commands, so users can recover if they are not using PNPM scripts yet.

## Files to Change

- `skills/scaffold-repository/SKILL.md`: update the Superteam opt-in and Plugin enablement sections so the skill contract says the scaffold emits a portable `npx skills` installation path, not only `.claude/settings.json` and `docs/superpowers/`.
- `skills/scaffold-repository/templates/core/package.json.tmpl`: add `skills:install` for the repeatable install path.
- `skills/scaffold-repository/templates/agent-plugin/README.md.tmpl`: add portable `npx skills` installation guidance for generated plugin repos, while retaining Claude Code and Codex marketplace install guidance as host-specific options.
- `skills/scaffold-repository/templates/core/AGENTS.md.tmpl`: add contributor guidance for Superteam-enabled repos to run the skill installer path before invoking Superteam.
- `skills/scaffold-repository/audit-checklist.md`: update the realignment checklist so repos with Superteam scaffolding are considered stale if they lack the portable install instructions or package script.
- Root `AGENTS.md` / adjacent generated docs may need regeneration only if the scaffold self-apply check reports drift for files this repo round-trips from the templates.

## Alternatives Considered

### Documentation only

This would satisfy the first two acceptance criteria but leave package-command generation unchanged. It is too weak because `AC-70-3` asks for emitted scripts or package scripts to install both skill sets when such commands exist.

### New shell helper script

A dedicated `scripts/install-skills.sh` would make command sequencing explicit, but it adds another emitted executable file and realignment surface. The package-script-first approach is smaller and fits the existing baseline unless implementation proves the command is too awkward for `package.json`.

### Marketplace-only instructions

Keeping only `/plugin marketplace add` and Codex marketplace instructions preserves current host flows but fails the portable runtime requirement. Marketplace guidance should remain, but it should no longer be the only documented path for Superteam readiness.

## Validation Plan

- Run `pnpm lint:md`.
- Run `pnpm verify:dogfood`.
- Run `pnpm apply:scaffold-repository:check`.
- Run targeted `rg` checks for `npx skills`, Patina Project skills, Superpowers skills, and `skills:install` across the scaffold skill and emitted templates.

## Skill-Quality Review Notes

This design touches `skills/**/*.md` and scaffold templates that change future agent-facing behavior, so implementation must use the repository-required `write-a-skill` structure check before editing skill files and the Superpowers `writing-skills` quality gate for skill/workflow-contract pressure dimensions.

Required checks for the implementation plan:

- RED/GREEN baseline: identify the current generated repo failure mode: Superteam-oriented shape exists, but no repeatable `npx skills` installation path is emitted.
- Rationalization resistance: block the shortcut "marketplace settings are enough" by documenting `npx skills` as the portable path.
- Role ownership: `scaffold-repository` owns emitted repository docs and scripts; Superteam itself is not changed by this issue.
- Stage-gate bypass: do not skip Gate 1 or implement before approval; do not treat existing `.claude/settings.json` enablement as satisfying runtime installation.
- Token efficiency: keep generated guidance compact and avoid duplicating long host-specific marketplace docs in every section.

## Self-Review

- Placeholder scan: no unresolved TODO/TBD placeholders remain.
- Consistency: requirements, file list, and validation plan all map to issue #70 acceptance criteria.
- Scope: this is one scaffold-repository change and does not require changing the Superteam skill prerequisite warning.
- Ambiguity: the design chooses a package-script-first helper path and keeps shell helper creation only as a fallback if implementation needs it.
