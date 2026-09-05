# Repository File Structure

This repository is the marketplace surface for Patina Project plugins and
related install documentation. General skills live under `skills/<name>/`.
Engineering plugin skills live under `plugins/engineering/skills/<name>/`.

## Top level

- `skills/scaffold-repository/`: scaffold-repository skill
- `skills/using-github/`: using-github skill
- `plugins/engineering/skills/working-on-issues/`: shared issue preflight (resolve live tracker, align branch and worktree, mark started)
- `plugins/engineering/skills/move-branch-here/`: Engineering worktree branch handover skill
- `plugins/engineering/skills/move-session-here/`: cross-agent session transcript handover skill
- `skills/install-skills/`: project-local skills CLI installation skill
- `skills/grill-to-spec/`: grill-and-hand-off skill that hands settled
  decisions to `/to-spec`, which writes the doc-change proposals
- `skills/design-by-contract/`: consequential system contract design overlay
- `plugins/engineering/skills/principle-offensive-programming/`: defensive-code classification principle
- `skills/grill-system-design/`: focused system design grilling skill
- `skills/review-system-design/`: contract dependency review skill
- `skills/writing-for-patina-mode/`: operator prompt authoring for `patina-mode`
- `plugins/engineering/skills/gather-evidence/`: current-target evidence for human feedback
- `plugins/engineering/skills/running-mobile-simulators/`: shared-host Android emulator and iOS simulator lifecycle skill
- `plugins/engineering/skills/patina-mode/`: Patina Project's default engineering mode, forked from pstack
- `plugins/engineering/agents/patina-agent.md`: Patina mode routing agent
- `plugins/engineering/hooks/`: Engineering session-start integration
- `plugins/engineering/.claude-plugin/plugin.json`: Claude Engineering plugin manifest
- `plugins/engineering/.codex-plugin/plugin.json`: Codex Engineering plugin manifest
- `.agents/skills/<name>/`: committed overlay; repo-owned skills are symlinks
  into their owning plugin or `skills/`, vendored third-party skills are real
  directories
- `.claude/skills/<name>/`: committed overlay; repo-owned skills symlink into
  their owning plugin or `skills/`, vendored third-party skills symlink into
  `../../.agents/skills/<name>`
- `.claude-plugin/marketplace.json`: Claude marketplace catalog
- `.claude-plugin/plugin.json`: Claude plugin manifest listing skill paths
- `.codex-plugin/plugin.json`: Codex plugin manifest listing skill paths
- `.agents/plugins/marketplace.json`: Codex marketplace catalog
- `.codex/environments/environment.toml`: Codex workspace setup for this repository
- `.codex/config.toml`: Codex hosted Linear MCP registration for private-repo
  operations and mirror inspection
- `.mcp.json`: hosted Linear MCP registration for supported agent hosts
- `skills-lock.json`: vercel-labs CLI install lockfile
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
| `scaffold-repository` | `skills/scaffold-repository/` | Scaffold or realign a repo to the Patina Project baseline |
| `using-github` | `skills/using-github/` | GitHub workflow skill |
| `working-on-issues` | `plugins/engineering/skills/working-on-issues/` | Resolve the live tracker, align the issue branch and worktree, and mark work started |
| `move-branch-here` | `plugins/engineering/skills/move-branch-here/` | Worktree branch handover workflow |
| `move-session-here` | `plugins/engineering/skills/move-session-here/` | Claude Code and Codex session transcript handover workflow |
| `install-skills` | `skills/install-skills/` | Project-local skills CLI installation workflow |
| `grill-to-spec` | `skills/grill-to-spec/` | Settle a design for `/to-spec` to publish with doc-change proposals |
| `design-by-contract` | `skills/design-by-contract/` | Consequential system contract design overlay |
| `principle-offensive-programming` | `plugins/engineering/skills/principle-offensive-programming/` | Defensive-code classification principle |
| `grill-system-design` | `skills/grill-system-design/` | Focused system design grilling |
| `review-system-design` | `skills/review-system-design/` | Contract dependency review |
| `writing-for-patina-mode` | `skills/writing-for-patina-mode/` | Operator prompt authoring for `patina-mode` |
| `gather-evidence` | `plugins/engineering/skills/gather-evidence/` | Current-target evidence for human feedback |
| `running-mobile-simulators` | `plugins/engineering/skills/running-mobile-simulators/` | Shared-host Android emulator and iOS simulator lifecycle |

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

Repo-owned skills appear as one-hop symlinks to either `skills/` or their plugin
directory.

| Overlay path | Symlink target | Mode |
| --- | --- | --- |
| `.agents/skills/<name>` | `../../skills/<name>` | `120000` |
| `.claude/skills/<name>` | `../../skills/<name>` | `120000` |
| `.agents/skills/<engineering-name>` | `../../plugins/engineering/skills/<name>` | `120000` |
| `.claude/skills/<engineering-name>` | `../../plugins/engineering/skills/<name>` | `120000` |

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
