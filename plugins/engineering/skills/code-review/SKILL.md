---
name: code-review
description: Review committed changes against repository standards and accepted requirements in two separate read-only contexts. Use for branch, pull request, or "review since X" review and before Patina publishes code.
---

# Review code against standards and requirements

Review one committed comparison on two independent axes. Standards checks the
repository's rules and named heuristics. Spec checks the accepted requirements.
Return both results even when one reviewer fails. Keep every source read-only.

Read [`review-criteria.md`](review-criteria.md) before you collect inputs. Use
[`report-template.md`](report-template.md) for the evidence package and JSON
envelope.

## Pin the comparison

Require an intended implementation parent. For a stack, use the parent branch
that contains the implementation ancestry. Record the forge target separately
when it differs.

Resolve and record these values before review:

- the repository identity;
- the current `HEAD` object ID;
- the intended parent ref and its current object ID;
- the merge-base object ID;
- the forge target ref and object ID, when they differ from the intended
  parent.

Run immutable Git reads with full object IDs. Each reviewer runs and retains
these commands with their complete output:

```bash
git merge-base <parent-tip-oid> <head-oid>
git --no-pager -c diff.external= -c diff.trustExitCode=false \
  diff --no-ext-diff --no-textconv <merge-base-oid> <head-oid>
git --no-pager log <merge-base-oid>..<head-oid>
git --no-pager show --no-ext-diff --no-textconv <head-oid>:<path>
```

Review only committed content. Report staged, unstaged, and untracked changes
as excluded. A dirty checkout does not prevent standalone review because the
reviewers read Git objects. Never commit, stash, edit, repair, or publish.

## Collect exact criteria

Discover applicable repository guidance and accepted requirements as
[`review-criteria.md`](review-criteria.md) defines. Snapshot the exact accepted
bytes outside the source tree. Record each source's origin, acceptance basis,
digest, and affected axes.

An agreed user task is a valid specification. If no accepted specification is
available, keep Spec incomplete and state what is missing. Do not derive the
specification from the implementation.

When Patina calls before implementation, return the criteria snapshots and
provenance for the worker brief. Final review uses the same sources. Repeat
applicability discovery after implementation so nested guidance introduced by
new paths cannot be missed. Record every accepted source change before review.

## Run two fresh reviewers

Use two separate fresh read-only contexts. Bind both to the configured
`judgment and prose` role. Read
[`../patina-mode/references/provider-dispatch.md`](../patina-mode/references/provider-dispatch.md)
before the parent launches either reviewer. Use that reference's native or
external route without substitution.

Give each reviewer the pinned comparison, its complete criteria snapshots, the
required output path, and any prior dispositions. Keep Standards and Spec in
separate output paths.

Each reviewer must:

1. Run its own immutable comparison reads and retain the tool records.
2. Read and hash every source assigned to its axis.
3. Map every applicable criterion to inspected behavior, a finding, or a
   reasoned non-applicability result.
4. Cite the criterion and committed source evidence for every finding.
5. Return `complete` only when its execution, source reads, and coverage are
   evidenced.

A failed runtime, missing transcript, missing source, or unexplained coverage
gap makes that axis incomplete. Provider receipts identify the runtime. They do
not prove which source the reviewer examined or whether the review was sound.

## Aggregate without hiding failures

Preserve the two lane reports and their transcript references. Write the JSON
envelope and a concise readable report. Keep the axes separate. Report raw
findings and incomplete states without turning either into a pass claim.

Use the stable finding identity from
[`report-template.md`](report-template.md). A prior dismissal remains relevant
only when a fresh reviewer confirms the same criterion, semantic location,
evidence, and assumptions. New evidence gets a new finding identity.

Run the identity helper when the caller needs a current publication check:

```bash
node <code-review-skill>/scripts/check-identity.mjs \
  --report <task-evidence>/report.json \
  --repo <repository> \
  --intended-parent <current-implementation-parent-ref> \
  --criteria <task-evidence>/current-criteria.json
```

Supply `--intended-parent` from the current task or stack intent each time; the
helper resolves its tip independently. Use the implementation parent even when
the forge target differs. Copying the old report ref cannot detect retargeting.

Exit 0 means that the comparison and structural evidence match the current
inputs. It does not mean that the review passed or that publication is allowed.
Patina inspects the reviewer-owned records, resolves findings, and owns the
publication decision.
