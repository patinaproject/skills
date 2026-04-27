# issue edit procedure Workflow

**Goal:** Edit an existing GitHub issue in the current repository, routing each
field to the right API (REST via `gh issue edit`; GraphQL for relationships,
sub-issues, and close-with-reason). Validate every label, milestone, and
relationship target against the remote before any mutation, then apply the full
changeset behind a single approval gate.

---

## Checklist (use TodoWrite)

Create todos for each step before starting:

- [ ] Step 1: Resolve target repo + issue
- [ ] Step 2: Parse change request into a typed changeset
- [ ] Step 3: Validate changeset against remote
- [ ] Step 4: Probe GraphQL schema (cache results)
- [ ] Step 5: Confirm changeset with the user
- [ ] Step 6: Apply REST changes (`gh issue edit`)
- [ ] Step 7: Apply GraphQL changes (relationships, sub-issues, close/reopen)
- [ ] Step 8: Report final state

---

## Step 1: Resolve target

Resolve the current repo:

```bash
gh repo view --json nameWithOwner,visibility \
  --jq '{nameWithOwner, visibility}'
```

On non-zero exit or output that fails the regex
`^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$` for `nameWithOwner`, halt:

> "Could not resolve current repository — refusing to edit issue. Ensure the
> working directory has a configured `gh` remote and try again."

Store the result as `$repo` (with `$owner`, `$name`) and `$visibility`.

**Same-repo only.** If the user passed `-R other/repo`, or supplied the issue
as `owner/repo#N` with `owner/repo` not equal to `$repo`, refuse with the
verbatim message:

> `` `issue edit procedure` only edits issues in the current working directory's default `gh` repository. To edit in another repo, use `gh issue edit -R <other/repo>` directly. ``

**Resolve the issue.** Accept any of: `123`, `#123`, or a full
`https://github.com/<owner>/<repo>/issues/123` URL. Extract the number as `$N`.
If a URL was passed, the `<owner>/<repo>` portion must match `$repo` — if not,
refuse with the same cross-repo message above.

Confirm the issue exists:

```bash
gh issue view "$N" --json number,title,state,labels,milestone,assignees,url \
  --jq '{number,title,state,labels:[.labels[].name],milestone:.milestone.title,assignees:[.assignees[].login],url}'
```

On non-zero exit, halt:

> "Issue #$N not found in $repo — refusing."

Store the result as `$current`.

---

## Step 2: Parse change request

Turn the user's free-form request into a typed changeset. Build one row per
field the user wants to touch:

| Field | Operation | Value |
|---|---|---|
| `title` | `set` | new title |
| `body` | `set` | new body (full replacement) |
| `labels` | `add` / `remove` | label name(s) |
| `assignees` | `add` / `remove` | login(s) |
| `milestone` | `set` / `clear` | milestone title or `""` |
| `state` | `close` / `reopen` | optional `stateReason` (`COMPLETED`, `NOT_PLANNED`, `DUPLICATE`) |
| `sub-issue-of` | `add` / `remove` | parent `#N` |
| `blocked-by` | `add` / `remove` | target `#N` |
| `blocks` | `add` / `remove` | target `#N` |
| `related-to` | `add` | target `#N` (body-prose append) |

