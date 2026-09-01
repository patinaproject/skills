---
name: install-skills
description: Install or refresh project-local agent skills recorded in skills-lock.json. Use when the user names a skill source to add to the repository or asks to update its locked skills.
---

# Install project skills

Project-local skills belong to the repository. The lockfile records their
sources, and the committed `.agents/skills/` and `.claude/skills/` entries make
them available in a fresh checkout.

If `skills-lock.json` has not changed and the user only wants to restore the
committed skill directories, run:

```bash
pnpm skills:install
```

When adding, removing, renaming, or refreshing a lockfile entry, read
[the skill list change instructions](./catalog-change.md). They define the
order of work, the check for skills renamed or removed upstream, the pull
request summary, and required verification.

## Before installing

1. Read `AGENTS.md`, `CLAUDE.md`, and any repository instructions for agent
   skills or shared tools.
2. Inspect the current installed list. Prefer a repository script such as
   `pnpm skills:list`. Otherwise run:

   ```bash
   test -f skills-lock.json && npm_config_ignore_scripts=true npx --yes skills@latest list --json
   ```

3. Resolve the requested source and skill names. If either is unclear, list the
   source before installing:

   ```bash
   npm_config_ignore_scripts=true npx --yes skills@latest add <source> --list
   ```

## Install

Run installs from the repository root. Never use `--global`.

Install one or more named skills from one source:

```bash
npm_config_ignore_scripts=true npx --yes skills@latest add <source> --skill <skill-a> <skill-b> --agent '*' --yes
```

Install every skill from a source only when the user asks for all of them:

```bash
npm_config_ignore_scripts=true npx --yes skills@latest add <source> --skill '*' --agent '*' --yes
```

GitHub lock entries contain `source` and `skillPath`. The restore command clones
the source's default branch, so another run may install newer upstream content.
The source must be publicly readable. Use a source with a git ref when the user
requires a fixed version.

After changing the lockfile, restore every locked skill:

```bash
pnpm skills:install
```

This command reads `skills-lock.json`, writes real skill directories under
`.agents/skills/`, and maintains matching relative links under
`.claude/skills/`.

For Patina Project skills, use `patinaproject/skills` and install only the
requested names. Common repository defaults are:

- `scaffold-repository`
- `using-github`
- `new-branch`
- `working-on-issues`
- `write-changelog`
- `develop`
- `ready-pr`
- `merge-pr`
- `polish`
- `install-skills`

## Verify

Run:

```bash
npm_config_ignore_scripts=true npx --yes skills@latest list --json
git status --short
```

Follow every additional check in `catalog-change.md`. Report the installed
skills, their source, and the changed lockfile or skill directories. Stop before
committing unless the user asked to finish the branch.
