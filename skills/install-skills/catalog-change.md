# Catalog change convention

A **catalog change** is any edit to a repository's vendored skill catalog — the
entries recorded in `skills-lock.json` and the committed `.agents/skills/` /
`.claude/skills/` overlays. Adding, removing, renaming, or refreshing a skill is
a catalog change. Execute and describe every one the same way so a reviewer can
see at a glance what entered, left, and changed, and so a skill that vanished
upstream cannot drift stale unnoticed.

Locked GitHub sources are ref-less: a refresh re-clones each source's default
branch rather than a pinned commit. That keeps the catalog current, but it also
means a skill renamed or deleted upstream leaves its `skillPath` pointing at
nothing and is **silently skipped** on refresh. The reconciliation method below
ends every refresh with a **staleness audit** so that silent skip becomes a
surfaced finding.

## Reconciliation method

Run these steps in order. The refresh and the staleness audit are a pair —
never refresh without auditing after.

1. **Discover upstream.** For each source in `skills-lock.json`, list the skills
   its default branch currently offers, so additions and disappearances are
   visible before you touch the lock:

   ```bash
   npm_config_ignore_scripts=true npx --yes skills@latest add <source> --list
   ```

2. **Add new skills.** Install any newly requested skill from its source with
   the `skills add` command this skill documents
   (`npx --yes skills@latest add <source> --skill <name> …`), which updates
   `skills-lock.json`.

3. **Remove or migrate renamed or deleted skills.** When an upstream skill was
   renamed or removed, drop its stale lock entry. If it was renamed, add the
   successor in the same change, and update every authored reference (skill
   bodies, `AGENTS.md`, docs) that named the old skill to name the successor.
   Leave no authored file pointing at a skill that no longer exists.

4. **Refresh all.** Re-vendor every locked skill from its source default branch,
   then commit the refreshed overlays:

   ```bash
   pnpm skills:install
   ```

5. **Run the staleness audit** (below). Resolve every finding before opening the
   PR.

## Staleness audit

Confirm every locked `skillPath` still exists on its source's default branch. A
GitHub source (`sourceType: "github"`) resolves through the Contents API; a
`404` means the skill was renamed or deleted upstream and would be silently
skipped on the next refresh:

```bash
jq -r '.skills | to_entries[]
  | select(.value.sourceType == "github")
  | "\(.key)\t\(.value.source)\t\(.value.skillPath)"' skills-lock.json |
while IFS=$'\t' read -r name source skill_path; do
  if gh api "repos/${source}/contents/${skill_path}" --jq .path >/dev/null 2>&1; then
    echo "ok    ${name}"
  else
    echo "STALE ${name} — ${source}/${skill_path} not found on default branch"
  fi
done
```

The `select` keeps the Contents-API check to GitHub sources; audit any other
`sourceType` against its own source of truth. Every entry must report `ok`. For
each `STALE` entry, migrate to the successor (discover its new name and path with
step 1's `--list`) or remove the entry, then re-run the audit until it is clean.

## Catalog-delta PR description

Describe the change in the PR body's `What changed` section as a **catalog
delta** — a four-part breakdown with numbers derived from the `skills-lock.json`
diff (`git diff -- skills-lock.json`), plus net counts and a staleness-audit
confirmation:

```md
## What changed

Catalog delta (skills-lock.json: N → M skills):

- **Added:** `<skill>` (`<source>`), …
- **Removed:** `<skill>` — use `<successor>` instead / retired upstream, …
- **Refreshed:** `<skill>`, … (re-vendored from source default branch)
- **Unchanged:** `<skill>`, …

Staleness audit: all M locked skillPaths resolve on their source default
branches.
```

Itemize the delta as above; the surrounding `What changed` narrative stays plain
prose per the repository's PR guidance — this list is a catalog diff a reader
scans, not a reintroduced `- <change> - <why>` contract. Omit an empty section
rather than writing "none". Every `Removed` entry states its replacement
(`use <successor> instead`) or that it was retired upstream, so a reader knows
where the capability went.

## Verification

Before marking the catalog change ready:

- `npm_config_ignore_scripts=true npx --yes skills@latest list --json` lists the
  expected skills — the catalog is green.
- The repository's install-state check passes (for example `pnpm test`, which
  includes the committed-skill lifecycle check).
- Overlay and symlink integrity holds: `.agents/skills/<name>/` payloads and the
  matching `.claude/skills/<name>` relative symlinks are present and resolve for
  every locked skill.
- No authored file references a removed skill. After a removal or rename, search
  the tree (for example `rg '<old-skill-name>'`) and confirm only intended
  history-style mentions remain.
- The staleness audit above reports `ok` for every entry.
