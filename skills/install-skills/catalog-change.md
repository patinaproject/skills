# Update the installed skill list

Follow these instructions whenever `skills-lock.json` adds, removes, renames,
or refreshes a skill. The committed `.agents/skills/` directories and
`.claude/skills/` links must match the lockfile.

GitHub lock entries follow the source's default branch. A skill renamed or
removed upstream may disappear during refresh while its old lock entry remains.
The steps below check every locked path so that failure is visible.

## Steps

1. List the skills currently offered by every source in `skills-lock.json`:

   ```bash
   npm_config_ignore_scripts=true npx --yes skills@latest add <source> --list
   ```

2. Add each requested skill with the install command from `SKILL.md`.
3. Remove lock entries for skills that no longer exist. When a skill was
   renamed, add its replacement in the same change. Search authored skills,
   `AGENTS.md`, and repository documentation for the old name and update every
   active reference.
4. Restore every locked skill from its source:

   ```bash
   pnpm skills:install
   ```

5. Check every locked path with the command below. Resolve every `MISSING`
   result before opening a pull request.

## Check locked paths

For GitHub sources, verify that each `skillPath` exists on the source's default
branch:

```bash
jq -r '.skills | to_entries[]
  | select(.value.sourceType == "github")
  | "\(.key)\t\(.value.source)\t\(.value.skillPath)"' skills-lock.json |
while IFS=$'\t' read -r name source skill_path; do
  if gh api "repos/${source}/contents/${skill_path}" --jq .path >/dev/null 2>&1; then
    echo "ok      ${name}"
  else
    echo "MISSING ${name}: ${source}/${skill_path}"
  fi
done
```

Check any other `sourceType` with that source's own listing command. Every
entry must print `ok`. For each missing path, use the source listing from step 1
to find a replacement or remove the lock entry, then run the check again.

## Pull request summary

In the pull request's `What changed` section, summarize the lockfile change with
counts taken from `git diff -- skills-lock.json`:

```md
The installed skill list changed from N to M skills.

- Added: `<skill>` from `<source>`
- Removed: `<skill>`; use `<replacement>` instead
- Refreshed: `<skill>` from its source's default branch
- Unchanged: `<skill>`

Every locked skill path exists on its source's default branch.
```

Omit empty lines from the list. For every removed skill, name its replacement
or say that upstream retired it.

## Verification

Before the change is ready:

- `npm_config_ignore_scripts=true npx --yes skills@latest list --json` shows the
  expected skills.
- The repository's install-state test passes.
- Every `.agents/skills/<name>/` directory and matching
  `.claude/skills/<name>` relative link exists and resolves.
- No active authored file names a removed skill.
- The locked-path check prints `ok` for every entry.
