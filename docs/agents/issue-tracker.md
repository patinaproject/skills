# Issue Tracker Adapter

This is the only repository file that translates tracker-agnostic issue
operations into a provider. Every other document and skill delegates tracker
mechanics here.

## Select the provider

Repository visibility selects the source of issue truth:

- **Public repository:** GitHub Issues in that repository.
- **Private repository:** Linear team `PAT`.

Resolve visibility with `gh repo view --json visibility`. Do not infer it from
the clone URL or the presence of an issue template. If visibility cannot be
resolved, stop before reading or mutating issue data.

For a public repository, GitHub is authoritative for issue content, discussion,
state, labels, relationships, milestones, and closure. Linear receives new
issues through one-way GitHub-to-Linear intake for team visibility. Linear's
native sync still propagates updates to synced properties in both directions.
Do not edit or close the Linear copy; close public work on GitHub, and treat any
disagreement in favor of GitHub. The one exception is a Linear-only field that
GitHub cannot represent, such as priority: set it on the Linear copy as
**Priority rubric** describes.

The sync creates a comment thread whose replies publish to GitHub. Comments
outside the synced thread remain private.

## Labels

Issue labels are the classification vocabulary, and this section is their
only definition. Skills, templates, and other docs name the groups and point
here rather than listing Type or Theme labels themselves. Apply labels by
these exact strings. See
[ADR-682](../adr/ADR-682-issue-type-and-outcome-labels.md).

### Label groups

An issue carries at most one label from each group. Linear enforces this with
label groups. GitHub has no label groups, so apply the same rule by hand there.

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
| `Support` | Helps users get help, or reduces support load. |
| `Security` | Reduces security risk or meets a security requirement. |
| `Legal` | Meets a legal, privacy, or compliance obligation, or reduces legal risk. |
| `Performance & stability` | Reduces failures users hit in Production (crashes, errors, outages, data loss, flaky behavior), or keeps the product fast. |
| `User blockers` | Removes friction or a missing step that stops users from finishing what they came to do. A failure users hit in Production is `Performance & stability`. |
| `User enablers` | Lets users do something they could not do before. |
| `Revenue` | Acquisition, discoverability (SEO), onboarding, conversion, subscriptions, and pricing. |
| `Deliverability & reliability` | Makes building, testing, and shipping our software and agents faster, safer, or more reliable. |
<!-- label-vocabulary:end -->

**Triage** says what triage decided. Every triaged issue carries exactly one.
A transition replaces it and preserves the Type and Theme.

| Label | Meaning | GitHub | Linear |
| --- | --- | --- | --- |
| `Needs triage` | Maintainer evaluation is required | label, issue open | label, Triage |
| `Needs info` | Waiting for information | label, issue open | label |
| `Ready for agent` | Ready for an implementation agent | label, issue open | label, `Todo` |
| `Ready for human` | Requires human implementation | label, issue open | label, `Todo` |
| `Won't fix` | Deliberately declined | label, issue closed | label, Canceled |

**Wayfinder** marks a Wayfinder map or ticket: `Wayfinder: Map`,
`Wayfinder: Research`, `Wayfinder: Grilling`, `Wayfinder: Task`, and
`Wayfinder: Prototype`. See **Wayfinding operations** below.

`Won't fix` is terminal: it accompanies closure rather than sitting on open
work. `Ready for agent` and `Ready for human` are both written; each is applied
directly rather than read from the other's absence.

A status and a Triage label are different axes. The status says where the issue
sits; the label says what triage decided. An issue that stays in the triage
state while carrying a Triage label is normal: triage has finished and a person
has not yet accepted it. A person owns every triage-facing status change.

### Label names

Every label uses Sentence case. Capitalize the first word only, and keep proper
nouns and acronyms as they are normally written (`SEO`, `iOS`, `E2E`,
`Sentry`). After a `Prefix:`, capitalize the next word too. The only exceptions
are release-please's `autorelease: pending` and `autorelease: tagged`, which
keep their exact names because release-please matches them. Never create a
label that breaks this rule, and give every label a non-empty description.

Labels outside the groups can stack: blockers such as `Needs design` and
`Blocked`, platforms such as `iOS`, and integrations such as `Sentry`. Load the
live inventory before applying one, and never invent a label.

In upstream triage guidance, interpret "GitHub issue" as the canonical tracker
issue and route example commands through this adapter. Pull requests remain
forge objects.

## Public repositories: GitHub Issues

Prefer connected GitHub tools in interactive sessions. Use `gh` when a
connected tool cannot express the operation.

