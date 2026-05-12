# new issue procedure Workflow

**Goal:** Create a well-structured GitHub issue using
`docs/issue-filing-style.md` as the single source of truth for issue-filing
conventions, while this workflow retains the procedural `gh`-driven steps.
Authoritative inputs: `docs/issue-filing-style.md` for filing policy and
`gh label list` for the canonical remote label inventory.

This workflow is an extension of the patinaproject `/new-issue` reference. It
adds two behaviors: a **duplicate check** (Step 3) and a **public-repo leak
guard** (sub-step inside Steps 7 and 8).

---

## Checklist (use TodoWrite)

Create todos for each step before starting:

- [ ] Step 1: Load label list from `gh label list`
- [ ] Step 2: Gather problem description from user
- [ ] Step 3: Duplicate check (search remote, offer comment / file new / abort)
- [ ] Step 4: Suggest and confirm labels
- [ ] Step 5: Capture milestone
- [ ] Step 6: Capture relationships
- [ ] Step 7: Draft and present issue body for approval (with leak guard)
- [ ] Step 8: Pre-creation checks (with leak guard)
- [ ] Step 9: Create issue with gh issue create
- [ ] Step 10: Apply queued relationship mutations

---

## Step 1: Load Labels

Fetch the remote label inventory from the current working directory's default
`gh` repository:

```bash
gh label list --json name,description --jq '.'
```

**After extraction, assert:**

1. The command exits zero.
2. The JSON parses successfully.
3. The list is non-empty.
4. Every label has a non-empty `name`.

If any assertion fails, halt:

> `Could not load remote labels with gh label list — refusing to proceed.`

Use each label's `description` to guide selection. If one or more labels have
an empty description, warn but continue:

> `Warning: some remote labels have empty descriptions; label suggestions may be less precise.`

Do NOT hardcode any label names — derive all values from `gh label list` every
run. A local `.github/LABELS.md` file may exist for repository documentation,
but it is not required by this workflow and must not block issue creation.

---

## Step 2: Gather Intent

If the user has not provided a description, ask:

> "What is the problem or goal you want to capture in this issue?
> A sentence or two is fine."

Apply `docs/issue-filing-style.md` from this point onward.

Wait for the response before proceeding.

---

## Step 3: Duplicate check

**Precondition:** the user has provided a description (Step 2 complete).

Before drafting, search the remote for likely duplicates so the user can choose
to extend an existing thread rather than file a new one.

**3a. Extract 3-5 key terms from the description.**

- Drop stopwords (`the`, `a`, `an`, `and`, `or`, `to`, `of`, `for`, `is`, `in`,
  `on`, `with`, `that`, `this`, `it`, `be`, `as`, `by`, `at`, etc.).
- Prefer nouns and verbs. Lowercase everything.
- Cap at 5 terms; if the description has fewer than 3 content tokens, use what
  is available.

Store the resulting list as `$terms` and the space-joined form as
`$termsJoined`.

**3b. Run two `gh issue list --search` passes and merge results.**

```bash
# Title-restricted pass
gh issue list --search "$termsJoined in:title" --state all \
  --json number,title,state,url

# Full-text pass
gh issue list --search "$termsJoined" --state all \
  --json number,title,state,url
```

Merge both result sets and deduplicate by `number`.

**3c. Score candidates by title-token overlap.**

For each candidate, lowercase its title, split on non-alphanumerics, drop
stopwords, and count how many of `$terms` appear. Surface only candidates with
**at least 2 overlapping non-stopword tokens**. Sort by overlap count (highest
first), then by issue number (newest first) on ties.

If no candidate clears the threshold, proceed to Step 4 silently.

**3d. Present candidates and offer three options.**

> "Possible duplicates of what you described:
>
> 1. #{N} {title} ({state}) — {url}
> 2. #{N} {title} ({state}) — {url}
> ...
>
> How would you like to proceed?
> (a) Comment a follow-up on #{top-N} with this new context (default).
> (b) Continue and file a new issue anyway.
> (c) Abort."

