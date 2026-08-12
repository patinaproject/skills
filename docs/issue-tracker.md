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
disagreement in favor of GitHub.

The sync creates a comment thread whose replies publish to GitHub. Comments
outside the synced thread remain private.

## Triage roles

The vendored `triage` skill uses seven stable roles. That set is the whole
vocabulary; a repository works within it rather than adding a role of its own.
Translate every role through this adapter rather than assuming it is a label or
a lifecycle state.

Roles sit on two independent axes. A triaged issue carries exactly one
**category** role and exactly one **state** role. A transition replaces the
state role and preserves the category role.

| Role | Axis | Meaning | GitHub | Linear |
| --- | --- | --- | --- | --- |
| `bug` | category | Something is broken | label | label |
| `enhancement` | category | New feature or improvement | label | label |
| `needs-triage` | state | Maintainer evaluation is required | label, issue open | label, Triage |
| `needs-info` | state | Waiting for information | label, issue open | label |
| `ready-for-agent` | state | Ready for an implementation agent | label, issue open | label, `Todo` |
| `ready-for-human` | state | Requires human implementation | label, issue open | label, `Todo` |
| `wontfix` | state | Deliberately declined | label, issue closed | label, Canceled |

`wontfix` is terminal: it accompanies closure rather than sitting on open work.
`ready-for-agent` and `ready-for-human` are both written; each is applied
directly rather than read from the other's absence.

A status and a role are different axes. The status says where the issue sits;
the role says what triage decided. An issue that stays in the triage state while
carrying a role is normal: triage has finished and a person has not yet accepted
it. A person owns every triage-facing status change.

In vendored triage guidance, interpret "GitHub issue" as the canonical tracker
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

GitHub issues carry the roles above as repository labels, alongside open/closed
state. New public issues receive `needs-triage` unless they are already ready. A
ready issue stays open and carries `ready-for-agent` or `ready-for-human`. Close
duplicates with the duplicate reason and native relationship when available;
close deliberate non-work with `wontfix` and a rationale.

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

New work enters Triage. The roles above carry their Linear states, and duplicate
work uses Duplicate plus `duplicateOf`. Record a `wontfix` rationale on the
issue.

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
new decision and without missing evidence. Making an issue ready is a person's
decision. Whenever they make it, use the adapter to:

1. apply the provider's ready state — leave a GitHub issue open, or move a
   Linear issue to `Todo`;
2. write `ready-for-agent` or `ready-for-human`, replacing the previous state
   role and preserving the category role; and
3. set the planning fields together when the work belongs to a named effort —
   a GitHub milestone, or a Linear project and project milestone.

Triage sets the highest priority only when the evidence shows a live,
user-impacting fault. In every other case the priority stays unset until a
person chooses it. Record priority in the provider's priority field where it has
one, such as Linear's; never encode it as a label.

Releases describe what shipped, so the release pipeline owns them and readiness
leaves them alone. A blocked issue may still become ready — record its
dependency with the native blocked-by relationship.

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
- **Branch name:** return the selected provider's canonical branch name.
- **Labels:** load the live provider inventory. Apply the provider's mutation
  semantics rather than assuming labels append or replace.

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