| Operation | GitHub operation |
| --- | --- |
| Create an issue | `gh issue create` |
| Read an issue | `gh issue view` |
| List or filter issues | `gh issue list` |
| Search issue content | `gh search issues --repo OWNER/REPO` |
| Read comments | `gh issue view --comments` |
| Add a comment | `gh issue comment` |
| Update fields, labels, assignees, or milestone | `gh issue edit` |
| List or create labels | `gh label list` / `gh label create` |
| Close or reopen | `gh issue close` / `gh issue reopen` |
| Read or write sub-issues | REST `issues/{number}/sub_issues` endpoints |
| Read or write dependencies | REST `issues/{number}/dependencies/*` endpoints |
| Read releases | `gh release view` / `gh release list` |

Use the current repository unless the caller explicitly names another public
repository. Resolve issue numbers, node IDs, labels, milestones, assignees, and
relationships before mutation. Follow pagination for exhaustive reads.

### Public lifecycle

GitHub issues carry the labels above alongside open/closed state. New public
issues receive `Needs triage` unless they are already ready. A ready issue stays
open and carries `Ready for agent` or `Ready for human`. Close duplicates with
the duplicate reason and native relationship when available; close deliberate
non-work with `Won't fix` and a rationale.

### Public branch name

Derive the canonical branch as `<issue-number>-<kebab-case-title>`, matching the
repository automation's `{{entityNumber}}-{{description}}` template. Lowercase
the title, transliterate to ASCII, replace each run of non-alphanumeric
characters with one hyphen, trim hyphens, and keep the complete issue number.
Use the resulting adapter-provided name verbatim.

### Public planning and shipping

GitHub milestones describe planned delivery. GitHub Releases describe what
shipped. A completed issue or milestone is not proof that an item shipped:
release notes include only issues linked to shipped pull requests or otherwise
verified against the Release.

## Private repositories: Linear

Prefer the connected Linear tools in interactive sessions:

| Operation | Linear operation |
| --- | --- |
| Create or update an issue | `save_issue` |
| Read an issue | `get_issue` |
| List or filter issues | `list_issues` |
| Search issue content | `search` with `type: "issue"` |
| Read comments | `list_comments` |
| Add or update a comment | `save_comment` |
| List an issue's Documents | `get_issue` with `fields: ["documents"]` |
| Create or update a Document | `save_document` |
| List or create labels | `list_issue_labels` / `create_issue_label` |
| Close, reopen, or change state | `save_issue` with `state` |
| Read projects and milestones | `get_project`, `list_milestones`, `get_milestone` |
| Read releases and release notes | `list_releases`, `get_release`, `get_release_note` |
| Create or update release notes | `save_release_note` |

Use `PAT-N` identifiers in user-facing text and tool calls. Resolve remote
entities before mutating them. A `save_issue.labels` write replaces the
complete label set: read, merge locally, then write the intended set. Pass
`includeArchived: true` for exhaustive sweeps.

Headless sessions may use `https://mcp.linear.app/mcp` with
`Authorization: Bearer <LINEAR_API_KEY>`. When the hosted MCP cannot express an
operation, use Linear's GraphQL API at `https://api.linear.app/graphql`.
Personal API keys are passed directly in `Authorization`; OAuth tokens use
`Authorization: Bearer <token>`. Never print or commit a credential.

### Private lifecycle

New work enters Triage. The Triage labels above carry their Linear states, and
duplicate work uses Duplicate plus `duplicateOf`. Record a `Won't fix` rationale
on the issue.

Start work by self-assigning only when unassigned, then moving the issue to
`In Progress` when it is not already started or completed. Resolve work with
Done, Canceled, or Duplicate as appropriate.

Use native `parentId`, `blockedBy`, `blocks`, and `relatedTo` relationships.
Set a project and project milestone together when planning requires them.
Linear Releases and release notes describe what shipped.

The canonical private branch is the fetched issue's `gitBranchName`, used
verbatim.

## When an issue becomes ready

An issue is ready when an implementation brief can be written from it without a
new decision and without missing evidence. For ordinary human-controlled
readiness, use the adapter to:

1. apply the provider's ready state — leave a GitHub issue open, or move a
   Linear issue to `Todo`;
2. write the `Ready for agent` or `Ready for human` label, replacing the
   previous Triage label and preserving the Type and Theme; and
3. set the planning fields together when the work belongs to a named effort —
   a GitHub milestone, or a Linear project and project milestone.

Triage sets priority from the **Priority rubric** below.

