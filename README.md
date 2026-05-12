# Skills used by the Patina Project team

Five installable agent skills for repository scaffolding, multi-teammate
orchestration, GitHub workflows, product design, and skill discovery — available
across Claude Code, Codex, and any agent runtime that reads `AGENTS.md`.

## Quickstart

### Install via the skills CLI (primary)

```bash
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills --agent <agent> -y
```

Replace `<agent>` with `claude-code` or `codex`. The `npm_config_ignore_scripts=true`
prefix is required — do not omit it.

### Install via the host marketplace (secondary)

For Claude Code:

```text
/plugin marketplace add patinaproject/skills
/plugin install patinaproject-skills@patinaproject-skills
```

For Codex:

```text
codex plugin marketplace add patinaproject/skills --ref <MARKETPLACE_TAG>
```

## Why these skills exist

### scaffold-repository

Teams spend disproportionate time on repo plumbing — commit conventions,
markdown linting, PR templates, Husky hooks, release-please wiring, AI agent
plugin manifests — and every new repo starts that conversation from scratch.
`scaffold-repository` collapses that into one invocation that emits the full
Patina Project baseline and keeps it aligned on rerun. It handles both new
repos and realignment of existing ones, so convention drift gets caught before
it accumulates.

See [./skills/engineering/scaffold-repository/](./skills/engineering/scaffold-repository/)
for the full README and skill contract.

### superteam

Even with a capable agent, implementation loops need structure: a design doc
to approve before planning starts, a plan to approve before code is written,
an explicit reviewer pass before publishing, and a finisher who owns the PR
through CI and human feedback. Without that structure, chat context is the only
handoff artifact and restarts are expensive. `superteam` routes a GitHub issue
through a six-teammate workflow — Team Lead, Brainstormer, Planner, Executor,
Reviewer, Finisher — producing durable repo-owned artifacts at every gate.

See [./skills/engineering/superteam/](./skills/engineering/superteam/) for the
full README and skill contract.

### using-github

GitHub work — filing issues, editing issues, starting branches, writing
changelogs, preparing PRs — is repetitive and convention-sensitive. Without a
shared skill, every agent session re-derives the same rules from scratch and
produces inconsistent output. `using-github` is a single skill that reads
repository rules and applies the correct workflow for each task, so every
GitHub action in a repo is consistent and auditable.

See [./skills/engineering/using-github/](./skills/engineering/using-github/)
for the full README and skill contract.

### office-hours

New product ideas benefit from honest forcing questions before any code is
written — demand reality checks, narrowest-wedge tests, observation-grounded
specificity. Without a structured partner, agents tend to validate rather than
pressure-test. `office-hours` runs a YC-style session in one of two modes:
Startup mode asks six forcing questions that expose whether the idea is
genuinely worth building; Builder mode is an enthusiastic design partner for
hackathons and side projects. Output is always a design doc, never code.

See [./skills/productivity/office-hours/](./skills/productivity/office-hours/)
for the skill contract.

### find-skills

As the skills ecosystem grows, discovering the right skill for a task gets
harder. `find-skills` helps users and agents navigate the catalog — searching
for skills by capability, explaining what each does, and walking through the
install steps — so the answer to "how do I do X?" is a concrete skill
reference rather than a general response.

See [./skills/productivity/find-skills/](./skills/productivity/find-skills/)
for the skill contract.

## Skills

| Skill | Description |
|---|---|
| [scaffold-repository](./skills/engineering/scaffold-repository/) | Scaffold a new repository to the Patina Project baseline |
| [superteam](./skills/engineering/superteam/) | Orchestrate a GitHub issue from design through merged PR |
| [using-github](./skills/engineering/using-github/) | Patina Project GitHub workflow conventions |
| [office-hours](./skills/productivity/office-hours/) | YC-style design partner; runs forcing questions |
| [find-skills](./skills/productivity/find-skills/) | Discover and install agent skills |

## Local iteration

Three checks prove the in-repo skills are wired correctly. Run these after any
change to `skills/`, `scripts/`, `.agents/skills/`, or `.claude/skills/`.

### Check a — CLI resolves skills from local paths

```sh
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add ./skills/engineering/scaffold-repository --list

npm_config_ignore_scripts=true npx skills@1.5.6 \
  add ./skills/productivity/office-hours --list
```

### Check b — scaffold-repository apply, no network

```sh
node scripts/apply-scaffold-repository.js skills/engineering/scaffold-repository --check
```

### Check c — dogfood verification, all five skills

```sh
bash scripts/verify-dogfood.sh
```

## Repository layout

```text
skills/
  engineering/
    scaffold-repository/
    superteam/
    using-github/
  productivity/
    office-hours/
    find-skills/
.agents/skills/<name>/               Symlinks to ../../skills/<category>/<name>/
.claude/skills/<name>/               Symlinks to ../../skills/<category>/<name>/
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
