## Labels

The `triage` skill applies these labels by their exact strings. This section is
the only definition of the Type and Theme labels; other skills and docs point
here. Every label uses Sentence case: capitalize the first word only, keep
proper nouns and acronyms, and capitalize the word after a `Prefix:`.

An issue carries at most one label from each group below.

<!-- label-vocabulary:start -->
**Type** says what kind of work the issue is. Every triaged issue carries
exactly one, chosen from its repository's Type set:

| Repository | Type set |
| --- | --- |
| `patinaproject/skills` | `Skills` |
| `patinaproject/factory` | `Factory` |
| `patinaproject/patinaproject`, and any repository not listed | `Feature`, `Bug`, `Refactor`, `Tools`, `Task`, `Design` |

Each Type says how triage verifies the issue's claim and which commit types
the closing pull request uses.

| Label | Commit types | Verify the claim by | Definition |
| --- | --- | --- | --- |
| `Feature` | `feat`, `perf` | redundancy check | Changes what the product does, or how fast or light it does it, as users observe in Production. |
| `Bug` | `fix` | reproduction | Makes the product do what it was already supposed to do, including fixing a performance regression. |
| `Refactor` | `refactor` | redundancy check | Changes product source in a way no user can observe. |
| `Tools` | `chore`, `ci`, `test`, `docs`, `style` | reproduction when it reports something broken, otherwise redundancy check | Changes project files only: tooling, CI, skills, agent workflows, tests, docs. Never product behavior. |
| `Task` | none | confirming the action is not already done | Needs no repository change: a one-off action on data, accounts, settings, or vendors. |
| `Design` | none | confirming no existing design covers it | Produces a product or UX design, such as flows, mockups, or a prototype, for later work to build. |
| `Skills` | any | reproduction when it reports something broken, otherwise redundancy check | Any work in `patinaproject/skills`: skills, plugins, their tooling, and their docs. |
| `Factory` | any | reproduction when it reports something broken, otherwise redundancy check | Any work in `patinaproject/factory`. |

- **Reproduction:** reproduce the report from the reporter's steps and name the
  code path.
- **Redundancy check:** search the codebase for an existing implementation and
  record where you looked.
- **Confirming the action is not already done:** check the system the action
  touches.
- **Confirming no existing design covers it:** search the design files and
  earlier design issues for the same flow or screen.

Product is what a Production deploy delivers to users, including
infrastructure on a user's request path. Internal tooling, CI, skills, agent
workflows, and repository structure are never product, so broken tooling is
`Tools`, not `Bug`.

Linear holds every Type above in one Type group. A public repository's issue
reaches Linear with its GitHub Type label, so the `Skills` and `Factory` labels
mark which repository the work belongs to.

**Theme** says why the work matters. An issue carries at most one, and a
missing Theme never blocks readiness. When two fit, take the one listed
first.

| Label | Definition |
| --- | --- |
| `Security` | Reduces security risk or meets a security requirement. |
| `Legal` | Meets a legal, privacy, or compliance obligation, or reduces legal risk. |
| `Support` | Helps users get help, or reduces support load. |
| `Performance & stability` | Reduces failures users hit in Production (crashes, errors, outages, data loss, flaky behavior), or keeps the product fast. |
| `User blockers` | Removes friction or a missing step that stops users from finishing what they came to do. A failure users hit in Production is `Performance & stability`. |
| `User enablers` | Lets users do something they could not do before. |
| `Revenue` | Acquisition, discoverability (SEO), onboarding, conversion, subscriptions, and pricing. |
| `Deliverability & reliability` | Makes building, testing, and shipping our software and agents faster, safer, or more reliable. |
<!-- label-vocabulary:end -->

**Triage**, exactly one per triaged issue:

| Label | Meaning |
| --- | --- |
| `Needs triage` | Maintainer needs to evaluate this issue |
| `Needs info` | Waiting on reporter for more information |
| `Ready for agent` | Fully specified, ready for an AFK agent |
| `Ready for human` | Requires human implementation |
| `Won't fix` | Will not be actioned |