Releases describe what shipped, so the release pipeline owns them and readiness
leaves them alone. A blocked issue may still become ready — record its
dependency with the native blocked-by relationship.

## Priority rubric

Triage gives every triaged issue exactly one priority: the highest lane whose
condition holds. Judge only evidence in the issue: its body, comments, and
linked reports. Evidence you cannot read does not count; name it as unread.
Labels, the reporter, and effort never count. See
[ADR-692](../adr/ADR-692-triage-assigns-priority.md).

- **Urgent:** work to triage and ship before all other open work. At least one
  trigger holds, and the triage notes name it and cite its evidence:
  1. A fault harms users now with no workaround: data loss, an outage, a
     security exposure, or a broken core flow.
  2. A legal or regulatory deadline applies.
  3. A release gate is blocked.
  4. Someone should stop work in progress for this. The notes say what would
     be interrupted and why waiting costs more.

  An issue where a trigger holds is never High.
- **High:** no Urgent trigger holds, and either the issue links a customer's
  own report (a Featurebase post or a support conversation), or a linked
  Sentry issue shows many affected users or events. None of these is a label.
- **Medium:** a confirmed bug or a valuable enhancement with limited reach.
- **Low:** waiting costs users nothing visible, such as maintenance-only work,
  dependency bumps, cosmetic polish, and routine follow-ups.

A confident duplicate gets no priority. Write priority to Linear's priority
field with `save_issue`: `1` Urgent, `2` High, `3` Medium, `4` Low. Never encode
it as a label. For a public repository, write it on the Linear copy: the Linear
issue whose GitHub attachment URL equals the GitHub issue URL. `list_issues`
returns no attachments, so confirm each candidate with `get_issue` and
`fields: ["attachments", "priority"]`. A title match alone is not a match. When no Linear copy
exists, the triage notes' `Priority:` line is the only record; name the gap in
the reply.

## Tracker-agnostic operations

- **Publish:** use the selected provider, then verify the created issue and its
  native relationships.
- **Fetch:** resolve one current reference, fetch the issue with relationships,
  and fetch comments when discussion matters.
- **Claim:** assign the current authenticated user only when unassigned.
- **Start work:** apply the provider lifecycle above.
- **Resolve:** close in the authoritative provider. For public repositories,
  never close only the Linear mirror.
- **Relationships:** use the provider's native parent, dependency, related, and
  duplicate primitives.
- **Attach an artifact:** save triage notes, an agent brief, research, or a
  proposed ADR as described in **Issue artifacts** below.
- **Branch name:** return the selected provider's canonical branch name.
- **Labels:** load the live provider inventory. Apply the provider's mutation
  semantics rather than assuming labels append or replace.

## Pull requests as a triage surface

**PRs as a request surface: no.** `triage` reads this flag to decide whether
pull requests enter the triage queue.

Pull requests are forge objects here, not tracker items. They carry the
pull-request label set, not the issue labels above, and they are reviewed rather
than triaged. Set this flag to `yes` only if this repository starts treating
external pull requests as feature requests; the issue labels above would then
apply to them unchanged.

GitHub shares one number space across issues and pull requests, so a bare `#42`
in a public repository may be either. Resolve it as a pull request first, then
fall back to an issue.

## When a skill says "publish to the issue tracker"

Create an issue in the selected provider — a GitHub issue for a public
repository, a Linear issue on team `PAT` for a private one. Never file the same
work in both: for a public repository, the GitHub-to-Linear intake creates the
mirror.

The Team plugin's `/to-spec` skill files issues through this adapter.

## When a skill says "fetch the relevant ticket"

Resolve one current reference and fetch the issue with its relationships, plus
its comments when discussion matters. Use `gh issue view <number> --comments`
for a public repository, or Linear's `get_issue` and `list_comments` for a
private one. See **Tracker-agnostic operations** above.

## Issue artifacts

An issue artifact is durable working material about one issue: triage notes,
an agent brief, research, or a proposed ADR. Where it lives depends on the
provider. See
[ADR-654](../adr/ADR-654-linear-issue-documents.md).

- **Public repository:** save triage notes and the agent brief as Linear
  Documents attached to the Linear copy, as below. Post on GitHub only when a
  human must act there. When the Linear copy is archived or missing, post them
  as GitHub comments instead and name the gap. Post research and proposed ADRs
  on the GitHub issue, as the producing skill describes.
- **Private repository:** save each artifact as a Linear Document attached to
  the issue. Post a comment only when a human must act.

### Attach an artifact to a Linear issue

