# Skills used by the Patina Project team

Six installable agent skills for repository scaffolding, multi-teammate
orchestration, CI-safe orchestration, GitHub workflows, product design, and strategic plan review — available
across Claude Code, Codex, and any agent runtime that reads `AGENTS.md`.

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

Even with a capable agent, implementation loops need structure: a design doc
to approve before planning starts, a plan to approve before code is written,
an explicit reviewer pass before publishing, and a finisher who owns the PR
through CI and human feedback. Without that structure, chat context is the only
handoff artifact and restarts are expensive. `superteam` routes a GitHub issue
through a six-teammate workflow — Team Lead, Brainstormer, Planner, Executor,
Reviewer, Finisher — producing durable repo-owned artifacts at every gate.

See [./skills/superteam/](./skills/superteam/) for the full README and skill
contract, including the required
[Superpowers prerequisite](./skills/superteam/README.md#install).

### superteam-non-interactive

GitHub Actions cannot answer follow-up questions. `superteam-non-interactive`
is the headless companion to `superteam`: it uses the same teammate workflow,
artifacts, gates, and Finisher shutdown, but removes human-in-the-loop pauses.
Clean designs auto-advance, publishing is allowed by default when the CI token
permits it, and unresolved technical or review blockers are reported in a
machine-actionable format for the next run. Use it for one-shot issue runs where
the workflow must proceed from invocation inputs, environment variables, and
durable repository state instead of chat replies.

It ships with the same `patinaproject-skills` plugin as `superteam`.

See [./skills/superteam-non-interactive/](./skills/superteam-non-interactive/)
for the skill contract.

### using-github

GitHub work — filing issues, editing issues, starting branches, writing
changelogs, preparing PRs — is repetitive and convention-sensitive. Without a
shared skill, every agent session re-derives the same rules from scratch and
produces inconsistent output. `using-github` is a single skill that reads
repository rules and applies the correct workflow for each task, so every
GitHub action in a repo is consistent and auditable.

See [./skills/using-github/](./skills/using-github/)
for the full README and skill contract.

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
| [superteam](./skills/superteam/) | Orchestrate a GitHub issue from design through merged PR |
| [superteam-non-interactive](./skills/superteam-non-interactive/) | Run Superteam in GitHub Actions without prompts |
| [using-github](./skills/using-github/) | Patina Project GitHub workflow conventions |
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

### Check c — dogfood verification, all six skills

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
