# Triage Labels

The `triage` skill applies these labels by their exact strings. Every label uses
Sentence case: capitalize the first word only, keep proper nouns and acronyms,
and capitalize the word after a `Prefix:`.

**Type**, exactly one per triaged issue:

| Label | Definition |
| --- | --- |
| `Feature` | Changes what the product does, or how fast or light it does it, as users observe in Production. |
| `Bug` | Makes the product do what it was already supposed to do, including fixing a performance regression. |
| `Refactor` | Changes product source in a way no user can observe. |
| `Tools` | Changes project files only: tooling, CI, skills, agent workflows, tests, docs. Never product behavior. |
| `Task` | Needs no repository change: a one-off action on data, accounts, settings, or vendors. |

**Goal**, at most one. When two fit, take the one listed first:

| Label | Definition |
| --- | --- |
| `Legal` | Meets a legal, privacy, or compliance obligation, or reduces legal risk. |
| `Security` | Reduces security risk or meets a security requirement. |
| `Delivery and stability` | Reduces failures users hit in Production (crashes, errors, outages, data loss, flaky behavior), or makes building, testing, and shipping our software and agents faster or safer. |
| `Revenue` | Acquisition, discoverability (SEO), onboarding, conversion, subscriptions, and pricing. |
| `Support` | Helps users get help, or reduces support load. |
| `Tech debt` | Lowers the cost or risk of maintaining what already exists. |

**Triage**, exactly one per triaged issue:

| Label | Meaning |
| --- | --- |
| `Needs triage` | Maintainer needs to evaluate this issue |
| `Needs info` | Waiting on reporter for more information |
| `Ready for agent` | Fully specified, ready for an AFK agent |
| `Ready for human` | Requires human implementation |
| `Won't fix` | Will not be actioned |
