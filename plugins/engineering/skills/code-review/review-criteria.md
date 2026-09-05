# Review criteria

This reference defines the shared inputs for implementation and final review.

## Discover repository standards

Read the repository's configured guidance for every affected path. Include the
root instructions and each applicable nested instruction file. Include coding,
testing, security, compatibility, and publication rules that bear on the
change. Confirm whether named tooling ran before treating its rules as covered.

Record every standards source with:

- a stable source key;
- its repository and path, or its configured external origin;
- its commit and blob object IDs when Git owns the source;
- the SHA-256 digest of the exact snapshot bytes;
- why the source applies;
- `standards` or both axes in `affects`.

Repository rules take precedence over the heuristic list below. Treat each
heuristic as a suggestion until concrete evidence shows a defect. The list is
adapted from Martin Fowler's code smells in *Refactoring*:

- Mysterious Name. A name hides what a value or operation means.
- Duplicated Code. The change repeats the same logic shape.
- Feature Envy. An operation mainly reads another object's data.
- Data Clumps. The same values repeatedly travel together.
- Primitive Obsession. A primitive hides a domain concept.
- Repeated Switches. Several sites branch on the same cases.
- Shotgun Surgery. One behavior change requires scattered edits.
- Divergent Change. One module changes for unrelated reasons.
- Speculative Generality. An abstraction has no accepted requirement.
- Message Chains. A caller depends on a long navigation chain.
- Middle Man. A layer delegates without owning behavior.
- Refused Bequest. A subtype rejects most of its inherited contract.

## Discover accepted requirements

Use the authoritative issue or specification configured by the repository.
Include accepted discussion that changes the task. If no issue exists, snapshot
the agreed user task. Record the canonical origin, acceptance basis, exact
accepted bytes, SHA-256 digest, and affected axes.

If an authoritative source is unavailable, record its identity and the failed
access. Mark Spec incomplete. If applicability or axis ownership is ambiguous,
mark both axes incomplete until the caller resolves it.

## Build the shared input

Give the implementer and reviewers the same source inventory, snapshots, and
provenance. Store the snapshots in task-local evidence outside the repository.
Use this machine-readable current criteria manifest:

```json
{
  "schemaVersion": 1,
  "sources": [
    {
      "sourceKey": "repo-guidance",
      "origin": "repository:AGENTS.md",
      "acceptanceBasis": "applies to every changed path",
      "snapshotPath": "criteria/repo-guidance.md",
      "affects": ["standards"]
    }
  ]
}
```

Resolve `snapshotPath` relative to the criteria manifest. Refresh the manifest
from authoritative sources before implementation, final review, and the last
publication identity check. `origin` identifies the canonical repository/path,
issue, discussion, or task; `acceptanceBasis` records the accepted decision or
applicability basis. Keep both strings stable while that authority is unchanged.
A snapshot's local path is storage, not its canonical origin. The helper hashes
the current bytes and compares provenance exactly; the caller establishes that
the declared source is authoritative.

## Classify findings

Use one of these classes:

- `documentedViolation` cites an applicable repository rule and shows the
  conflicting committed behavior.
- `requirementFailure` cites an accepted requirement and shows an omission,
  incorrect behavior, or unrequested scope.
- `heuristic` names a smell and shows its concrete cost. Severity or repetition
  alone cannot make it blocking.

Each finding identifies the source, criterion, committed semantic location,
evidence, and impact. Patina decides whether the finding is accepted,
dismissed, or resolved. Code-review reports the evidence and never disposes its
own findings.

## Invalidate stale evidence

A repository, head, intended parent ref, parent tip, or merge-base change
invalidates both axes. Patch-ID equality does not preserve a Standards or Spec
review on a new commit.

A source key, canonical origin, acceptance basis, digest, or applicability
change invalidates every axis in the union of its old and current `affects`
sets. Use both axes when ownership is ambiguous. An unavailable authoritative
source prevents a current result for its axes.

An empty committed diff still requires complete criteria coverage. Dirty work
remains excluded and cannot support a work-in-progress review claim.
