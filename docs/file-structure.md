# Repository File Structure

This repository is the marketplace surface for Patina Project plugins and
related install documentation.
Code plugin skills live under `plugins/code/skills/<name>/`.
Work plugin skills live under `plugins/work/skills/<name>/`.

## Top level

- `plugins/work/skills/scaffold-repository/`: scaffold-repository skill
- `plugins/work/skills/using-github/`: using-github skill
- `plugins/work/skills/update-branch/`: local branch update skill
- `plugins/code/skills/working-on-issues/`: shared issue preflight (resolve live tracker, align branch and worktree, mark started)
- `plugins/code/skills/move-branch-here/`: Code worktree branch handover skill
- `plugins/code/skills/move-session-here/`: cross-agent session transcript handover skill
- `plugins/work/skills/install-skills/`: project-local skills CLI installation skill
- `plugins/work/skills/design-by-contract/`: consequential system contract design overlay
- `plugins/code/skills/principle-offensive-programming/`: defensive-code classification principle
- `plugins/work/skills/grill-system-design/`: focused system design grilling skill
- `plugins/work/skills/review-system-design/`: contract dependency review skill
- `plugins/work/skills/writing-for-pstack/`: operator prompt authoring for `patina-mode`
- `plugins/work/skills/grill-to-spec/`: user-invoked grilling that hands ADR and glossary changes to `to-spec` as proposals
- `plugins/work/skills/email-inbox-triage/`: provider-agnostic email inbox triage into four tagged buckets
- `plugins/work/skills/cloud-storage-organization/`: storage-agnostic loop that files loose files by rules learned from the user's corrections
- `plugins/work/skills/draft-user-follow-ups/`: post-release support loop that drafts proven replies to owed customers
- `plugins/work/skills/linear-inbox-cleanup/`: marks Linear inbox notifications read when they need no action
- `plugins/code/skills/gather-evidence/`: current-target evidence for human feedback
- `plugins/code/skills/running-mobile-simulators/`: shared-host Android emulator and iOS simulator lifecycle skill
- `plugins/code/skills/pr/`: local PR body contract adapted from Matt Pocock
- `plugins/code/skills/pr-readiness/`: centralized PR evidence evaluator and publication command
- `plugins/work/skills/pr-review-assistant/`: user-invoked pair review of someone else's pull request
- `plugins/code/skills/patina-mode/`: Patina Project's default engineering mode, forked from pstack
- `plugins/work/skills/retro/`: Coding-session retrospective workflow
- `plugins/work/skills/to-spec/`: Issue spec drafting and publication workflow
- `plugins/work/skills/to-tickets/`: Tracer-bullet ticket breakdown workflow
- `plugins/work/skills/triage/`: Issue and pull-request triage workflow
- `plugins/work/skills/show-me/`: upstream show-me mirror from humanlayer (visual explanation)
- `plugins/work/skills/design-control-loop/`: upstream design-control-loop mirror from humanlayer (agentic control loop design)
- `plugins/work/skills/ask-matt/`: upstream mirror (mattpocock)
- `plugins/work/skills/codebase-design/`: upstream mirror (mattpocock)
- `plugins/work/skills/domain-modeling/`: upstream mirror (mattpocock)
- `plugins/work/skills/grill-me/`: upstream mirror (mattpocock)
- `plugins/work/skills/grilling/`: upstream mirror (mattpocock)
- `plugins/work/skills/handoff/`: upstream mirror (mattpocock)
- `plugins/work/skills/improve-codebase-architecture/`: upstream mirror (mattpocock)
- `plugins/work/skills/setup-work-skills/`: upstream mattpocock `setup-matt-pocock-skills` mirror, renamed and forked for Patina label setup
- `plugins/work/skills/tutor/`: upstream mirror (mattpocock)
- `plugins/work/skills/to-questionnaire/`: upstream mirror (mattpocock)
- `plugins/work/skills/wait-what/`: upstream mirror (mattpocock)
- `plugins/work/skills/diagnosing-bugs/`: upstream mirror (mattpocock)
- `plugins/work/skills/implement/`: upstream mirror (mattpocock)
- `plugins/work/skills/implement-spec/`: upstream mirror (mattpocock)
- `plugins/work/skills/prototype/`: upstream mirror (mattpocock)
- `plugins/work/skills/research/`: upstream mirror (mattpocock)
- `plugins/work/skills/wayfinder/`: upstream mirror (mattpocock)
- `plugins/work/skills/wizard/`: upstream mirror (mattpocock)
- `plugins/work/skills/writing-for-agents/`: upstream mirror (mattpocock)
- `plugins/work/.claude-plugin/plugin.json`: Claude manifest for the Work plugin
- `plugins/work/.codex-plugin/plugin.json`: Codex manifest for the Work plugin
- `plugins/code/agents/patina-agent.md`: Patina mode routing agent
- `plugins/code/hooks/`: Code session-start integration
- `plugins/code/.claude-plugin/plugin.json`: Claude manifest for the Code plugin
- `plugins/code/.codex-plugin/plugin.json`: Codex manifest for the Code plugin
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
| `scaffold-repository` | `plugins/work/skills/scaffold-repository/` | Scaffold or realign a repo to the Patina Project baseline |
| `using-github` | `plugins/work/skills/using-github/` | GitHub workflow skill |
| `update-branch` | `plugins/work/skills/update-branch/` | Local branch update workflow |
| `working-on-issues` | `plugins/code/skills/working-on-issues/` | Resolve the live tracker, align the issue branch and worktree, and mark work started |
| `move-branch-here` | `plugins/code/skills/move-branch-here/` | Model-directed worktree branch handover workflow |
| `move-session-here` | `plugins/code/skills/move-session-here/` | Claude Code and Codex session transcript handover workflow |
| `install-skills` | `plugins/work/skills/install-skills/` | Project-local skills CLI installation workflow |
| `design-by-contract` | `plugins/work/skills/design-by-contract/` | Consequential system contract design overlay |
| `principle-offensive-programming` | `plugins/code/skills/principle-offensive-programming/` | Defensive-code classification principle |
| `grill-system-design` | `plugins/work/skills/grill-system-design/` | Focused system design grilling |
| `review-system-design` | `plugins/work/skills/review-system-design/` | Contract dependency review |
| `writing-for-pstack` | `plugins/work/skills/writing-for-pstack/` | Operator prompt authoring for `patina-mode` |
| `email-inbox-triage` | `plugins/work/skills/email-inbox-triage/` | Provider-agnostic email inbox triage into four tagged buckets |
| `cloud-storage-organization` | `plugins/work/skills/cloud-storage-organization/` | Storage-agnostic loop that files loose files by learned rules |
| `draft-user-follow-ups` | `plugins/work/skills/draft-user-follow-ups/` | Post-release support loop that drafts proven replies to owed customers |
| `linear-inbox-cleanup` | `plugins/work/skills/linear-inbox-cleanup/` | Marks Linear inbox notifications read when they need no action |
| `gather-evidence` | `plugins/code/skills/gather-evidence/` | Current-target evidence for human feedback |
| `running-mobile-simulators` | `plugins/code/skills/running-mobile-simulators/` | Shared-host Android emulator and iOS simulator lifecycle |
| `retro` | `plugins/work/skills/retro/` | Coding-session retrospective workflow |
| `to-spec` | `plugins/work/skills/to-spec/` | Issue spec drafting and publication workflow |
| `to-tickets` | `plugins/work/skills/to-tickets/` | Tracer-bullet ticket breakdown workflow |
| `triage` | `plugins/work/skills/triage/` | Issue and pull-request triage workflow |
| `show-me` | `plugins/work/skills/show-me/` | Visual explanation of the current topic (upstream mirror from humanlayer) |
| `design-control-loop` | `plugins/work/skills/design-control-loop/` | Interview-driven agentic control loop design (upstream mirror from humanlayer) |
| `ask-matt` | `plugins/work/skills/ask-matt/` | Upstream mattpocock mirror in the Work plugin |
| `codebase-design` | `plugins/work/skills/codebase-design/` | Upstream mattpocock mirror in the Work plugin |
| `domain-modeling` | `plugins/work/skills/domain-modeling/` | Upstream mattpocock mirror in the Work plugin |
| `grill-me` | `plugins/work/skills/grill-me/` | Upstream mattpocock mirror in the Work plugin |
| `grilling` | `plugins/work/skills/grilling/` | Upstream mattpocock mirror in the Work plugin |
| `handoff` | `plugins/work/skills/handoff/` | Upstream mattpocock mirror in the Work plugin |
| `improve-codebase-architecture` | `plugins/work/skills/improve-codebase-architecture/` | Upstream mattpocock mirror in the Work plugin |
| `setup-work-skills` | `plugins/work/skills/setup-work-skills/` | Upstream mattpocock `setup-matt-pocock-skills` mirror, renamed so the Work plugin owns repository setup |
| `tutor` | `plugins/work/skills/tutor/` | Upstream mattpocock `teach` mirror, renamed so skill names stay unique across plugins |
| `to-questionnaire` | `plugins/work/skills/to-questionnaire/` | Upstream mattpocock mirror in the Work plugin |
| `wait-what` | `plugins/work/skills/wait-what/` | Upstream mattpocock mirror in the Work plugin |
| `diagnosing-bugs` | `plugins/work/skills/diagnosing-bugs/` | Upstream mattpocock mirror in the Work plugin |
| `implement` | `plugins/work/skills/implement/` | Upstream mattpocock mirror in the Work plugin |
| `implement-spec` | `plugins/work/skills/implement-spec/` | Upstream mattpocock mirror in the Work plugin |
| `prototype` | `plugins/work/skills/prototype/` | Upstream mattpocock mirror in the Work plugin |
| `research` | `plugins/work/skills/research/` | Upstream mattpocock mirror in the Work plugin |
| `wayfinder` | `plugins/work/skills/wayfinder/` | Upstream mattpocock mirror in the Work plugin |
| `wizard` | `plugins/work/skills/wizard/` | Upstream mattpocock mirror in the Work plugin |
| `writing-for-agents` | `plugins/work/skills/writing-for-agents/` | Upstream mattpocock mirror in the Work plugin |
| `pr` | `plugins/code/skills/pr/` | PR body structure and evidence guidance |
| `pr-readiness` | `plugins/code/skills/pr-readiness/` | Candidate-aware evidence evaluation and the sole ready transition |
| `grill-to-spec` | `plugins/work/skills/grill-to-spec/` | User-invoked grilling that keeps the tree unchanged and hands doc changes to `to-spec` |
| `pr-review-assistant` | `plugins/work/skills/pr-review-assistant/` | User-invoked pair review that presents a pull request as an artifact that teaches the change |

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
| `.agents/skills/<engineering-name>` | `../../plugins/code/skills/<name>` | `120000` |
| `.claude/skills/<engineering-name>` | `../../plugins/code/skills/<name>` | `120000` |
| `.agents/skills/<team-name>` | `../../plugins/work/skills/<name>` | `120000` |
| `.claude/skills/<team-name>` | `../../plugins/work/skills/<name>` | `120000` |

Exception: `teach` ships in both Code and Work. The flat overlays
(`.agents/skills/teach`, `.claude/skills/teach`) point at the Code copy;
the Work copy is reached as `work:teach`.

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