The caller provides the issue, the artifact kind, and a Markdown body. An `adr`
artifact also needs its ADR ID and title. Each kind maps to one exact Document
title:

| Kind | Document title |
| --- | --- |
| triage notes | `Triage notes` |
| agent brief | `Agent brief` |
| research | `Research` |
| adr | `ADR-<id>: <title>` |

1. List the issue's Documents with `get_issue` and `fields: ["documents"]`. A
   headless session can query GraphQL
   `issue(id: "PAT-N") { documents { nodes { id title url } } }`.
2. Find the Document whose title matches exactly. Stop when more than one
   matches. Do not pick one.
3. When a Document matches, update it with `save_document` and its `id`.
   Otherwise create it with `save_document`, the issue, and the title.
4. Return the Document URL. Post no comment.

Write the complete content on every save. For a research artifact, read the
current content and append a `## <question>` section for the new question, so
one issue keeps one research record.

A triage notes or agent brief Document begins with the triage disclaimer,
`> *This was generated by AI during triage.*`. The next line records the UTC
time of the write, in the form `Last updated: 2026-10-16T12:34:56Z`. Linear
moves a Document's `updatedAt` a minute or more after a content edit, so this
line is the time a reader measures against.

### Triage on a Linear issue

Triage writes its notes to the `Triage notes` Document and its brief to the
`Agent brief` Document. A brief for `Ready for human` uses the same Document.
Re-running triage updates both in place.

Triage writes a comment only in these cases:

- **`Needs info`:** one short comment that starts with the triage disclaimer,
  @-mentions the reporter, and links the `Triage notes` Document. It mentions
  nobody else.
- **`Won't fix`:** the explanation comment posted with the closure.

`Ready for agent`, `Ready for human`, and `Needs triage` get no comment.

"Reporter activity since the last triage notes" means a comment or an edit to
the issue body by the reporter after the `Last updated:` time of the `Triage
notes` Document. When a person has removed that line, use the Document's
`updatedAt` instead. When
triage gathers context, it reads the `Triage notes` and `Agent brief` Documents
and every older comment that starts with the triage disclaimer, so it does not
ask a question that was already answered.

### Research on a Linear issue

Research for an issue goes to its `Research` Document. Research with no issue
goes to a repository file, as the `research` skill describes.

### Proposed ADRs on a Linear issue

An off-branch session saves the proposed ADR body as the `ADR-<id>: <title>`
Document on the implementing issue, instead of posting the comment that
[ADR-337](../adr/ADR-337-off-branch-doc-capture.md) describes. The implementing
pull request copies the Document word for word into
`docs/adr/ADR-<id>-<slug>.md`. `docs/adr/` remains the permanent record.
Proposed glossary entries still go on the issue as ADR-337 describes.

## Wayfinding operations

Used by `wayfinder`. The **map** is a single issue whose tickets are its child
issues. Without this section `wayfinder` falls back to a local-markdown tracker,
which is silently wrong on a repository that has a real one.

For a public repository:

- **Map**: one issue labelled `Wayfinder: Map`, holding the map body.
  `gh issue create --label "Wayfinder: Map"`.
- **Child ticket**: an issue linked to the map through GitHub's native
  sub-issues endpoints (`issues/{number}/sub_issues`), labelled
  `Wayfinder: <Type>` (`Research`, `Prototype`, `Grilling`, or `Task`), and
  assigned to the driving developer once claimed.
- **Blocking**: GitHub's native issue dependencies
  (`issues/{number}/dependencies/*`). A ticket is unblocked when every blocker
  is closed.
- **Frontier query**: list the map's open children, drop any with an open
  blocker or an assignee, and take the first in map order.
- **Claim**: assign the current authenticated user.
- **Resolve**: comment the answer, close the issue, then append a gist and link
  to the map's decisions.

For a private repository, use the Linear equivalents from the table above:
`save_issue` with a `Wayfinder: Map` label for the map, native `parentId` for
child tickets, native `blockedBy` for blocking, and `list_issues` filtered to
the map's open children for the frontier query.

## Reference vocabulary

Read references according to repository visibility:

- Public repositories use `#N` for current and historical GitHub issues or pull
  requests. Compose no `PAT-N` reference.
- Private repositories use `PAT-N` for current Linear issues. Their legacy
  `#N` and `PP-N` references remain read-only unless that repository documents
  a separate historical mapping.

Never rewrite history merely because a repository changes visibility. A
history rewrite requires an explicit migration plan, complete mapping, verified
backup, and force-push window.
