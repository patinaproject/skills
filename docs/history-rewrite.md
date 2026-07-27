# Public issue cutover and history rewrite

This runbook is the one-time operational procedure for moving
`patinaproject/skills` from private Linear references to public GitHub
references. Do not improvise or reorder it.

`patinaproject/codex-github-router` was inspected on 2026-07-27. Its commits,
current tree, and merged pull request metadata contain no `PAT-N` references,
so it needs label and sync parity but no history rewrite.

## Approved history scope

The in-place rewrite covers repository-owned `refs/heads/*` and `refs/tags/*`,
plus merged pull request titles and bodies. GitHub owns `refs/pull/*` and
rejects attempts to update them. Those immutable refs retain 738 pull-only
commits, including 23 whose messages contain `PAT-N`; the complete exception
set is frozen in
[`history-rewrite-inventory.json`](history-rewrite-inventory.json).

This limitation was approved on 2026-07-27. Never use `git push --mirror` for
this migration: it attempts to update read-only pull refs and can delete remote
heads that are absent locally.

## Preconditions

All must be true before the rewrite window begins:

- One-way GitHub-to-Linear issue intake is enabled for both public
  repositories. Synced updates remain bidirectional, so operators know not to
  edit the Linear mirrors.
- The five canonical triage labels exist in both repositories with non-empty
  descriptions.
- Open Linear work scoped to `patinaproject/skills` has been re-filed on GitHub
  with back-links; each Linear original is closed with its GitHub pointer.
- Every open pull request is merged or closed.
- [`history-rewrite-inventory.json`](history-rewrite-inventory.json) and
  [`history-rewrite-map.json`](history-rewrite-map.json) have been reviewed by
  a maintainer. Pull request mappings are deliberate public records for changes
  that had no standalone GitHub issue; the text mapping is deliberately not a
  link.
- The fork holder and active contributors have received the window notice.
- The operator can temporarily relax and restore the default-branch ruleset.

Confirm the frozen inventory has a complete map:

```sh
node scripts/history-rewrite.mjs check \
  --map docs/history-rewrite-map.json \
  --inventory docs/history-rewrite-inventory.json
```

Any missing or extra reference stops the operation. Update and re-review both
JSON files before proceeding.

## Backup and restore proof

Create the durable backup outside every working copy:

```sh
git clone --mirror git@github.com:patinaproject/skills.git \
  /durable/path/patinaproject-skills-before-public-issues.git
git -C /durable/path/patinaproject-skills-before-public-issues.git fsck --full
```

Restore that backup into a separate scratch mirror and prove every ref is
readable:

```sh
git clone --mirror \
  /durable/path/patinaproject-skills-before-public-issues.git \
  /scratch/path/patinaproject-skills-rewrite.git
git -C /scratch/path/patinaproject-skills-rewrite.git fsck --full
git -C /scratch/path/patinaproject-skills-rewrite.git show-ref
```

Re-extract from writable refs and current merged pull request metadata, and
verify that the immutable pull-ref exception set has not changed:

```sh
node scripts/history-rewrite.mjs check \
  --map docs/history-rewrite-map.json \
  --inventory docs/history-rewrite-inventory.json \
  --live \
  --git-repository \
  /durable/path/patinaproject-skills-before-public-issues.git
```

Any missing or extra reference stops the operation. Update and re-review both
JSON files before proceeding.

Record the pre-rewrite default-branch tree, writable commit count, branch
count, tag count, immutable pull-ref counts, and remote ruleset export in the
operator log. The durable backup is never the rewrite target.

## Rewrite writable refs and tags

Generate the exact literal replacements from the reviewed map:

```sh
node scripts/history-rewrite.mjs replacements \
  --map docs/history-rewrite-map.json \
  > /scratch/path/patinaproject-skills-replacements.txt
```

Delete the read-only pull refs from the scratch rewrite target. They remain
preserved in the durable backup and on GitHub:

```sh
git -C /scratch/path/patinaproject-skills-rewrite.git \
  for-each-ref --format='delete %(refname)' refs/pull |
  git -C /scratch/path/patinaproject-skills-rewrite.git update-ref --stdin
```

Run `git-filter-repo` against the writable-only scratch mirror. Its message
filter applies to commit and annotated-tag messages, and it retargets every tag
to the rewritten commit graph:

```sh
git -C /scratch/path/patinaproject-skills-rewrite.git filter-repo \
  --force \
  --replace-message /scratch/path/patinaproject-skills-replacements.txt
```

