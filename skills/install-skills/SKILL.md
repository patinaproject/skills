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

GitHub lock entries must be committed with an immutable 40-character `ref`.
The current restore lifecycle reads `skills-lock.json` directly, downloads that
exact GitHub ref, verifies `computedHash`, writes verified payloads into
`.agents/skills/`, and creates relative `.claude/skills/` symlinks to them
without project-local transient installer files. Branch names, tags, or missing
refs are not reproducible enough for `pnpm skills:install`.

Because the restore path intentionally creates no lock or staging files,
concurrent `pnpm skills:install` invocations are unsupported. If an install is
interrupted, rerun `pnpm skills:install` to restore the locked overlay.

When the desired source is already known, pin the add command to the producing
commit ref:

```bash
npm_config_ignore_scripts=true npx --yes skills@latest add owner/repo#0123456789abcdef0123456789abcdef01234567 --skill <skill-name> --agent '*' --yes
```

If the skills CLI writes a lock entry without a full commit SHA, record the
exact commit from the local checkout or CLI output that produced the installed
payload before committing:

```bash
git -C <local-skills-source-clone> rev-parse HEAD
```

Do not re-resolve a branch or tag later through the GitHub API; its target may
have moved after the payload was installed. Record the producing commit SHA as
the entry's `ref`, then run `pnpm skills:install` to prove the lockfile can
restore the exact recorded skills without changing `skills-lock.json`.

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
