# Store incremental review results

`polish` stores one temporary review file for each repository, source branch,
and target branch. It contains commit IDs, completed results, and short located
findings. It does not store source excerpts, credentials, prompts, reviewer
transcripts, or GitHub data.

## Select work to review

Resolve `<polish-skill-directory>` to the directory containing the active
`SKILL.md`, then run:

```sh
node <polish-skill-directory>/scripts/review-state.mjs scope \
  --target <target-branch>
```

The JSON result contains `mode`, `base`, `head`, `range`, record state, the last
completed findings under `authoritative`, and findings from an unfinished run
under `provisional`. `range` is the exact `<base>..<head>` range. `recheck` and
`skip` have no range.

## Save a completed review

After design review, verification, Standards, and Spec all finish on one
unchanged commit, run one command:

```sh
node <polish-skill-directory>/scripts/review-state.mjs complete \
  --target <target-branch> \
  --candidate <candidate-head> \
  --outcome passed

node <polish-skill-directory>/scripts/review-state.mjs complete \
  --target <target-branch> \
  --candidate <candidate-head> \
  --outcome changes_requested \
  --findings <findings.json>
```

The command requires a clean committed worktree, the candidate must equal
`HEAD`, and a prior `scope` call must have selected that same commit. One
`scope` selection accepts one `complete` call. A passing result has no findings.
A changes-requested result has at least one.

These checks prevent a fix commit from being recorded as reviewed before a new
review sees it. After fixing and committing a finding, call `scope` again and
review the returned range.

## Save findings from an unfinished review

When a review errors, times out, stops early, or sees `HEAD` change, leave the
last completed result unchanged. Save only useful located findings:

```sh
node <polish-skill-directory>/scripts/review-state.mjs provisional \
  --target <target-branch> \
  --candidate <attempted-head> \
  --findings <findings.json>
```

Create the JSON file outside the repository and remove it after the command.
No state change succeeded unless the command exits 0 and prints the new record.

## Move a record between temporary directories

A branch may move between worktrees while another Codex session uses a
different temporary directory. Copy that branch's records with:

```sh
node <polish-skill-directory>/scripts/review-state.mjs relocate \
  --from <other-temporary-directory> \
  --branch <branch>
```

`--branch` defaults to the current branch. `--from` accepts the other temporary
root, its private `patinaproject-<user>` directory, or its `polish-reviews`
directory.

The result lists the source and the target branches copied or kept. It keeps
the local record when that record covers the same commit, a later commit, or a
different history. It never replaces broader local coverage with older data.
Records for another repository or source branch stay in the source directory.

## Finding file format

Use a JSON array with the minimum needed to find the concern again:

```json
[
  {
    "axis": "architecture",
    "id": "AR1",
    "location": "path/to/module.ts:42",
    "summary": "The changed adapter leaks storage details to its caller."
  }
]
```

`axis` must be `architecture`, `standards`, or `spec`. Keep the same ID while
the same concern remains. Update its location on every review.

## Storage and recovery

Normal runs store records below the operating system's temporary directory in
a private `patinaproject-<user>/polish-reviews` directory. Tests may set
`PATINAPROJECT_POLISH_TMP_DIR`.

The helper accepts a record only when its schema, repository, branches, and Git
history match the current work. Missing, corrupt, unreadable, unrelated, or
outdated data causes a full review from the merge base to `HEAD`. Findings from
an unfinished review never reduce the range.

`skip` requires `authoritative.scopedHead` to equal `reviewedHead`. Only a
successful `complete` call writes that value. A moved or hand-edited record is a
claim from another session, not proof that a review ran.

The helper writes records through a same-directory temporary file and atomic
rename. It uses private file permissions where supported and lock files to keep
simultaneous writes in order. Losing the temporary directory only causes a full
review next time.
