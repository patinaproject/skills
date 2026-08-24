# Triage Labels

The `triage` skill speaks in canonical triage roles. This repository uses the
role names verbatim as its label strings, in both providers:

| Role | Label |
| --- | --- |
| `needs-triage` | `needs-triage` |
| `needs-info` | `needs-info` |
| `ready-for-agent` | `ready-for-agent` |
| `ready-for-human` | `ready-for-human` |
| `wontfix` | `wontfix` |

`issue-tracker.md` → **Triage roles** is authoritative. It carries the two roles
this table omits (`bug` and `enhancement`, the category axis), the lifecycle
state each role implies in GitHub and Linear, and the rule that a triaged issue
holds exactly one category role and one state role. Read it before applying a
label, and resolve the live label name from the provider's inventory — a role
name and its label string can differ in a repository that renames them.
