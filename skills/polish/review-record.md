# Incremental Review Record

`polish` stores one disposable review record per repository, source branch, and
target branch beneath the operating-system temporary root. The record contains
identity, commit IDs, outcomes, and concise located findings. It contains no
source excerpts, credentials, prompts, reviewer transcripts, or GitHub
evidence.

## Run the bundled command

Resolve `<polish-skill-directory>` to the directory containing the `SKILL.md`
currently executing. Run the helper with Node.js:

```sh
node <polish-skill-directory>/scripts/review-state.mjs scope \
  --target <target-branch>
```

The JSON result supplies `mode`, `base`, `head`, `range`, state status, and the
authoritative and provisional findings to revalidate. `range` is the exact
two-endpoint `<base>..<head>` range. `recheck` and `skip` have no range.

After architecture, verification, Standards, and Spec all finish against one
stable committed endpoint, atomically replace the authoritative record:

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

`complete` requires a clean committed worktree and rejects a candidate that no
longer equals `HEAD`. A passing record has no findings; a changes-requested
record has at least one. Completion clears provisional data because the full
selected scope and every carried concern were revalidated.

When a stage errors, times out, is interrupted, or observes a moving head, keep
the authoritative record and save only useful findings from the attempt:

```sh
node <polish-skill-directory>/scripts/review-state.mjs provisional \
  --target <target-branch> \
  --candidate <attempted-head> \
  --findings <findings.json>
```

Create findings input as a temporary file outside the repository and remove it
after the command completes. The helper exits `1` on invalid arguments or an
operational error; no state transition is complete unless it exits `0` and
prints the resulting JSON record.

## Finding shape

Finding files are JSON arrays. Keep the minimum needed to revalidate each
concern:

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

`axis` is `architecture`, `standards`, or `spec`. Keep an ID stable while the
same concern remains outstanding. Revalidate locations on every later run.

## Storage and recovery

The helper follows the temporary-file approach used by mattpocock/skills. Node's
operating-system temp resolver supplies the platform location. Beneath it, the
helper creates a private, user-scoped `patinaproject-<user>/polish-reviews`
directory and derives a deterministic SHA-256 filename from repository,
source-branch, and target-branch identity. Every state-directory component is
owner-checked and opened without following symbolic links.

`PATINAPROJECT_POLISH_TMP_DIR` replaces the temp root for isolated automated
tests. Normal runs use the operating-system location.

The record is valid only when its schema, identity, and Git ancestry match the
current work. Missing, corrupt, inaccessible, foreign, or non-ancestral state
selects a full merge-base-to-`HEAD` review. Provisional state never advances
coverage or narrows that scope.

Completed records are written to a same-directory temporary file,
synchronized, and atomically renamed. On supported platforms, the directory is
mode `0700` and records are mode `0600`. Identity-scoped lock files serialize
record transitions so a provisional write cannot restore stale authoritative
state. Losing the directory causes a full review on the next run.
