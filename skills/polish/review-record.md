# Store incremental review results

`polish` stores one temporary review file for each repository, source branch,
and target branch. It contains commit IDs, completed results, short located
findings, and the SHA-256 digest and version of the basis manifest that produced
the result. It does not store requirement text, source-code excerpts,
credentials, caller focus instructions, behavioral observations, prompts,
reviewer transcripts, or pull-request data.

## Build the review basis

At the start of each top-level invocation, create one JSON basis manifest
outside the repository. Keep it unchanged through every internal fix loop. A
later invocation builds a fresh manifest.

Use this exact shape:

```json
{
  "manifestVersion": 1,
  "standards": [
    { "source": "AGENTS.md", "content": "<exact file content>" }
  ],
  "reviewRules": [
    {
      "axis": "architecture",
      "source": "skill:codebase-design/SKILL.md",
      "content": "<exact active rule content>"
    }
  ],
  "designSources": [
    { "source": "CONTEXT.md", "content": "<exact file content>" }
  ],
  "spec": {
    "source": "github:owner/repository#123",
    "content": "<complete originating issue or specification>"
  }
}
```

Use `null` for `spec` when the work has no originating issue or specification.
Use stable source identities: repository-relative paths for repository files,
skill-relative identities for skill rules, and the canonical tracker or
document identifier for the Spec. A different identity is a different basis
even when its text is equal.

Build the four groups from these deterministic source sets, sorting every file
set by source identity:

- `standards`: `AGENTS.md` at the repository root and every additional
  `AGENTS.md` that governs a path in the full merge-base-through-`HEAD` branch
  diff, plus each repository standards document those instructions explicitly
  require for the changed work.
- `reviewRules`: the complete active Architecture, Standards, and Spec review
  rules and each baseline or required reference those rules name. Label every
  entry with its axis.
- `designSources`: `CONTEXT.md` when present, every file in `docs/adr/` when
  present, and the active design-review rules and required references.
- `spec`: the complete originating issue or specification and its canonical
  source identity.

Set membership is part of the basis. Include added and empty files; omit removed
files. Never put credentials in the manifest. The helper can prove that the
manifest it hashes is the one passed through this invocation, but it cannot
prove that the caller fetched each source freshly.

## Select work to review

Resolve `<polish-skill-directory>` to the directory containing the active
`SKILL.md`, then run:

```sh
node <polish-skill-directory>/scripts/review-state.mjs scope \
  --target <target-branch> < <basis-manifest.json>
```

When the invocation includes caller focus instructions or behavioral
observations, add `--review-context present`. This marker contains no supplied
text and is not stored. It forces `full`, ensuring that the context reaches all
reviewers instead of allowing `skip` or a narrower range.

The helper validates the manifest, canonicalizes it with RFC 8785, and computes
its SHA-256 digest. It never accepts a caller-supplied hash. The JSON result
contains `mode`, `reason`, `basisDigest`, `manifestVersion`, `base`, `head`,
`range`, record state, completed findings under `authoritativeFindings`, and
findings from an unfinished run under `provisionalFindings`. `range` is the
exact `<base>..<head>` range. `recheck` and `skip` have no range.

The selection is deterministic:

| Condition | Mode |
| --- | --- |
| Missing, invalid, unrelated, or old-schema state | `full` |
| Saved digest or manifest version differs | `full` |
| Caller instructions or observations are present | `full` |
| Equal basis with later commits | `incremental` |
| Equal basis with findings at the same commit | `recheck` |
| Equal basis with an earned pass at the same commit | `skip` |

There is no materiality decision or invalidation command. Any basis difference
is a safe cache miss. `scope` records the open commit and current digest but
does not change the digest on the last completed review, so an interrupted full
review cannot expose the older pass.

## Save a completed review

After design review, verification, Standards, and Spec all finish on one
unchanged commit, pass the same captured manifest through standard input:

```sh
node <polish-skill-directory>/scripts/review-state.mjs complete \
  --target <target-branch> \
  --candidate <candidate-head> \
  --outcome passed < <basis-manifest.json>

node <polish-skill-directory>/scripts/review-state.mjs complete \
  --target <target-branch> \
  --candidate <candidate-head> \
  --outcome changes_requested \
  --findings <findings.json> < <basis-manifest.json>
```

The command requires a clean committed worktree. The candidate must equal
`HEAD`, the digest must equal the open scope's digest, and a prior `scope` call
must have selected that same commit. One `scope` selection accepts one
`complete` call. Only successful `complete` changes the stored completed digest.
A passing result has no findings. A changes-requested result has at least one.

## Inspect a record without opening a scope

Callers that only need relocation status use the read-only command:

```sh
node <polish-skill-directory>/scripts/review-state.mjs status \
  --target <target-branch>
```

It reports record state, the reviewed head, and completed and provisional
findings. It does not require a manifest or change the record.

## Save findings from an unfinished review

When a review errors, times out, stops early, or sees `HEAD` change, leave the
last completed result unchanged. Save only useful located findings:

```sh
node <polish-skill-directory>/scripts/review-state.mjs provisional \
  --target <target-branch> \
  --candidate <attempted-head> \
  --findings <findings.json>
```

Create the findings file outside the repository and remove it afterward. No
state change succeeded unless the command exits 0 and prints the new record.

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

The helper accepts a record only when its schema, repository, branches, Git
history, manifest version, and digests match the record contract. Missing,
corrupt, unreadable, unrelated, or old-schema data causes a full review from the
merge base to `HEAD`. Findings from an unfinished review never reduce the
range.

`skip` requires `authoritative.scopedHead` to equal `reviewedHead`. Only a
successful `complete` call writes that value. A moved or hand-edited record is a
claim from another session, not proof that a review ran.

The helper writes records through a same-directory temporary file and atomic
rename. It uses private file permissions where supported and lock files to keep
simultaneous writes in order. Record relocation carries the digest with the
completed result. Losing the temporary directory only causes a full review next
time.