Verify the result before any push:

```sh
node /path/to/skills/scripts/history-rewrite.mjs verify \
  --map /path/to/skills/docs/history-rewrite-map.json \
  --backup /durable/path/patinaproject-skills-before-public-issues.git \
  --rewritten /scratch/path/patinaproject-skills-rewrite.git \
  --default-branch main
```

The verifier requires identical writable commit, branch, and tag counts; an
identical final tree; no surviving `PAT-N` reference in writable commit
messages; convention-compliant rewritten subjects; no pull refs in the scratch
target; and every tag reachable from `main`.

## Publish the rewritten graph

1. Re-check that the repository has zero open pull requests.
2. Export the current rulesets.
3. Temporarily relax only the rule that prevents the approved force-push.
4. Restore the GitHub remote removed by `git-filter-repo`, build an explicit
   lease and refspec for every pre-rewrite branch and tag, and push only those
   repository-owned refs:

   ```bash
   git -C /scratch/path/patinaproject-skills-rewrite.git remote add origin \
     git@github.com:patinaproject/skills.git

   lease_args=()
   refspec_args=()
   while read -r object ref; do
     lease_args+=("--force-with-lease=$ref:$object")
     refspec_args+=("$ref:$ref")
   done < <(
     git -C /durable/path/patinaproject-skills-before-public-issues.git \
       for-each-ref --format='%(objectname) %(refname)' refs/heads refs/tags
   )

   git -C /scratch/path/patinaproject-skills-rewrite.git push \
     --atomic \
     origin \
     "${lease_args[@]}" \
     "${refspec_args[@]}"
   ```

5. Restore the exported rulesets immediately and verify the default branch is
   protected.
6. Clone a fresh post-push mirror, verify the live immutable exception
   inventory, then remove its local pull refs and re-run the writable verifier:

   ```sh
   git clone --mirror git@github.com:patinaproject/skills.git \
     /scratch/path/patinaproject-skills-after-public-issues.git

   node /path/to/skills/scripts/history-rewrite.mjs check \
     --map /path/to/skills/docs/history-rewrite-map.json \
     --inventory /path/to/skills/docs/history-rewrite-inventory.json \
     --live \
     --git-repository \
     /scratch/path/patinaproject-skills-after-public-issues.git

   git -C /scratch/path/patinaproject-skills-after-public-issues.git \
     for-each-ref --format='delete %(refname)' refs/pull |
     git -C /scratch/path/patinaproject-skills-after-public-issues.git \
       update-ref --stdin

   node /path/to/skills/scripts/history-rewrite.mjs verify \
     --map /path/to/skills/docs/history-rewrite-map.json \
     --backup /durable/path/patinaproject-skills-before-public-issues.git \
     --rewritten \
     /scratch/path/patinaproject-skills-after-public-issues.git \
     --default-branch main
   ```

If the lease fails, stop. Fetch and rebuild the inventory, mapping review,
backup, and scratch rewrite from the new remote state.

## Repair metadata and automation

Preview the separate merged-pull-request metadata pass:

```sh
node scripts/history-rewrite.mjs rewrite-pull-requests \
  --map docs/history-rewrite-map.json
```

After review, apply it:

```sh
node scripts/history-rewrite.mjs rewrite-pull-requests \
  --map docs/history-rewrite-map.json \
  --execute
```

Then:

- Inspect every `uses:` pin. Re-pin only SHAs that point inside
  `patinaproject/skills`; third-party action pins stay unchanged.
- Verify all published Releases and both historical tag forms resolve.
- Dry-run release-please and confirm it computes the next version without
  replaying an already published release.
- Check the release manifest and `CHANGELOG.md` against the rewritten commits.
- Spot-check commits and merged pull requests while logged out.
- File and close a throwaway issue in each public repository and verify
  GitHub-to-Linear state propagation. Verify each repository link is configured
  for one-way issue intake. Do not mutate the Linear mirror: native property
  updates and synced-thread replies propagate back to GitHub.

## Fork recovery notice

The downstream fork cannot be rewritten in place. Tell its holder to export
unmerged work before the window and re-clone afterward. A branch that must be
carried forward should be recreated by cherry-picking patches onto the new
history, not by merging the old fork graph.

## Completion record

After the operation, append the execution date, backup location owner (not
credentials), old and new `main` SHAs, verification result, ruleset restoration
result, immutable pull-ref exception verification, release dry-run result, and
fork-notification confirmation here. This section remains intentionally
incomplete until the force-push succeeds.
