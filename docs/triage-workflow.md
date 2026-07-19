# Triage Workflow

This tracker-agnostic workflow delegates every mutation to
[the issue-tracker adapter](issue-tracker.md).

## Vendored role translation

The vendored `triage` skill uses stable semantic roles. Translate them through
the adapter instead of assuming each role is a provider label:

| Vendored role | Repository meaning |
| --- | --- |
| `bug`, `enhancement` | Matching live category label, when available |
| `needs-triage` | Native Triage inbox state |
| `needs-info` | Backlog plus `needs-grilling` |
| `ready-for-agent` | Todo without `ready-for-human` |
| `ready-for-human` | Todo plus `ready-for-human` |
| `wontfix` | Canceled, with the rationale recorded in a comment |

Duplicate work uses the native Duplicate state and duplicate relationship.
Blocking uses the native blocked-by relationship. Do not recreate either as a
label.

In vendored triage guidance, interpret “GitHub issue” as the canonical tracker
issue, and replace `gh issue` examples with the corresponding adapter query.
Pull requests remain forge objects and are not issue-tracker intake.

## Shaping and ready bar

New work enters the native Triage inbox. Work that needs more evidence or a
maintainer decision moves to Backlog with the appropriate live shaping labels.
An issue enters Todo only when its shaping set is empty and an implementation
brief can be written without new decisions or missing evidence.

When a shaping activity resolves:

1. post its outcome on the issue;
2. remove only that activity's shaping label;
3. preserve every other label; and
4. choose the next justified state from the remaining evidence.

## Ready-state side effects

When an issue becomes ready, use the adapter to:

1. move it to Todo;
2. set or clear `ready-for-human` as appropriate;
3. choose the justified native priority; and
4. set a project and milestone together when it belongs to a named effort.

Release attachment is not a triage side effect. Releases describe what shipped.
A blocked issue may still be ready; record its dependency with the native
blocked-by relationship.