If any element of the request is ambiguous (e.g. "fix the labels", "tidy the
title"), do NOT guess. Ask the user to disambiguate. If they decline to clarify,
refuse:

> "Change request is ambiguous — refusing. Restate which fields to change and
> the exact new values."

For any relationship row, reject the cross-repo `owner/repo#N` form on input
with the same cross-repo refusal message from Step 1.

---

## Step 3: Validate against remote

**Precondition:** changeset built (Step 2 complete). Validate every referenced
value against the remote *before* any mutation. If any check fails, halt with
the relevant refusal message — do not proceed to Step 4.

**Labels.** If the changeset touches labels, fetch the remote inventory:

```bash
gh label list --json name,description --jq '.[].name'
```

Filter Dependabot-reserved labels (`javascript`, `github_actions`) out of any
user-facing list. For every label the user wants to add or remove, check it
exists on the remote. If absent, refuse:

> "Label `{label}` does not exist on $repo — refusing. Run
> `gh label create {label} …` first, or remove it from the changeset."

**Milestone.** If the changeset sets a milestone, fetch the open list:

```bash
gh api repos/:owner/:repo/milestones \
  --jq '.[] | select(.state=="open") | .title'
```

If the requested title is absent, refuse:

> "Milestone `{title}` is not an open milestone on $repo — refusing. Open
> milestones: {list}. Use `gh api -X POST repos/:owner/:repo/milestones -f title='…'`
> to create it first, or choose an existing one."

This validation is repeated immediately before the apply step (Step 6) to
handle open→closed races between draft and apply.

**Relationship targets.** For every `sub-issue-of`, `blocked-by`, `blocks`, or
`related-to` `#N`, resolve the node ID via GraphQL:

```bash
gh api graphql \
  -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){issue(number:$n){id}}}' \
  -F o="$owner" -F r="$name" -F n="$N" \
  --jq '.data.repository.issue.id'
```

If any resolution returns `null` or empty string, refuse:

> "Issue #$N does not exist in $repo — refusing. Relationships are same-repo
> only (#N format; no owner/repo prefix)."

Record each resolved `targetNodeId` alongside its row in the changeset.

---

## Step 4: Probe GraphQL schema

**Precondition:** validation passed (Step 3 complete). Probe each schema-gated
mutation **once per run** and cache the result. Do NOT call any schema-gated
mutation later without first consulting the cached flag.

**`addIssueDependency`** — gates `blocked-by` / `blocks`:

```bash
gh api graphql \
  -f query='{ __type(name:"Mutation"){ fields{ name } } }' \
  --jq '.data.__type.fields[].name' | grep -qx 'addIssueDependency'
```

- Exit 0 → `$depSupported = true`
- Non-zero → `$depSupported = false`. Body-prose fallback applies: append
  `Blocked by #N` and/or `Blocks #N` lines to the issue body's `## Context`
  section (or, if no `## Context` section exists, append them as a trailing
  paragraph). Warn the user up front:

  > "Note: `addIssueDependency` is not available in this GitHub instance's
  > GraphQL schema. Dependency relationships will be added as body-prose
  > fallback (`Blocked by #N` / `Blocks #N`)."

**`addSubIssue`** — gates `sub-issue-of`:

```bash
gh api graphql \
  -f query='{ __type(name:"Mutation"){ fields{ name } } }' \
  --jq '.data.__type.fields[].name' | grep -qx 'addSubIssue'
```

- Exit 0 → `$subIssueSupported = true`
- Non-zero → `$subIssueSupported = false`. **No body-prose fallback exists**
  for sub-issues — there is no community convention. Refuse the sub-issue row
  with:

  > "`addSubIssue` is not available in this GitHub instance's GraphQL schema
  > and no body-prose fallback exists for sub-issues. Drop the
  > `sub-issue-of #N` row from the changeset to proceed, or run this skill
  > against an instance that supports the mutation."

  Other rows in the changeset may still proceed if the user removes the
  sub-issue row.

**`closeIssue` with `stateReason`** — gates close-with-reason. `closeIssue`
itself is long-standing; the `stateReason` input field is the part that
matters. Probe the input shape:

```bash
gh api graphql \
  -f query='{ __type(name:"CloseIssueInput"){ inputFields{ name } } }' \
  --jq '.data.__type.inputFields[].name' | grep -qx 'stateReason'
```

- Exit 0 → `$closeReasonSupported = true`
- Non-zero → `$closeReasonSupported = false`. Body-prose fallback **does not
  apply** to close reasons. Instead, fall back to `gh issue close` (no reason
  preserved) and warn the user:

  > "Note: `stateReason` is not available on `CloseIssueInput` in this GitHub
  > instance. The issue will be closed via `gh issue close` without a
  > recorded reason."

  For close-without-reason (and for reopen), always fall back to
  `gh issue close` / `gh issue reopen` regardless of the cached flag — the
  flag only matters when a reason is supplied.

---

## Step 5: Confirm

**Precondition:** schema probe complete (Step 4). Render the full changeset
summary in a single block and wait for `approve` / `revise` / `cancel`. Allow
up to 3 revise cycles, then halt with:

> "Maximum revise cycles reached — refusing. Re-run the skill with a fresh
> request."

Summary template:

```text
**Repo:** $repo
**Issue:** #$N — {current title}
**URL:** {current url}

Changeset:
- title: "{old}" → "{new}"            (if title in changeset)
- body: <replace> ({N} lines)         (if body in changeset)
- labels: +[a, b] -[c]                (if labels in changeset)
- assignees: +[alice] -[bob]          (if assignees in changeset)
- milestone: "{old}" → "{new}"        (if milestone in changeset)
- state: close (reason: NOT_PLANNED)  (if state in changeset)
- sub-issue-of: +#42                  (if relationships in changeset)
- blocked-by: +#101 -#99              (if relationships in changeset)
- blocks: +#200                       (if relationships in changeset)
- related-to: +#300 (body prose)      (if relationships in changeset)

Schema fallbacks active:
- addIssueDependency unavailable → body-prose fallback for blocked-by/blocks
- stateReason unavailable → close without reason
(omit this block if no fallbacks active)

Approve to apply, revise to change, or cancel to abort.
```

On `cancel`, exit cleanly with no mutations.

---

## Step 6: Apply REST changes

**Precondition:** approval received. Re-run the milestone open-list check from
Step 3 immediately before the milestone mutation (race guard).

Use `gh issue edit` for the fields the REST CLI covers cleanly. Build one
invocation per field touched (or batch when the CLI accepts it):

| Field | Command |
|---|---|
| title | `gh issue edit "$N" --title "<new>"` |
| body | `gh issue edit "$N" --body "<new>"` |
| labels (add) | `gh issue edit "$N" --add-label "<a>,<b>"` |
| labels (remove) | `gh issue edit "$N" --remove-label "<c>"` |
| assignees (add) | `gh issue edit "$N" --add-assignee "<alice>"` |
| assignees (remove) | `gh issue edit "$N" --remove-assignee "<bob>"` |
| milestone (set) | `gh issue edit "$N" --milestone "<title>"` |
| milestone (clear) | `gh issue edit "$N" --remove-milestone` |

Capture each command's exit code. On non-zero exit for any single command,
halt and report which row failed; do not roll back prior REST changes (they
are already applied to the remote). State that the GraphQL portion of the
apply step (Step 7) was skipped due to the failure.

If the schema probe in Step 4 returned `$depSupported = false` and the
changeset includes `blocked-by` / `blocks`, append the body-prose fallback
**now** as part of the body update (not in Step 7) — adjust the body shown in
Step 5 to include the `Blocked by #N` / `Blocks #N` lines and run
`gh issue edit "$N" --body "<new>"` once with the merged body.

---

## Step 7: Apply GraphQL changes

**Precondition:** REST changes applied (Step 6). Resolve the issue's node ID:

```bash
gh api graphql \
  -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){issue(number:$n){id}}}' \
  -F o="$owner" -F r="$name" -F n="$N" \
  --jq '.data.repository.issue.id'
```

Store as `$issueNodeId`. Then walk each row in turn.

**`sub-issue-of` add** (only if `$subIssueSupported = true`):

```bash
gh api graphql \
  -f query='mutation($p:ID!,$c:ID!){ addSubIssue(input:{issueId:$p,subIssueId:$c}){ issue{ number } } }' \
  -F p="$parentNodeId" -F c="$issueNodeId"
```

**`sub-issue-of` remove**:

```bash
gh api graphql \
  -f query='mutation($p:ID!,$c:ID!){ removeSubIssue(input:{issueId:$p,subIssueId:$c}){ issue{ number } } }' \
  -F p="$parentNodeId" -F c="$issueNodeId"
```

**`blocked-by` add** (only if `$depSupported = true`; uses enum literal
`BLOCKED_BY`):

```bash
gh api graphql \
  -f query='mutation($s:ID!,$d:ID!,$t:IssueRelationshipType!){ addIssueDependency(input:{subjectId:$s,dependencyId:$d,dependencyType:$t}){ subject{ number } } }' \
  -F s="$issueNodeId" -F d="$targetNodeId" -F t="BLOCKED_BY"
```

**`blocks` add** (uses enum literal `BLOCKS`):

```bash
gh api graphql \
  -f query='mutation($s:ID!,$d:ID!,$t:IssueRelationshipType!){ addIssueDependency(input:{subjectId:$s,dependencyId:$d,dependencyType:$t}){ subject{ number } } }' \
  -F s="$issueNodeId" -F d="$targetNodeId" -F t="BLOCKS"
```

**Either dependency remove**:

```bash
gh api graphql \
  -f query='mutation($s:ID!,$d:ID!,$t:IssueRelationshipType!){ removeIssueDependency(input:{subjectId:$s,dependencyId:$d,dependencyType:$t}){ subject{ number } } }' \
  -F s="$issueNodeId" -F d="$targetNodeId" -F t="BLOCKED_BY"
```

If `$depSupported = false`, dependency rows were already merged into the body
in Step 6 — skip the GraphQL call and report the body-prose fallback for each
row.

**`related-to`** — append `Relates to #N` to the issue body (body-prose only;
GitHub auto-creates a CrossReferencedEvent). Merge into the body update in
Step 6 the same way as `blocked-by` / `blocks` fallback.

**`state: close` with `stateReason`** (only if `$closeReasonSupported = true`):

```bash
gh api graphql \
  -f query='mutation($id:ID!,$r:IssueClosedStateReason!){ closeIssue(input:{issueId:$id,stateReason:$r}){ issue{ number state stateReason } } }' \
  -F id="$issueNodeId" -F r="NOT_PLANNED"
```

The example above uses `NOT_PLANNED`. Substitute `COMPLETED` or `DUPLICATE`
when the user requested those.

**`state: close` without `stateReason`**, or when `$closeReasonSupported = false`:

```bash
gh issue close "$N"
```

When falling back due to `$closeReasonSupported = false`, surface the
fallback warning from Step 4 again so the user is reminded the reason was
dropped.

**`state: reopen`** — always uses the REST CLI (no reason to preserve):

```bash
gh issue reopen "$N"
```

On any GraphQL mutation error: warn, print the manual-retry command, and
**continue with the remaining rows**. Do not roll back the issue or any
prior change.

---

## Step 8: Report

Print a single block summarizing what was applied:

```text
Edited issue: {url}

Applied:
- title: <updated>
- labels: +[a] -[c]
- milestone: "{new}"
- state: closed (reason: NOT_PLANNED)
- sub-issue-of: +#42 (mutation)
- blocked-by: +#101 (mutation)

Fallbacks used:
- blocks #200 → body prose (addIssueDependency unavailable)
- close without reason → gh issue close (stateReason unsupported)

Failures (manual retry suggested):
- (none)
```

Omit the **Fallbacks used** and **Failures** sub-blocks when empty.

---

## Refusal Conditions

Stop and do NOT mutate if:

1. The user passed `-R other/repo`, or supplied an issue as `owner/repo#N`
   where `owner/repo` is not the resolved repo — emit the verbatim cross-repo
   refusal message:

   > `` `issue edit procedure` only edits issues in the current working directory's default `gh` repository. To edit in another repo, use `gh issue edit -R <other/repo>` directly. ``

2. `gh repo view` returned non-zero or malformed output — emit the repo
   resolution failure message from Step 1.
3. The issue does not exist (`gh issue view` non-zero) — emit the issue
   not-found message from Step 1.
4. A label in the changeset is not on the remote — emit the label not-found
   message from Step 3.
5. A milestone in the changeset is not an open milestone on the remote —
   emit the milestone not-found message from Step 3 (or its re-check in
   Step 6).
6. A relationship target `#N` does not resolve via GraphQL — emit the
   relationship not-found message from Step 3.
7. The user typed `owner/repo#N` for a relationship target — emit the
   cross-repo refusal.
8. `addSubIssue` is unavailable and the changeset contains a `sub-issue-of`
   row — emit the sub-issue-not-supported message from Step 4.
9. The user attempts an ambiguous request and declines to disambiguate —
   emit the ambiguous-request refusal from Step 2.
10. Maximum revise cycles (3) reached at Step 5 — halt cleanly.

---

## Quick Reference

| Step | Action | Blocks on |
|------|--------|-----------|
| 1 | Resolve repo + issue | Cross-repo → refuse; bad `gh repo view` → halt |
| 2 | Parse change request | Ambiguous → refuse if user won't clarify |
| 3 | Validate labels / milestones / relationship targets | Any miss → refuse |
| 4 | Probe `addIssueDependency`, `addSubIssue`, `CloseIssueInput.stateReason` | `addSubIssue` miss + sub-issue row → refuse that row |
| 5 | Confirm changeset | Wait for approve / revise (≤3) / cancel |
| 6 | Apply REST edits + body-prose fallbacks | REST error → halt; report |
| 7 | Apply GraphQL mutations | Mutation error → warn + manual retry; continue |
| 8 | Report | Always — even on partial apply |

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Calling `gh issue close` when a reason was supplied | Use the `closeIssue` GraphQL mutation with `stateReason` |
| Calling `addIssueDependency` without probing the schema | Probe once at Step 4 and cache `$depSupported` |
| Calling `addSubIssue` without probing the schema | Probe once at Step 4 and cache `$subIssueSupported` |
| Assuming `BLOCKED_BY` / `BLOCKS` are strings | They are `IssueRelationshipType!` enum literals — pass via `-F t="BLOCKED_BY"` |
| Hardcoding label or milestone lists | Always read from `gh label list` / `gh api …/milestones` at runtime |
| Editing across repos with `-R` | Refuse with the verbatim cross-repo message and point to `gh issue edit -R` |
| Skipping the milestone re-check before apply | Re-validate at Step 6 (race guard between draft and apply) |
| Rolling back the issue when a Step 7 mutation fails | Never roll back; warn + manual-retry and continue |
| Using `--` (double hyphen) or `—` (em dash) in body-prose fallback lines | Use plain text `Blocked by #N` / `Blocks #N` — no decorative dashes |
| Treating `closeIssue` as missing because the probe failed | The probe targets `CloseIssueInput.stateReason`, not the mutation itself — `closeIssue` exists; the reason field may not |
| Asking the user to approve each row individually | One approval gate covers the whole changeset (Step 5) |
