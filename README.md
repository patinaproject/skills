# Skills used by the Patina Project team

Eight installable agent skills for repository scaffolding, GitHub workflows,
issue branch setup, PR finishing, product design, strategic plan review, and
historical Superteam compatibility — available across Claude Code, Codex, and
any agent runtime that reads `AGENTS.md`.

## Quickstart

```bash
npx skills@latest add patinaproject/skills
```

The CLI prompts you to pick which skills to install and auto-detects your agent.

### Install via the host marketplace (alternative)

Claude Code:

```text
/plugin marketplace add patinaproject/skills
/plugin install patinaproject-skills@patinaproject-skills
```

Codex:

```text
/marketplace add patinaproject/skills
/install patinaproject-skills
```

> **Security note:** For environments where you want to prevent install scripts
> from running during CLI execution, prefix the `npx` command above with
> `npm_config_ignore_scripts=true`. Not required for standard use.

### Related skills

For skill discovery and catalog navigation, install `find-skills` from the
[vercel-labs/skills](https://github.com/vercel-labs/skills) catalog:

```bash
npx skills@latest add vercel-labs/skills@find-skills
```

## Why these skills exist

### superteam

Deprecated. `superteam` remains installable for historical compatibility, but
new work should use GitHub issues for durable context, the current PR template
for reviewer-facing summaries, and focused implementation or review skills.

See [./skills/superteam/](./skills/superteam/) for the deprecated skill
contract.

### superteam-non-interactive

Deprecated. `superteam-non-interactive` remains installable for CI users who
still depend on the retired Superteam contract, but it is not recommended for
new automation.

See [./skills/superteam-non-interactive/](./skills/superteam-non-interactive/)
for the deprecated skill contract.

### using-github

GitHub work — filing issues, editing issues, starting branches, writing
changelogs, preparing PRs — is repetitive and convention-sensitive. Without a
shared skill, every agent session re-derives the same rules from scratch and
produces inconsistent output. `using-github` is a single skill that reads
repository rules and routes to the correct workflow for each task, so every
GitHub action in a repo is consistent and auditable. For issue-linked work it
routes branch setup to `new-branch`, and for objectively complete work it
routes publishing and checks to `finish-pr`.

See [./skills/using-github/](./skills/using-github/)
for the full README and skill contract.

### new-branch

Issue-linked implementation should start from the repository default branch on
a predictable local branch. `new-branch` resolves an issue, derives GitHub's
default issue-branch name, refuses dirty worktrees, and creates or switches to
the local branch without pushing, installing dependencies, committing, or
creating a PR.

See [./skills/new-branch/](./skills/new-branch/)
for the skill contract.

### finish-pr

Finishing branch work is more than opening a pull request. `finish-pr` verifies
the local diff, commits with the repository convention, pushes when needed,
creates or updates a ready-for-review PR from the template, watches checks
fail-fast, handles existing review feedback, and stops at ready-to-merge.

See [./skills/finish-pr/](./skills/finish-pr/)
for the skill contract.

### office-hours

New product ideas benefit from honest forcing questions before any code is
written — demand reality checks, narrowest-wedge tests, observation-grounded
specificity. Without a structured partner, agents tend to validate rather than
pressure-test. `office-hours` runs a YC-style session in one of two modes:
Startup mode asks six forcing questions that expose whether the idea is
genuinely worth building; Builder mode is an enthusiastic design partner for
hackathons and side projects. Output is always a design doc, never code.

See [./skills/office-hours/](./skills/office-hours/)
for the skill contract.

### plan-ceo-review

Plans need a different kind of pressure test once the idea has turned into a
proposed course of action. `plan-ceo-review` gives an existing plan a
CEO/founder-mode review: should it expand, selectively expand, hold, or reduce?
It challenges ambition, user value, sequencing, and opportunity cost, then
returns a concrete recommendation and smallest next move.

See [./skills/plan-ceo-review/](./skills/plan-ceo-review/)
for the skill contract.

### scaffold-repository

Teams spend disproportionate time on repo plumbing — commit conventions,
markdown linting, PR templates, Husky hooks, release-please wiring, AI agent
plugin manifests — and every new repo starts that conversation from scratch.
`scaffold-repository` collapses that into one invocation that emits the full
Patina Project baseline and keeps it aligned on rerun. It handles both new
repos and realignment of existing ones, so convention drift gets caught before
it accumulates.

See [./skills/scaffold-repository/](./skills/scaffold-repository/)
for the full README and skill contract.

## Skills

| Skill | Description |
|---|---|
| [superteam](./skills/superteam/) | Deprecated historical Superteam orchestration |
| [superteam-non-interactive](./skills/superteam-non-interactive/) | Deprecated CI-safe Superteam orchestration |
| [using-github](./skills/using-github/) | Patina Project GitHub workflow conventions |
| [new-branch](./skills/new-branch/) | Prepare local issue branches from the default branch |
| [finish-pr](./skills/finish-pr/) | Finish completed branch work through ready-to-merge PRs |
| [office-hours](./skills/office-hours/) | YC-style design partner; runs forcing questions |
| [plan-ceo-review](./skills/plan-ceo-review/) | Founder-mode review for existing plans |
| [scaffold-repository](./skills/scaffold-repository/) | Scaffold a new repository to the Patina Project baseline |

## Local iteration

Three checks prove the in-repo skills are wired correctly. Run these after any
change to `skills/`, `scripts/`, `.agents/skills/`, or `.claude/skills/`.

### Check a — CLI resolves skills from local paths

```sh
npx skills@latest add ./skills/scaffold-repository --list
npx skills@latest add ./skills/office-hours --list
```

### Check b — scaffold-repository apply, no network

```sh
node scripts/apply-scaffold-repository.js skills/scaffold-repository --check
```

### Check c — dogfood verification, all eight skills

```sh
bash scripts/verify-dogfood.sh
```

## Repository layout

```text
skills/
  scaffold-repository/
  superteam/
  superteam-non-interactive/
  using-github/
  new-branch/
  finish-pr/
  office-hours/
  plan-ceo-review/
.agents/skills/<name>/               Symlinks to ../../skills/<name>/
.claude/skills/<name>/               Symlinks to ../../skills/<name>/
.claude-plugin/
  marketplace.json                   Claude marketplace catalog
  plugin.json                        Claude plugin manifest
scripts/                             Maintenance and verification scripts
release-please-config.json           Release-please configuration
.release-please-manifest.json        Version manifest
```

See [docs/file-structure.md](docs/file-structure.md) for the full layout
reference.

## License

See [LICENSE](./LICENSE).

## Contributing

See [AGENTS.md](./AGENTS.md) for contributor guidelines and commit conventions.
