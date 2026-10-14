# Repository File Structure

This repository is the marketplace surface for Patina Project plugins and
related install documentation.
Engineering plugin skills live under `plugins/engineering/skills/<name>/`.
Team plugin skills live under `plugins/team/skills/<name>/`.

## Top level

- `plugins/team/skills/scaffold-repository/`: scaffold-repository skill
- `plugins/team/skills/using-github/`: using-github skill
- `plugins/team/skills/update-branch/`: local branch update skill
- `plugins/engineering/skills/working-on-issues/`: shared issue preflight (resolve live tracker, align branch and worktree, mark started)
- `plugins/engineering/skills/move-branch-here/`: Engineering worktree branch handover skill
- `plugins/engineering/skills/move-session-here/`: cross-agent session transcript handover skill
- `plugins/team/skills/install-skills/`: project-local skills CLI installation skill
- `plugins/team/skills/design-by-contract/`: consequential system contract design overlay
- `plugins/engineering/skills/principle-offensive-programming/`: defensive-code classification principle
- `plugins/team/skills/grill-system-design/`: focused system design grilling skill
- `plugins/team/skills/review-system-design/`: contract dependency review skill
- `plugins/team/skills/writing-for-pstack/`: operator prompt authoring for `patina-mode`
- `plugins/team/skills/gmail-inbox-triage/`: Gmail inbox triage into four labeled buckets
- `plugins/engineering/skills/gather-evidence/`: current-target evidence for human feedback
- `plugins/engineering/skills/running-mobile-simulators/`: shared-host Android emulator and iOS simulator lifecycle skill
- `plugins/engineering/skills/pr/`: local PR body contract adapted from Matt Pocock
- `plugins/engineering/skills/pr-readiness/`: centralized PR evidence evaluator and publication command
- `plugins/team/skills/pr-review-assistant/`: user-invoked pair review of someone else's pull request
- `plugins/engineering/skills/patina-mode/`: Patina Project's default engineering mode, forked from pstack
- `plugins/team/skills/retro/`: Coding-session retrospective workflow
- `plugins/team/skills/to-spec/`: Issue spec drafting and publication workflow
- `plugins/team/skills/to-tickets/`: Tracer-bullet ticket breakdown workflow
- `plugins/team/skills/triage/`: Issue and pull-request triage workflow
- `plugins/team/skills/show-me/`: upstream show-me mirror from humanlayer (visual explanation)
- `plugins/team/skills/ask-matt/`: upstream mirror (mattpocock)
- `plugins/team/skills/codebase-design/`: upstream mirror (mattpocock)
- `plugins/team/skills/domain-modeling/`: upstream mirror (mattpocock)
- `plugins/team/skills/grill-me/`: upstream mirror (mattpocock)
- `plugins/team/skills/grilling/`: upstream mirror (mattpocock)
- `plugins/team/skills/handoff/`: upstream mirror (mattpocock)
- `plugins/team/skills/improve-codebase-architecture/`: upstream mirror (mattpocock)
- `plugins/team/skills/setup-matt-pocock-skills/`: upstream mirror (mattpocock)
- `plugins/team/skills/teach/`: upstream mirror (mattpocock)
- `plugins/team/skills/to-questionnaire/`: upstream mirror (mattpocock)
- `plugins/team/skills/wait-what/`: upstream mirror (mattpocock)
- `plugins/team/.claude-plugin/plugin.json`: Claude Team plugin manifest
- `plugins/team/.codex-plugin/plugin.json`: Codex Team plugin manifest
- `plugins/engineering/agents/patina-agent.md`: Patina mode routing agent
- `plugins/engineering/hooks/`: Engineering session-start integration
- `plugins/engineering/.claude-plugin/plugin.json`: Claude Engineering plugin manifest
- `plugins/engineering/.codex-plugin/plugin.json`: Codex Engineering plugin manifest
- `.agents/skills/<name>/`: committed overlay; repo-owned skills are symlinks
  into their owning plugin, vendored third-party skills are real
  directories
