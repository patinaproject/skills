# Repository File Structure

This repository is the marketplace surface for Patina Project plugins and
related install documentation. General skills live under `skills/<name>/`.
Engineering plugin skills live under `plugins/engineering/skills/<name>/`.

## Top level

- `skills/scaffold-repository/`: scaffold-repository skill
- `skills/using-github/`: using-github skill
- `skills/new-branch/`: issue branch preparation skill
- `skills/working-on-issue/`: Patina Project Skills issue preparation skill
- `plugins/engineering/skills/working-on-issues/`: shared issue preflight (resolve live tracker, align branch and worktree, mark started)
- `skills/develop/`: issue development orchestration skill
- `skills/develop-with-workflow/`: Claude Workflow-orchestrated parallel slice build skill
- `skills/ready-pr/`: PR readiness and publication skill
- `skills/merge-pr/`: repository-managed auto-merge skill
- `skills/finish-pr/`: deprecated compatibility alias for `ready-pr`
- `skills/codex-pr-feedback-loop/`: Codex PR review feedback automation skill
- `skills/polish/`: incremental local architecture and code-review skill
- `skills/update-branch/`: local branch update skill
- `skills/move-branch-here/`: worktree branch handover skill
- `plugins/engineering/skills/move-branch-here/`: Engineering worktree branch handover skill
- `skills/install-skills/`: project-local skills CLI installation skill
- `skills/grill-to-spec/`: grill-and-hand-off skill that sends doc changes to
  `/to-spec` as proposals instead of the worktree
- `skills/design-by-contract/`: consequential system contract design overlay
- `skills/offensive-programming/`: Patina Project Skills defensive-code decision overlay
- `plugins/engineering/skills/principle-offensive-programming/`: defensive-code classification principle
- `skills/grill-system-design/`: focused system design grilling skill
- `skills/review-system-design/`: contract dependency review skill
- `skills/fix/`: Patina Project Skills diagnosis-first correction and publication controller
- `plugins/engineering/skills/gather-evidence/`: current-target evidence for human feedback
- `skills/running-mobile-simulators/`: Patina Project Skills mobile simulator lifecycle skill
- `plugins/engineering/skills/running-mobile-simulators/`: shared-host Android emulator and iOS simulator lifecycle skill
- `plugins/engineering/skills/patina-mode/`: Patina Project's default engineering mode, forked from pstack
- `plugins/engineering/agents/patina-agent.md`: Patina mode routing agent
- `plugins/engineering/hooks/`: Engineering session-start integration
- `plugins/engineering/models.json`: Engineering model-role defaults
- `plugins/engineering/.claude-plugin/plugin.json`: Claude Engineering plugin manifest
- `plugins/engineering/.codex-plugin/plugin.json`: Codex Engineering plugin manifest
- `skills/orchestrate/`: user-visible Codex chat coordination skill
- `skills/write-changelog/`: tracker-backed milestone and Release changelog skill
- `skills/prompting-fable/`: Claude Fable 5 prompting and configuration guidelines skill
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
| `new-branch` | `skills/new-branch/` | Issue branch preparation |
| `working-on-issue` | `skills/working-on-issue/` | Patina Project Skills issue preparation workflow |
| `working-on-issues` | `plugins/engineering/skills/working-on-issues/` | Resolve the live tracker, align the issue branch and worktree, and mark work started |
| `develop` | `skills/develop/` | Issue development orchestration |
| `develop-with-workflow` | `skills/develop-with-workflow/` | Parallel vertical-slice build converged onto one branch |
| `ready-pr` | `skills/ready-pr/` | Publish and prove a PR ready to merge |
| `merge-pr` | `skills/merge-pr/` | Enable repository-managed auto-merge |
| `finish-pr` | `skills/finish-pr/` | Deprecated compatibility alias for `ready-pr` |
| `codex-pr-feedback-loop` | `skills/codex-pr-feedback-loop/` | Codex app PR review feedback automation |
| `polish` | `skills/polish/` | Incremental local architecture and code review |
| `update-branch` | `skills/update-branch/` | Local branch update workflow |
| `move-branch-here` (Patina Project Skills) | `skills/move-branch-here/` | Worktree branch handover workflow |
| `move-branch-here` (Engineering) | `plugins/engineering/skills/move-branch-here/` | Worktree branch handover workflow |
| `install-skills` | `skills/install-skills/` | Project-local skills CLI installation workflow |
| `grill-to-spec` | `skills/grill-to-spec/` | Grill a design and hand it to `/to-spec` with doc-change proposals |
| `design-by-contract` | `skills/design-by-contract/` | Consequential system contract design overlay |
| `offensive-programming` | `skills/offensive-programming/` | Patina Project Skills defensive-code decision overlay |
| `principle-offensive-programming` | `plugins/engineering/skills/principle-offensive-programming/` | Defensive-code classification principle |
| `grill-system-design` | `skills/grill-system-design/` | Focused system design grilling |
| `review-system-design` | `skills/review-system-design/` | Contract dependency review |
| `fix` | `skills/fix/` | Patina Project Skills diagnosis-first correction and publication controller |
| `gather-evidence` | `plugins/engineering/skills/gather-evidence/` | Current-target evidence for human feedback |
| `running-mobile-simulators` (Patina Project Skills) | `skills/running-mobile-simulators/` | Shared-host Android emulator and iOS simulator lifecycle |
| `running-mobile-simulators` (Engineering) | `plugins/engineering/skills/running-mobile-simulators/` | Shared-host Android emulator and iOS simulator lifecycle |
| `orchestrate` | `skills/orchestrate/` | User-visible Codex chat coordination |
| `write-changelog` | `skills/write-changelog/` | Render milestone or shipped Release notes from tracker issues |
| `prompting-fable` | `skills/prompting-fable/` | Guidelines for prompting and configuring Claude Fable 5 |

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
