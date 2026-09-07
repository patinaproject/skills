# Review evidence package

Keep `report.json`, `report.md`, the two lane reports, criteria snapshots, and
all cited execution artifacts together outside the source tree. The JSON
envelope uses schema version 1.

## JSON envelope

```json
{
  "schemaVersion": 1,
  "comparison": {
    "repositoryIdentity": "git@github.com:owner/repository.git",
    "headOid": "0123456789012345678901234567890123456789",
    "intendedParentRef": "origin/main",
    "parentTipOid": "0123456789012345678901234567890123456789",
    "mergeBaseOid": "0123456789012345678901234567890123456789",
    "mode": "committed"
  },
  "criteria": {
    "digestAlgorithm": "sha256",
    "sources": [
      {
        "sourceKey": "repo-guidance",
        "origin": "repository:AGENTS.md",
        "acceptanceBasis": "applies to every changed path",
        "snapshotLocation": "criteria/repo-guidance.md",
        "contentDigest": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        "affects": ["standards"]
      }
    ]
  },
  "axes": {
    "standards": {
      "status": "complete",
      "reviewerSession": "standards-session-id",
      "examinedComparison": {},
      "examinedSources": [
        {
          "sourceKey": "repo-guidance",
          "origin": "repository:AGENTS.md",
          "acceptanceBasis": "applies to every changed path",
          "affects": ["standards"],
          "contentDigest": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        }
      ],
      "execution": {
        "assignedRoute": "native spawn_agent",
        "modelSelection": {
          "role": "judgment and prose",
          "descriptor": "codex:gpt-6-astra@high",
          "provider": "codex",
          "model": "gpt-6-astra",
          "effort": "high",
          "selectionBasis": "loaded instruction",
          "configurationSource": "session AGENTS.md, judgment and prose role",
          "sourceEvidence": "model-selection.json"
        },
        "observedRouteEvidence": "standards/route.json",
        "transcriptLocation": "standards/transcript.jsonl",
        "comparisonReads": [
          { "kind": "merge-base", "artifactPath": "standards/merge-base.txt" },
          { "kind": "diff", "artifactPath": "standards/diff.txt" },
          { "kind": "log", "artifactPath": "standards/log.txt" },
          { "kind": "show", "artifactPath": "standards/show.txt" }
        ],
        "sourceReads": [
          { "sourceKey": "repo-guidance", "artifactPath": "standards/source-read.txt" }
        ],
        "coverage": [
          { "sourceKey": "repo-guidance", "artifactPath": "standards/coverage.md" }
        ]
      },
      "findings": []
    },
    "spec": {
      "status": "incomplete",
      "reason": "accepted requirements unavailable",
      "availableEvidence": []
    }
  },
  "excludedWorkingChanges": {
    "staged": false,
    "unstaged": false,
    "untracked": false
  }
}
```

For a complete axis, copy the full `comparison` object into
`examinedComparison`. Record one `examinedSources` entry for each source whose
`affects` contains that axis. Each reviewer records the full source identity:
`sourceKey`, `origin`, `acceptanceBasis`, `contentDigest`, and `affects` (compared
as a sorted set). Preserve that reviewer-owned tuple when assembling the report;
changing only the aggregate source cannot update an old axis result. The helper
returns these tuples in `axisSourceIdentities` on success. Snapshot storage paths
are outside identity. Evidence paths resolve relative to `report.json`.
The helper requires distinct reviewer sessions and physically distinct execution
artifacts between axes: route, transcript, merge-base, diff, log, source reads,
and coverage. Symlinks and hard links to the same file count as shared evidence.
Within one axis, a transcript may supply several reads or coverage records.
Criteria snapshots may be shared between axes. A committed `show` artifact is
also required when the diff is nonempty. Distinct files prove separation of
artifacts only; inspect their contents and runtime records to establish actual
independent execution.

Each axis retains the selected descriptor, its configuration source or explicit
session override, and its own observed route evidence. `sourceEvidence` points
to the applicable instruction or saved override; a default is labeled as such.
For `inherit-parent` and `auto`, keep the alias and record the actual parent
model and effort, or explicitly unknown runtime metadata. Compare the observed
dispatch with the selection; a mismatch makes that axis incomplete. The identity
helper does not validate model resolution or prove that dispatch honored it.

For an incomplete axis, provide a nonempty `reason` and list every available
artifact in `availableEvidence`. An incomplete axis is a valid report state and
cannot authorize publication.

## Stable finding identity

Each complete-axis finding has these fields:

```json
{
  "identity": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "axis": "standards",
  "classification": "documentedViolation",
  "sourceKey": "repo-guidance",
  "sourceDigest": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "criterionLocator": "Testing Guidelines",
  "citedText": "short cited criterion",
  "location": "path/to/file:42",
  "semanticLocation": "symbol or scoped omission",
  "evidence": "committed behavior and necessary context",
  "evidenceDigest": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "impact": "concrete consequence"
}
```

Compute `identity` as SHA-256 over UTF-8 JSON with recursively sorted object
keys and no extra whitespace. Hash this tuple:

```json
{
  "axis": "standards",
  "classification": "documentedViolation",
  "criterionLocator": "Testing Guidelines",
  "citedText": "short cited criterion",
  "evidenceDigest": "sha256:...",
  "semanticLocation": "symbol or scoped omission",
  "sourceDigest": "sha256:...",
  "sourceKey": "repo-guidance",
  "sourceOrigin": "repository:AGENTS.md",
  "sourceAcceptanceBasis": "applies to every changed path"
}
```

Derive `sourceOrigin` and `sourceAcceptanceBasis` from the report's criteria
source selected by the finding's `sourceKey`; these tuple members are not extra
finding fields. A changed authority changes the finding identity even when its
text is identical, so it cannot inherit the old dismissal. Applicability remains
in axis source identity; the finding already names its axis.

Compute `evidenceDigest` as SHA-256 over the exact UTF-8 bytes in `evidence`.
Use a stable section or rule name for `criterionLocator` and the exact criterion
quotation for `citedText`. Together with the source identity, they distinguish
rules that cite the same code. A changed classification also changes identity.

Include necessary context, assumptions, and substantiation of concrete
consequences in `evidence`. New substantiation changes its digest and identity.
Rephrasing `impact`, absolute code line movement, other report wording, report
order, and the head object ID do not define the finding. A fresh reviewer must
reconsider a changed concrete consequence or assumption before reusing a
dismissal, even when the recorded identity matches. The helper cannot judge
whether an impact edit is merely wording; it checks the supplied tuple only.

## Readable report

Write `report.md` with these sections:

1. Comparison and excluded working changes.
2. Criteria sources and applicability.
3. Standards status, execution evidence, coverage, and findings.
4. Spec status, execution evidence, coverage, and findings.
5. Identity helper result and its exact command.

Keep incomplete states visible. Do not combine finding counts across axes or
describe an identity match as a semantic pass.
