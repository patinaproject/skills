# Triage Labels

The `triage` skill applies these labels by their exact strings. Every label uses
Sentence case: capitalize the first word only, keep proper nouns and acronyms,
and capitalize the word after a `Prefix:`.

**Type**, exactly one per triaged issue:

| Label | Meaning |
| --- | --- |
| `Feature` | Changes what the product does, or how fast or light it does it, as users observe it |
| `Bug` | Makes the product do what it was already supposed to do |
| `Refactor` | Changes product source in a way no user can observe |
| `Tools` | Changes project files only: tooling, CI, skills, agent workflows, tests, docs |
| `Task` | Needs no repository change; a one-off action on data, accounts, settings, or vendors |

**Goal**, at most one, the first that fits: `Legal`, `Security`,
`Delivery and stability`, `Revenue`, `Support`, `Tech debt`.

**Triage**, exactly one per triaged issue:

| Label | Meaning |
| --- | --- |
| `Needs triage` | Maintainer needs to evaluate this issue |
| `Needs info` | Waiting on reporter for more information |
| `Ready for agent` | Fully specified, ready for an AFK agent |
| `Ready for human` | Requires human implementation |
| `Won't fix` | Will not be actioned |
