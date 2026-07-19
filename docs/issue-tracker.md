# Issue Tracker: Linear

Linear team PAT is the canonical issue tracker for patinaproject. This is the
only repository file that translates tracker-agnostic issue operations into a
specific provider. Every other doc and skill delegates tracker mechanics here.

## Conventions

Prefer the connected Linear MCP tools in interactive agent sessions:

| Operation                            | Linear MCP operation                                        |
| ------------------------------------ | ----------------------------------------------------------- |
| Create or update an issue            | `save_issue`                                                |
| Read an issue                        | `get_issue`                                                 |
| List or filter issues                | `list_issues`                                               |
| Search issue content                 | `search` with `type: "issue"`                               |
| Read comments                        | `list_comments`                                             |
| Add or update a comment              | `save_comment`                                              |
| List labels                          | `list_issue_labels`                                         |
| Create a label                       | `create_issue_label`                                        |
| Close, reopen, or change issue state | `save_issue` with `state`; use `duplicateOf` for duplicates |
| Read projects and milestones         | `get_project`, `list_milestones`, `get_milestone`           |
| Read releases and release notes      | `list_releases`, `get_release`, `get_release_note`          |
| Create or update release notes       | `save_release_note`                                         |

Use `PAT-N` identifiers in user-facing text and tool calls. Resolve remote
entities before mutating them. `save_issue.labels` replaces the complete label
set; read the current labels, merge additions and removals locally, then send
the full intended set. Pass `includeArchived: true` for exhaustive sweeps.

## Headless and GraphQL fallback

Headless agents and CI may use the hosted MCP server at
`https://mcp.linear.app/mcp` with `Authorization: Bearer <LINEAR_API_KEY>`.
Never write or print a credential.

When hosted MCP cannot express the needed operation, use Linear's GraphQL API
at `https://api.linear.app/graphql`. Pass a personal API key directly in the
`Authorization` header; OAuth tokens use `Authorization: Bearer <token>`. Keep
the same read-before-write and full-pagination rules, inspect GraphQL errors,
and fail rather than treating a partial response as complete.

## Tracker-agnostic skill operations

- **Publish to the issue tracker:** create the issue with `save_issue`, then
  verify the created issue and its native relationships.
- **Fetch the relevant ticket:** resolve one `PAT-N` identifier, call
  `get_issue` with relationships included, and call `list_comments` when the
  discussion matters. Treat a missing or ambiguous ticket as unresolved.
- **Start work:** self-assign only when unassigned, then move the issue to
  `In Progress` when it is not already started or completed.
- **Resolve work:** choose `Done`, `Canceled`, or `Duplicate` as appropriate.
  Record deliberate cancellation in a comment and set `duplicateOf` for a
  duplicate.
- **Relationships:** use `parentId`, `blockedBy`, `blocks`, and `relatedTo`.
  Never encode a native relationship only in body prose.
- **Branch name:** fetch the issue and use `gitBranchName` verbatim. Do not
  compose, shorten, or normalize it.

## Wayfinding operations

- **Map:** apply the `wayfinder:map` label.
- **Child ticket:** set the map issue as `parentId`.
- **Claim:** set `assignee: "me"`.
- **Block:** add the prerequisite `PAT-N` identifier to `blockedBy`.
- **Frontier:** list non-completed children with no assignee, then fetch each
  candidate with relationships included and exclude candidates with a
  non-completed blocker.
- **Resolve:** post the outcome, move the ticket to a completed state, then
  read the map description and append the result. Never replace earlier map
  results.

## Reference vocabulary

Read references according to their era; never rewrite history solely to change
an identifier:

- `PAT-N` — current Linear issue.
- `#NNNN` — legacy GitHub issue or pull request, read-only.
- `PP-N` — legacy Jira issue, read-only.

GitHub remains the forge for repositories and pull requests. GitHub Issues are
a locked legacy reference and are not an intake surface.
