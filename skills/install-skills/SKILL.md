---
name: install-skills
description: Install agent skills project-locally with the skills CLI. Use when adding or refreshing locked skills in `skills-lock.json`, or when a user names a skill source to install into the current repository.
---

# install-skills

Install skills project-locally so the repository, not the operator's global
environment, owns the shared workflow catalog. Use this skill to change that
catalog — add, remove, or refresh the entries recorded in `skills-lock.json`.

Vendored skills are committed, so they load without an install step. When the
goal is only to re-vendor the committed overlays from an unchanged lockfile, run
the repository's manual maintenance command instead:

```bash
pnpm skills:install
```

## Preflight

1. Read repository guidance first: `AGENTS.md`, `CLAUDE.md` if present, and
   any docs governing agent skills or shared tooling.
2. Inspect the current catalog if present:

   ```bash
   test -f skills-lock.json && npm_config_ignore_scripts=true npx --yes skills@latest list --json
   ```

   If the repository exposes a wrapper such as `pnpm skills:list`, use that
   instead of the raw CLI list command.

3. Resolve the requested source and skill names. If the source contents or
   requested skill names are ambiguous, list before installing:

   ```bash
   npm_config_ignore_scripts=true npx --yes skills@latest add <source> --list
   ```

## Install

Run installs from the repository root. Do not use `--global`.

Canonical single-source install:

```bash
npm_config_ignore_scripts=true npx --yes skills@latest add <source> --skill <skill-name> --agent '*' --yes
```

For multiple skills from the same source, repeat `--skill` values as separate
arguments after one flag:

```bash
npm_config_ignore_scripts=true npx --yes skills@latest add <source> --skill <skill-a> <skill-b> --agent '*' --yes
```

For all skills from a source, prefer an explicit all-agent install:

```bash
npm_config_ignore_scripts=true npx --yes skills@latest add <source> --skill '*' --agent '*' --yes
```

GitHub lock entries record a `source` and `skillPath`. The upstream skills CLI
(`skills experimental_install`) restores them by cloning each source's default
branch, so the lock does not pin an immutable `ref`; re-running picks up the
latest upstream commit on that branch. Locked GitHub sources must be publicly
readable because restore clones from the public GitHub source.

To re-vendor the committed overlays from the lockfile, run:

```bash
pnpm skills:install
```

This runs `pnpm dlx skills@latest experimental_install --yes`, which reads
`skills-lock.json`, restores each locked skill into `.agents/skills/`, and
maintains the relative `.claude/skills/` symlinks. Commit the refreshed
overlays afterward.

## Patina Sources

For Patina Project marketplace skills, use `patinaproject/skills` as the source
and install only the requested skills unless the user explicitly asks for all.

Active Patina scaffold defaults are:

- `scaffold-repository`
- `using-github`
- `new-branch`
- `working-on-github-issue`
- `develop`
- `finish-pr`
- `harden-branch`
- `install-skills`

## Verify

After installing, prove what changed:

```bash
npm_config_ignore_scripts=true npx --yes skills@latest list --json
git status --short
```

Report the installed skills, the source used, and the changed lockfile or agent
overlay paths. Stop before committing unless the user asked you to finish the
branch.
