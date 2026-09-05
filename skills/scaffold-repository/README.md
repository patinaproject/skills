# scaffold-repository

`scaffold-repository` sets up a new repository with the Patina Project standard
files or compares an existing repository with the current Patina setup.

It configures commit and pull request rules, pnpm, Husky, Markdown linting,
agent instructions, GitHub workflows, issue tracking, and repository settings.
It reads most live files from the root of
[`patinaproject/skills`](https://github.com/patinaproject/skills) instead of
shipping copied templates. The consumer pull request template stays with this
skill because the source repository uses a plugin-only body contract that
ordinary consumers do not receive.

## What it does

- In a new repository, it copies the required files, installs dependencies,
  stages the result, and leaves the first commit to the user.
- In an existing repository, it runs `audit-checklist.md`, shows each proposed
  diff, and waits for the user to accept, skip, or defer it.

See [SKILL.md](./SKILL.md) for the procedure and
[audit-checklist.md](./audit-checklist.md) for the complete file and settings
checks.

## Install

Install this skill with:

```bash
npx skills@latest add patinaproject/skills --skill scaffold-repository
```

Or install the `patinaproject-skills` plugin through the host marketplace:

- Claude Code: `/plugin marketplace add patinaproject/skills`, then
  `/plugin install patinaproject-skills@patinaproject-skills`
- Codex: `/marketplace add patinaproject/skills`, then
  `/install patinaproject-skills`

The repository root `README.md` contains the full installation guide.

## First use

Run `scaffold-repository` from a cloned repository. It reads owner and
repository name from `origin` when possible and asks for the description and
public or private visibility. Author name, author email, and the public security
contact default to `git config user.name` and `git config user.email`.

## Development

This repository is the reference implementation except for its repo-only pull
request body contract. The source repository's
`docs/adr/ADR-445-repository-pull-request-body-contract.md` records why
consumers keep the standalone template in `pr-body-template.md`.

```bash
pnpm install
pnpm lint:md
echo "feat: #1 verify commitlint" | pnpm exec commitlint
```

Public repository commits use `type: #N short description`. Private repository
commits use `type: PAT-N short description`. Choose the type by behavior, not
file extension. Skill instructions and workflow behavior normally use `feat:`
or `fix:`. Explanatory documentation uses `docs:`. Maintenance with no visible
behavior change uses `chore:`.

See the root `AGENTS.md`, `CONTRIBUTING.md`, and `docs/release-flow.md` before
contributing.