- `.claude/skills/<name>/`: committed overlay; repo-owned skills symlink into
  their owning plugin, vendored third-party skills symlink into
  `../../.agents/skills/<name>`
- `.claude-plugin/marketplace.json`: Claude marketplace catalog
- `.agents/plugins/marketplace.json`: Codex marketplace catalog
- `.codex/environments/environment.toml`: Codex workspace setup for this repository
- `.codex/config.toml`: Codex hosted Linear MCP registration for private-repo
  operations and mirror inspection
- `.mcp.json`: hosted Linear MCP registration for supported agent hosts
- `upstream-skills.json`: pinned upstream sources and sync targets
- `upstream-skills-forks.json`: deliberate differences from pinned upstreams
- `skills-lock.json`: vercel-labs CLI install lockfile for local-only skills
- `docs/`: contributor-facing docs for skill maintenance
- `docs/agents/`: agent configuration, the canonical location the upstream
  `mattpocock/skills` family writes and reads
- `docs/agents/issue-tracker.md`: sole provider-specific tracker adapter, and
  the real file
- `docs/issue-tracker.md`: relative compatibility symlink to
  `agents/issue-tracker.md`, so either path resolves to one adapter
- `package.json`, `commitizen.config.json`, `commitlint.config.js`: repo tooling
- `.husky/`: local git hooks
- `.lintstagedrc.js`: lint-staged config; markdown exclusions come from
  `.markdownlint-cli2.jsonc`

## Owned skill layout

Skills owned by this repository:

| Skill | Canonical path | Description |
| --- | --- | --- |
| `scaffold-repository` | `plugins/team/skills/scaffold-repository/` | Scaffold or realign a repo to the Patina Project baseline |
| `using-github` | `plugins/team/skills/using-github/` | GitHub workflow skill |
| `update-branch` | `plugins/team/skills/update-branch/` | Local branch update workflow |
| `working-on-issues` | `plugins/engineering/skills/working-on-issues/` | Resolve the live tracker, align the issue branch and worktree, and mark work started |
| `move-branch-here` | `plugins/engineering/skills/move-branch-here/` | Model-directed worktree branch handover workflow |
| `move-session-here` | `plugins/engineering/skills/move-session-here/` | Claude Code and Codex session transcript handover workflow |
| `install-skills` | `plugins/team/skills/install-skills/` | Project-local skills CLI installation workflow |
| `design-by-contract` | `plugins/team/skills/design-by-contract/` | Consequential system contract design overlay |
| `principle-offensive-programming` | `plugins/engineering/skills/principle-offensive-programming/` | Defensive-code classification principle |
| `grill-system-design` | `plugins/team/skills/grill-system-design/` | Focused system design grilling |
| `review-system-design` | `plugins/team/skills/review-system-design/` | Contract dependency review |
| `writing-for-pstack` | `plugins/team/skills/writing-for-pstack/` | Operator prompt authoring for `patina-mode` |
| `gmail-inbox-triage` | `plugins/team/skills/gmail-inbox-triage/` | Gmail inbox triage into four labeled buckets |
| `gather-evidence` | `plugins/engineering/skills/gather-evidence/` | Current-target evidence for human feedback |
| `running-mobile-simulators` | `plugins/engineering/skills/running-mobile-simulators/` | Shared-host Android emulator and iOS simulator lifecycle |
| `retro` | `plugins/team/skills/retro/` | Coding-session retrospective workflow |
| `to-spec` | `plugins/team/skills/to-spec/` | Issue spec drafting and publication workflow |
| `to-tickets` | `plugins/team/skills/to-tickets/` | Tracer-bullet ticket breakdown workflow |
| `triage` | `plugins/team/skills/triage/` | Issue and pull-request triage workflow |
| `show-me` | `plugins/team/skills/show-me/` | Visual explanation of the current topic (upstream mirror from humanlayer) |
| `ask-matt` | `plugins/team/skills/ask-matt/` | Upstream mattpocock mirror in the Team plugin |
| `codebase-design` | `plugins/team/skills/codebase-design/` | Upstream mattpocock mirror in the Team plugin |
| `domain-modeling` | `plugins/team/skills/domain-modeling/` | Upstream mattpocock mirror in the Team plugin |
| `grill-me` | `plugins/team/skills/grill-me/` | Upstream mattpocock mirror in the Team plugin |
| `grilling` | `plugins/team/skills/grilling/` | Upstream mattpocock mirror in the Team plugin |
| `handoff` | `plugins/team/skills/handoff/` | Upstream mattpocock mirror in the Team plugin |
| `improve-codebase-architecture` | `plugins/team/skills/improve-codebase-architecture/` | Upstream mattpocock mirror in the Team plugin |
| `setup-matt-pocock-skills` | `plugins/team/skills/setup-matt-pocock-skills/` | Upstream mattpocock mirror in the Team plugin |
| `teach` | `plugins/team/skills/teach/` | Upstream mattpocock mirror in the Team plugin |
| `to-questionnaire` | `plugins/team/skills/to-questionnaire/` | Upstream mattpocock mirror in the Team plugin |
| `wait-what` | `plugins/team/skills/wait-what/` | Upstream mattpocock mirror in the Team plugin |
| `pr` | `plugins/engineering/skills/pr/` | PR body structure and evidence guidance |
| `pr-readiness` | `plugins/engineering/skills/pr-readiness/` | Candidate-aware evidence evaluation and the sole ready transition |
| `pr-review-assistant` | `plugins/team/skills/pr-review-assistant/` | User-invoked pair review that presents a pull request as an artifact and a to-do list |