Default to **(a)** if the user replies with no explicit choice.

**Option (a) — Comment a follow-up.** Build a short comment body summarizing
the new context the user provided in Step 2, then run:

```bash
gh issue comment <N> --body "<comment body>"
```

Capture the comment URL from stdout, report it to the user, and **stop the
workflow**. Do not proceed to Step 4.

**Option (b) — File new anyway.** Proceed to Step 4 with a one-line
acknowledgement (`Continuing — will file a new issue.`).

**Option (c) — Abort.** Stop the workflow; do not call any mutating command.

---

## Step 4: Suggest and Confirm Labels

**Precondition:** duplicate check resolved with option (b) (Step 3).

Filter the inventory using `docs/issue-filing-style.md` before presenting it:

- Remove Dependabot-reserved labels (`javascript`, `github_actions`).
- Suggest zero or more labels that fit.

Based on the description, suggest relevant labels from the filtered list.
Present as a numbered list so the user can confirm, adjust, or skip entirely:

> "Suggested labels: {suggested labels, each backtick-quoted}
>
> Available labels: {filtered labels, comma-separated, each backtick-quoted}
>
> Confirm, adjust, or say 'none' to file without labels."

If the user says "none" or skips, proceed with an empty label set.

Do NOT suggest labels not in the filtered list.

---

## Step 5: Capture Milestone

**Precondition:** labels confirmed (Step 4 complete).

**If `$milestoneArg` was supplied in the invocation args**, skip the prompt:

- Set `$milestone := $milestoneArg.trim()`.
- Proceed to the validation check below.

**Otherwise**, fetch open milestones from the remote:

```bash
gh api repos/:owner/:repo/milestones --jq '.[] | select(.state=="open") | .title'
```

If this command exits non-zero, halt:

> "Could not fetch milestone list — refusing to proceed. Ensure `gh` is
> authenticated and the remote is reachable."

If the remote list is empty (no open milestones), advise:

> "No open milestones on remote — filing without a milestone."

Then set `$milestone := ""` and proceed to Step 6.

Otherwise, present results as a numbered list plus a `none` option. Also accept
a free-form title typed directly. Normalize the user's choice: `trim()` the
value. If the user answers `none` or leaves blank, set `$milestone := ""` and
proceed.

**Validate:** If `$milestone` is non-empty AND NOT in the remote open-milestone
list, refuse:

> "Milestone `{title}` not found on remote. Open milestones: {list}. Use
> `gh api -X POST repos/:owner/:repo/milestones -f title='...'` to create it
> first, or choose an existing one."

Store `$milestone` for use in the Step 7 preview and the Step 9 `--milestone`
flag. Canonical milestone, assignee, project, and relationship conventions live
in `docs/issue-filing-style.md`.

---

## Step 6: Capture Relationships

**Precondition:** milestone captured (Step 5 complete).

**Prompt the user:**

> "Link related issues? Enter one relationship per line, or `none` / `done` to
> finish. Same-repo only — use `#N` format (no `owner/repo` prefix).
>
> Format: `<sub-issue-of|blocked-by|blocks|related-to> #N[, #N...]`
> Examples: `sub-issue-of #723`, `blocks #889, #900`, `related-to #642`"

Collect answers until the user answers `none` (on the first answer) or `done`
(after at least one entry). Build `$relationships[]` as an in-memory queue of
`{type, targetNodeId, targetNumber}` tuples.

**For each `#N` entered**, resolve the node ID via GraphQL:

```bash
gh api graphql \
  -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){issue(number:$n){id}}}' \
  -F o=<owner> -F r=<repo> -F n=<N> \
  --jq '.data.repository.issue.id'
```

If the user typed `owner/repo#N` (cross-repo format), refuse immediately:

> "Issue `owner/repo#N` uses a cross-repo format — refusing. Same-repo only.
> Use `#N` with no owner/repo prefix."

If any resolution returns `null` or empty string, refuse:

