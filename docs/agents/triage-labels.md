# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual GitHub label vocabulary used by this repository.

| Label in mattpocock/skills | Label in our tracker | Meaning |
| -------------------------- | -------------------- | ------- |
| `needs-triage`             | none; leave unlabeled until classified | Maintainer needs to evaluate this issue |
| `needs-info`               | `question` | Waiting on the reporter for more information |
| `ready-for-agent`          | `ready-for-agent` | Fully specified, ready for an AFK agent |
| `ready-for-human`          | `help wanted` | Requires human implementation or attention |
| `wontfix`                  | `wontfix` | Will not be actioned |

Before applying labels, refresh the canonical list with `gh label list` and rely on each label's `description`. Reserved release automation labels such as `autorelease: pending` and `autorelease: tagged` are not triage labels.