`find-skills` is a third-party vendored skill from `vercel-labs/skills`. It is
installed via the vercel-labs CLI and is not owned by this repository. Install
with: `npx skills@latest add vercel-labs/skills@find-skills`

Each owned skill directory contains at minimum a `SKILL.md` with YAML
frontmatter including `name: <name>` and `description:` fields. Supporting
files such as templates, agents, and workflow docs live alongside `SKILL.md`.

## Overlay layout

The agent runtime discovers skills through two committed overlay directories.
Both repo-owned and vendored third-party skills are committed, so they load
immediately in a fresh clone or worktree with no install step.

Repo-owned skills appear as one-hop symlinks into their plugin directory.

| Overlay path | Symlink target | Mode |
| --- | --- | --- |
| `.agents/skills/<engineering-name>` | `../../plugins/engineering/skills/<name>` | `120000` |
| `.claude/skills/<engineering-name>` | `../../plugins/engineering/skills/<name>` | `120000` |
| `.agents/skills/<team-name>` | `../../plugins/team/skills/<name>` | `120000` |
| `.claude/skills/<team-name>` | `../../plugins/team/skills/<name>` | `120000` |

Exception: `teach` ships in both Engineering and Team. The flat overlays
(`.agents/skills/teach`, `.claude/skills/teach`) point at the Engineering copy;
the Team copy is reached as `team:teach`.

Vendored third-party skills (recorded in `skills-lock.json`) are committed as
real directories under `.agents/skills/<name>`, with `.claude/skills/<name>`
as a relative symlink into `../../.agents/skills/<name>`. `pnpm skills:install`
re-vendors them from their sources via the upstream skills CLI
(`skills experimental_install`); the refreshed overlays are then committed.
`scripts/clean.sh` never prunes these committed overlays.

## Symlink hygiene

All symlinks are relative, so they resolve correctly regardless of clone
location.

Requirements:

- `git config --get core.symlinks` must return `true` (macOS default). On
  Windows, run `git config core.symlinks true` in an admin shell before cloning,
  or use WSL.
- Symlinks are tracked as mode `120000` entries. Verify with:
  `git ls-files -s .agents/skills/ .claude/skills/`
- The `.gitattributes` rules `export-ignore` both overlay directories so
  `git archive` release tarballs do not include the overlay surface.

## Migration history

This repository was consolidated from separate upstream repositories in issue
[#58](https://github.com/patinaproject/skills/issues/58). Current public work
and its durable context live on GitHub issues.

Release history remains available in [CHANGELOG.md](../CHANGELOG.md). Current
release mechanics are documented in [release-flow.md](./release-flow.md).
