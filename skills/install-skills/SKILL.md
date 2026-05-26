---
name: install-skills
description: Install one or more agent skills into the current repository with the skills CLI. Use when adding or refreshing locked project-local skills, when a user names a skill source, or when a repository needs shared skills installed without mutating global agent state.
---

# install-skills

Install skills project-locally so the repository, not the operator's global
environment, owns the shared workflow catalog.

This skill changes the locked skill set and may update `skills-lock.json`.
For routine setup or repair from an existing lockfile, use the repository's
public lifecycle command instead:

```bash
pnpm skills:install
```

Use this skill when the desired result is a changed skill catalog: adding,
removing, refreshing, or otherwise updating the entries recorded in
`skills-lock.json`.

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

Use a pinned source when reproducibility matters:

```bash
npm_config_ignore_scripts=true npx --yes skills@latest add owner/repo#<git-ref> --skill <skill-name> --agent '*' --yes
```

## Patina Sources

For Patina Project marketplace skills, use `patinaproject/skills` as the source
and install only the requested skills unless the user explicitly asks for all.

Active Patina scaffold defaults are:

- `scaffold-repository`
- `using-github`
- `new-branch`
- `develop-issue`
- `finish-pr`
- `review-code`
- `install-skills`

## Verify

After installing, prove what changed:

```bash
npm_config_ignore_scripts=true npx --yes skills@latest list --json
git status --short
```

If the repository exposes wrapper scripts, also run:

```bash
pnpm skills:list
```

Report the installed skills, the source used, and the changed lockfile or agent
overlay paths. Stop before committing unless the user asked you to finish the
branch.