> "Issue #N does not exist in {owner/repo} — refusing. Relationships are
> same-repo only (#N format; no owner/repo prefix)."

**For each `related-to` entry**, append `Relates to #N` to `$contextSuffix`
(a running string later appended to the `## Context` body section in Step 7).
GitHub has no native "related-to" mutation — the `Relates to #N` reference in
the body causes GitHub to create a CrossReferencedEvent automatically.

**Probe `addIssueDependency` availability once** and cache as `$depSupported`:

```bash
gh api graphql \
  -f query='{ __type(name:"Mutation"){ fields{ name } } }' \
  --jq '.data.__type.fields[].name' | grep -qx 'addIssueDependency'
```

- Exit 0 → `$depSupported = true`
- Non-zero → `$depSupported = false`

If `$depSupported = false` and the user entered any `blocked-by` or `blocks`
relationship, warn now so the user is aware before draft review:

> "Note: `addIssueDependency` is not available in this GitHub instance's
> GraphQL schema. Dependency relationships will be added as body-prose fallback
> (`Blocked by #N` / `Blocks #N`) in the `## Context` section."

---

## Step 7: Draft and Present

Draft the issue body using `docs/issue-filing-style.md` as the single source of
truth for filing policy. Use this baseline layout:

```markdown
## Problem

{Describe the current state and why it is a problem. Be concrete. Do not
prescribe the implementation here unless the technology is genuinely
load-bearing.}

## Proposal

{Desired behavior or solution. Include examples, sketches, or API shapes if helpful.}

## Non-Goals / Implementation Notes

{Optional. Record preferences, constraints, or likely directions without locking
the implementation. Omit if it adds no value.}

## Acceptance Criteria

- Given {precondition}, when {action}, then {observable outcome}.
- Given {precondition}, when {action}, then {observable outcome}.

## Context

{Related issues (#N), PRs, or background. Leave blank if none.}

## Out of Scope

{What this issue explicitly does NOT cover.}
```

Rules:

- Every Acceptance Criterion must use Given/When/Then format.
- Include at least one AC.
- Keep "Out of Scope" present even if brief.
- `## Non-Goals / Implementation Notes` is optional; do not add other unlisted
  sections.
- If `$contextSuffix` is non-empty (from `related-to` entries in Step 6),
  append it to the `## Context` section before presenting the draft.
- If `$depSupported = false` and any `blocked-by`/`blocks` entries exist, also
  append `Blocked by #N` / `Blocks #N` lines to `## Context`.

Resolve the target repository before presenting the draft:

```bash
gh repo view --json nameWithOwner,visibility \
  --jq '{nameWithOwner, visibility}'
# Capture stdout AND the exit code.
```

On non-zero exit, halt immediately:

> "Could not resolve current repository — refusing to create issue. Ensure the
> working directory has a configured `gh` remote and try again."

Validate the resolved `nameWithOwner` against the pattern
`^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$`. If it does not match (empty, error text,
or malformed), halt with the same message.

Store `$visibility` (one of `PUBLIC`, `PRIVATE`, `INTERNAL`) for the leak
guard below.

### Public-repo leak guard (Step 7)

Run **before** presenting the draft. The body content can change again during
revision cycles, so this is repeated in Step 8.

1. If `$visibility != PUBLIC`, skip the leak guard.
2. Otherwise, scan the draft body for:
   - URL-shaped tokens matching `https://github.com/<org>/<repo>/...`. For
     each unique `<org>/<repo>` discovered, run:

     ```bash
     gh repo view -R <org>/<repo> --json visibility --jq .visibility
     ```

     Treat exit-non-zero / 404 / `PRIVATE` as a **leak**.
   - File paths inside fenced code blocks that are shaped like a private-repo
     filesystem path (e.g. paths beginning with a known private-repo directory
     name, or matching `git remote get-url origin` of any locally-known
     private repo). When the shape is suspicious but not provable, treat as
     **ambiguous** rather than a confirmed leak.
3. **On confirmed leak**, refuse:

   > `Public-repo leak guard: the draft body references {private-repo|path},
   > but this issue is being filed against a PUBLIC repository. Please rewrite
   > to a public-safe summary, or file in a private mirror first.`

4. **On ambiguous detection**, do not silently rewrite. Warn the user and ask
   for a review pass:

   > "Public-repo leak guard: the draft body contains content that may
   > reference a private repository ({example}). This issue is being filed
   > against a PUBLIC repository. Please review and confirm the content is
   > public-safe, or rewrite before continuing."

Only continue to the draft presentation when the leak guard passes (or the
user explicitly resolves the ambiguous warning by editing the draft).

Present the draft including the confirmed repo, milestone, and relationships:

> "**Repo:** {resolved nameWithOwner} ({visibility})
> **Title:** {proposed title}
> **Labels:** {confirmed labels, or 'none'}
> **Milestone:** {$milestone or 'none'}
> **Relationships:** {summary e.g. 'sub-issue-of #723; blocks #889, #900; related-to #642', or 'none'}
>
> {body}
>
> Approve to create in **{resolved nameWithOwner}**, or give feedback to revise."

Wait for approval or feedback. Revise and re-present if needed (max 3 cycles).
Draft approval covers title, labels, milestone, relationships, and body
together. After any revision, re-run the Step 7 leak guard.

If the user asks to create the issue in a different repository, refuse:

> `` `new issue procedure` only creates issues in the current working directory's default `gh` repository. To create in another repo, use `gh issue create -R <other/repo>` directly. ``

---

## Step 8: Pre-Creation Checks

Before calling `gh issue create`, perform these checks in order:

**Cross-repo guard:** Confirm the resolved repo from Step 7 matches the
current working directory's `gh` default. If a user attempts to pass
`-R other/repo`, refuse with:

> `` `new issue procedure` only creates issues in the current working directory's default `gh` repository. To create in another repo, use `gh issue create -R <other/repo>` directly. ``

**Dependabot-reserved label check:** If the user somehow selected `javascript`
or `github_actions` (e.g., typed it manually), refuse immediately:

> "`{label}` is a Dependabot-only label — not available via
> `new issue procedure`. Pick a different label or proceed with none."

**Remote label existence check:** If any labels were chosen, reuse the Step 1
remote label inventory. If the inventory needs refreshing, run:

```bash
gh label list --json name --jq '.[].name'
```

Intersect chosen labels against the remote list. If any chosen label is absent
on remote, refuse:

> "Label `{label}` does not exist on the remote repo. Run
> `gh label create {label} ...` first, or remove it from the selection."

**Remote milestone existence re-check:** If `$milestone` is non-empty,
re-validate that it still exists as an open milestone:

```bash
gh api repos/:owner/:repo/milestones \
  --jq '.[] | select(.state=="open") | .title' \
  | grep -Fxq "$milestone"
```

If absent (milestone was closed or deleted between Step 5 and now), refuse:

> "Milestone `{title}` not found on remote. Open milestones: {list}. Use
> `gh api -X POST .../milestones` to create it first, or choose an existing
> one."

Also confirm the resolved repo from Step 7 has not changed. If a `--repo`/`-R`
flag targeting a different repo is present in the constructed command, refuse
with the cross-repo message.

### Public-repo leak guard (Step 8)

The body may have been revised between Step 7 and now. Re-run the same scan:

1. Re-fetch visibility:

   ```bash
   gh repo view --json visibility --jq .visibility
   ```

2. If `PUBLIC`, scan the (possibly revised) draft body for
   `https://github.com/<org>/<private-repo>/...` URLs (probe each unique
   `<org>/<repo>` with `gh repo view -R <org>/<repo> --json visibility`;
   treat 404 or `PRIVATE` as a leak) and for private-repo-shaped file paths
   inside fenced code blocks.
3. **On confirmed leak**, refuse with the same message:

   > `Public-repo leak guard: the draft body references {private-repo|path},
   > but this issue is being filed against a PUBLIC repository. Please rewrite
   > to a public-safe summary, or file in a private mirror first.`

4. **On ambiguous detection**, warn and ask for review (do not silently
   rewrite). Loop back to Step 7 for one more revision cycle if the user
   wants to edit; otherwise abort.

Only proceed to Step 9 if all checks (including leak guard) pass.

---

## Step 9: Create Issue

Build the label string (comma-separated, no spaces around commas) from the
confirmed label set.

Construct the command:

```bash
gh issue create \
  --title "<title>" \
  --body "<body>" \
  [--label "<label1>[,<label2>...]"] \
  [--milestone "<milestone>"]
```

- Include `--label` only if labels were chosen.
- Include `--milestone "$milestone"` only if `$milestone` is non-empty.
- If no labels were chosen, first announce:

  > "Advisory: no labels chosen — issue will be filed unlabeled."

  Zero labels is a valid happy path; advise but never block.

Run the command. Capture stdout (the issue URL). Extract the new issue number
via regex matching `/issues/(\d+)$` against the URL.

Report the issue URL to the user.

---

## Step 10: Apply Relationship Mutations

**Skip this entire step if `$relationships[]` is empty** (user answered `none`
at Step 6 or entered no relationships).

**Resolve the new issue's node ID:**

```bash
gh api graphql \
  -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){issue(number:$n){id}}}' \
  -F o=<owner> -F r=<repo> -F n=<new-issue-number> \
  --jq '.data.repository.issue.id'
```

Store the result as `$newIssueNodeId`.

**For each `{type, targetNodeId, targetNumber}` in `$relationships[]`:**

**`sub-issue-of`** — call `addSubIssue` with the parent's node ID as `$p` and
the new issue's node ID as `$c`:

```bash
gh api graphql \
  -f query='mutation($p:ID!,$c:ID!){ addSubIssue(input:{issueId:$p,subIssueId:$c}){ issue{ number } } }' \
  -F p="$targetNodeId" -F c="$newIssueNodeId"
```

On success, report:
`"Linked: new issue is a sub-issue of #$targetNumber (mutation)."`
On error, warn and provide manual-retry command — do NOT delete the created
issue:

> "`addSubIssue` for #$targetNumber failed. Retry manually:
> `gh api graphql -f query='mutation($p:ID!,$c:ID!){ addSubIssue(input:{issueId:$p,subIssueId:$c}){ issue{ number } } }' -F p=<parentNodeId> -F c=<newIssueNodeId>`"

**`blocked-by`** — if `$depSupported = true`, call `addIssueDependency` with
enum `BLOCKED_BY` (new issue is subject, target is dependency):

```bash
gh api graphql \
  -f query='mutation($s:ID!,$d:ID!,$t:IssueRelationshipType!){ addIssueDependency(input:{subjectId:$s,dependencyId:$d,dependencyType:$t}){ subject{ number } } }' \
  -F s="$newIssueNodeId" -F d="$targetNodeId" -F t="BLOCKED_BY"
```

On success, report:
`"Linked: new issue is blocked by #$targetNumber (mutation)."`
On error, warn + manual-retry. Do NOT delete the created issue.
If `$depSupported = false`, skip mutation and report:

> `"blocked-by #$targetNumber recorded as body-prose fallback (addIssueDependency unavailable)."`

**`blocks`** — if `$depSupported = true`, call `addIssueDependency` with enum
`BLOCKS` (new issue is subject, target is dependency):

```bash
gh api graphql \
  -f query='mutation($s:ID!,$d:ID!,$t:IssueRelationshipType!){ addIssueDependency(input:{subjectId:$s,dependencyId:$d,dependencyType:$t}){ subject{ number } } }' \
  -F s="$newIssueNodeId" -F d="$targetNodeId" -F t="BLOCKS"
```

On success, report:
`"Linked: new issue blocks #$targetNumber (mutation)."`
On error, warn + manual-retry. Do NOT delete the created issue.
If `$depSupported = false`, skip mutation and report:

> `"blocks #$targetNumber recorded as body-prose fallback (addIssueDependency unavailable)."`

**`related-to`** — already written to `## Context` body section in Step 7 via
`$contextSuffix`. Nothing to mutate. Report:

> `"related-to #$targetNumber recorded as body-prose (Relates to #N in ## Context — GitHub will create a CrossReferencedEvent automatically)."`

---

## Refusal Conditions

Stop and do NOT call `gh issue create` if:

1. User requested creation in a different repository (cross-repo attempt) —
   emit:
   `` `new issue procedure` only creates issues in the current working directory's default `gh` repository. To create in another repo, use `gh issue create -R <other/repo>` directly. ``
2. User selected a Dependabot-reserved label (`javascript` or
   `github_actions`) — emit the Dependabot-only refusal from Step 8.
3. `gh repo view` returned a non-zero exit code or malformed output — emit
   the repo resolution failure message from Step 7.
4. A chosen milestone is not in the remote open-milestones list — emit the
   milestone not-found refusal from Step 5 (or Step 8 re-check).
5. Any issue number in a relationship does not resolve via GraphQL, or the
   user typed a cross-repo `owner/repo#N` format — emit the refusal from
   Step 6.
6. `gh label list` fails, returns malformed JSON, or returns no labels — emit
   the remote-label halt message from Step 1.
7. **Public-repo leak guard fired** (Step 7 or Step 8): the draft body
   references a private repository or private-repo-shaped path while the
   target repo visibility is `PUBLIC`. Emit the leak-guard refusal and ask
   the user to rewrite to a public-safe summary, or to file in a private
   mirror first.
8. The user chose option (c) **abort** at the Step 3 duplicate check.

---

## Quick Reference

| Step | Action | Blocks on |
|------|--------|-----------|
| 1 | Read labels with `gh label list` | Command failure, malformed JSON, or empty list → halt |
| 2 | Get description | No response → wait |
| 3 | Duplicate check (gh issue list --search) | Comment / file new / abort prompt; abort stops the workflow |
| 4 | Suggest + confirm labels | Optional; zero is fine (no labels chosen advisory in Step 9) |
| 5 | Capture milestone | Unknown milestone → refuse; gh api error → halt |
| 6 | Capture relationships | Unresolvable #N → refuse; cross-repo format → refuse |
| 7 | Draft body + present (with leak guard) | Public-repo leak → refuse; needs approval |
| 8 | Pre-creation checks (with leak guard) | Cross-repo → refuse; label missing → refuse; milestone closed → refuse; leak guard → refuse |
| 9 | gh issue create | Labels and milestone must be valid if provided; zero-label advisory only |
| 10 | Apply relationship mutations | Mutation error → warn + manual-retry; no rollback |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Hardcoding label names | Read from `gh label list` each run |
| Refusing when no label chosen | Zero labels is valid — print the no-labels-chosen advisory in Step 9 and continue |
| Using wrong body structure | Match the 5-section template exactly |
| Creating issues in other repos | Only create in the current repo's default gh target |
| Calling `gh issue create` twice | Step 9 runs once; report the URL and stop |
| Skipping remote label check | Run Step 8 existence check before every create |
| Offering `javascript` or `github_actions` | These are Dependabot-only — exclude from Step 4 list and refuse if selected |
| Not checking `gh repo view` exit code | Always capture exit code; halt on non-zero or malformed output |
| Prompting for milestone when args supplied | If milestone in invocation args, skip Step 5 prompt (args-win) |
| Refusing when no milestone chosen | Zero milestone is valid — never block on this |
| Refusing when no relationships chosen | Zero relationships is valid — never block on this |
| Queuing GraphQL mutations before gh issue create | Step 6 resolution is queue-only; mutations happen in Step 10 |
| Attempting related-to GraphQL mutation | related-to has no GitHub native primitive — body prose only (Relates to #N in ## Context) |
| Rolling back the issue on Step 10 mutation failure | On any Step 10 error, warn + manual-retry; never delete the created issue |
| Skipping Step 3 duplicate check | Always search before drafting; offer comment-instead as the default option |
| Running the leak guard only once | Re-run in Step 8 — the body may change during Step 7 revisions |
| Silently rewriting leaked content | Never silently rewrite; refuse on confirmed leak, warn on ambiguous and ask the user to revise |
