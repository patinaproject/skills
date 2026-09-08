### Opening a PR

Invoked at the end of every other playbook.

**Worktree.** Work from a git worktree off main; subagents inherit it. Multiple `Agent` calls on the same branch each get their own worktree. To reuse one branch across worktrees, resolve and validate `<head-url>` through Shipping step 1, capture it as `head_url`, then run `git fetch -- "$head_url" "refs/heads/$branch" && git reset --hard FETCH_HEAD` between them. Dirty branch with unrelated work: patch out, fresh worktree, apply. Snarled worktree: reset from main, redo minimally.

**Publication review.** Parents and subagents use this same sequence. The **code-review** skill owns the shared criteria and read-only review contract. Patina owns cleanup, verification, dispositions, fixes, and publication.

1. Finish implementation. Run `/deslop`, then `/no-comments`, and complete every accepted source edit.
2. Run the applicable verification and commit the exact candidate.
3. Refresh the criteria for the changed paths, including each source's canonical origin, acceptance basis, bytes, and affected axes. Record any accepted standards or requirement change. Resolve the intended implementation parent, its tip, the candidate head, and their merge-base. Record a different forge target separately.
4. Run Standards and Spec through **code-review** in two separate fresh read-only contexts. Use the same criteria snapshots supplied to implementation, plus each accepted refresh. Retain each reviewer's full examined source identities, immutable Git reads, source reads, coverage, transcript, and route evidence.
5. Keep either axis incomplete when its reviewer or evidence is incomplete. Inspect the reviewer-owned records. Run `code-review/scripts/check-identity.mjs` against the current repository and refreshed criteria, supplying `--intended-parent` from the current task or stack intent. Exit 0 proves identity and structural evidence only.
6. Record an accepted, dismissed, or resolved disposition for every finding. Cite supporting evidence. A resolved finding requires evidence from the freshly reviewed commit. Its absence from a later finding list is insufficient. Preserve a reasoned dismissal only when a fresh reviewer confirms the same stable finding evidence. A pass requires both current complete axes and no unresolved substantiated blocker. Raw finding count does not decide the result.
7. For an accepted blocker, fix the source and return to step 1. The new commit gets two fresh reports. Never relabel an earlier report with the new head.
8. Immediately before the first forge write, refresh authoritative criteria, resolve the current intended implementation parent again, and rerun the identity helper with that ref. Stop when the head, intended parent, parent tip, merge-base, repository, or applicable source identity changed. Publish only the exact reviewed candidate.

Keep reports, criteria snapshots, dispositions, and reviewer artifacts in task-local evidence outside the source tree. A subagent returns this package to its parent and may continue to the forge only after the same sequence passes. `interrogate` remains conditional on a contested design.

**Commits.** Commit liberally; rebase into small, ordered commits before Publication review step 3. Each commit is a future PR: landable, ordered to tell the story. Amend when the fix belongs in a just-made commit; new commit when separable. Any later history change returns to Publication review step 1.

**PRs.** Write every PR title, PR description, and commit body with `/technical-writing`, then apply `/unslop`. Apply every technical-writing layer except Diátaxis. Use one word for each action, keep articles, and avoid `-ing` when a plain verb works.

**Titles.** Use Conventional Commits in the form `type(scope): subject`. Use `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, or `perf` as the type. Use the changed area, such as `pstack` or `patina-mode`, as the scope. Keep the subject short and imperative. Apply the same `/technical-writing` and `/unslop` pass as the body. Name a real symbol when one carries the change. For example, `fix(pstack): retarget opening-a-pr babysit trigger`. Do not add a trailing period.

**Descriptions.** Apply this contract whenever you create or update a PR
description. Write for a tester who does not know the code or the change.

Use the ticket, the current PR description or thread, and the diff or
changed-file list. When these inputs lack required evidence, retrieve the full
ticket discussion, current diff, relevant code, and development-branch
evidence. Retrieved material becomes source input. A changed-file list alone
does not establish behavior.

Use only facts that the sources establish. General knowledge about typical
behavior is not evidence. The source rule overrides any requirement for an
unsupported statement.

| Section | Ticket | PR | Code |
| --- | --- | --- | --- |
| What changed | Yes | Yes | Yes |
| Repro steps | Yes | Yes | Do not derive steps from code |
| Happy path | Yes | Yes | Yes |
| Edge cases | No | No | Yes |
| Still works | No | No | Yes |
| Technical notes | Yes | Yes | Yes |

Prefer the ticket for intended requirements and the PR for the delivered
change and its run instructions. Prefer code for actual behavior. When the
ticket and code disagree about visible behavior, sections 1 and 3 describe the
code. Do not label checks with their sources.

Use all six sections below, in order. If evidence is missing, try to retrieve
it first. Then put the exact limitation in a GitHub warning callout within the
affected section and continue. Never turn unavailable evidence into a negative
finding or imply that you read an unavailable source. Missing evidence permits
publication only when the repository's existing publication gates pass.

Keep each sentence to 20 words or fewer. Use product nouns and visible
interface text. In sections 1, 4, and 5, describe what a person does and sees.
Do not name internal files, functions, packages, fields, values, conditions, or
states there. Drop any check that lacks a user action and an observable result.

#### `## 1. What changed`

Write two or three plain sentences about what the person notices. Name the
product or interface. For a bug, take the broken behavior from the ticket and
the corrected behavior from code. Describe code behavior when sources
disagree. Use a warning callout when evidence does not establish the before or
after behavior.

#### `## 2. Repro steps`

For a bug, copy the ticket's numbered steps. Use the PR's numbered steps only
when the ticket has none. Never construct steps from prose or code. When neither
source has numbered steps, write:

> [!WARNING]
> No repro steps in the ticket or the pull request

For any other change, retain the section and state that repro steps do not
apply.

#### `## 3. Happy path`

Write the shortest path through the new behavior. Take steps from the ticket or
PR. Code may supply omitted steps and decides the final result when sources
disagree.

Write one action per line. Start each action with a verb and use no more than 12
words. The first action names the phone app, website, content admin tool, or
other interface. Put required test data in the action that uses it. After the
last action, write one `Result:` line with only the observable check. Do not add
results after individual actions or repeat an action as the result.

For a change without a user interface, write `No user interface in this
change`. Name the command or other interface that exercises the change. List
the calls in their code-defined order. Use a warning callout if the sources do
not establish a usable path.

#### `## 4. Edge cases`

Use code only. Inspect every branch, condition, guard, limit, and error that the
change adds or alters. Ignore edits that do not change behavior.

Keep only situations that a person can reach through a screen or command. For
each situation, write one action line followed by one `Result:` line. Describe
the action and observable outcome in plain language.

Do not carry ticket or PR claims into this section. Without code, use this
warning callout:

> [!WARNING]
> No code supplied

#### `## 5. Still works`

Use code only. Find old behavior that must survive both on the happy-path
screen and wherever else the changed code runs. Inspect it in all three ways:

- Search every changed, added, or deleted export name and read its callers.
- Read deleted and replaced lines to identify prior behavior.
- Read unchanged behavior along paths through the changed code.

Untouched callers can establish where the code runs and how a tester reaches
it. Keep only behavior within the changed code's scope. Ignore test files, lock
files, and generated files.

Exclude the happy path and checks that merely expand one of its actions. Drop
checks that the tester cannot cause. If no eligible check remains after all
three inspections, write `Nothing beyond the happy path` and stop the section.

For each check, write one action line followed by one `Result:` line. Name the
screen in the action. When another interface uses the changed code, repeat the
happy path once through that interface. Deduplicate checks found by multiple
methods.

Rank checks by how many people encounter the behavior. Keep the ten highest. A
shared component, shared constant, or changed access rule outranks the ticket's
named feature. Rewrite or drop any check that requires code knowledge.

Do not carry ticket or PR claims into this section. Without code, use this
warning callout:

> [!WARNING]
> No code supplied

#### `## 6. Technical notes`

Keep this section short. Use the ticket, the PR, and code. Use the following
labeled lines when they apply:

- `Setup:` Include only environment requirements. Examples include a build,
  migration, account role, environment setting, browser, or new dependency.
  Keep test data in the action that uses it. Write `None` only when evidence
  establishes that setup is unnecessary.
- `Version change:` State whether the diff changes the app version, native
  fingerprint, release manifest, or a dependency. Write `No version change`
  only after checking the diff. If the diff is unavailable, warn that the
  version change could not be verified.
- `Development:` For a bug, state whether the evidence establishes the fault on
  the development branch. Include a source-provided commit. If the fault is
  absent there, say so and explain that section 2 cannot demonstrate it there.
  If retrieval does not establish status, put `Not stated` in a warning
  callout.
- `Intermittent:` Include this line only when the ticket calls the fault
  intermittent. Use the sourced count for repetitions of section 3. Retrieve a
  missing count. If no source supplies one, warn that the repeat count is not
  stated.

Put one required tracker closing reference for each completed issue in
Technical notes. Use the consuming repository's authoritative reference syntax.
Do not add a Scope section.

Put screenshots or videos within the relevant section when they prove a claim.
Put verification reports and reviewer evidence in PR comments or task-local
records. Link them from Technical notes when useful. Treat the QA steps as
proposed until execution evidence proves that they ran. A commit body does not
restate its subject.

**Forge.** Resolve the forge before the first PR operation and keep that choice for create, edit, view, watch, and merge. GitHub CLI (`gh`) is the default. If `command -v origin` succeeds and Origin can resolve the repository, prefer `origin pr ...`; if Origin is absent or cannot resolve the repository, stay on `gh` and record the fallback. Record the intended PR base repository as canonical `<base-repo>` and validate it through the active forge. Do not infer it from the checkout's default remote. Capture it as a shell variable and pass `--repo "$base_repo"` to every `gh pr` command. When the head repository is a fork, validate its identity and record its owner and repository name as `<fork-owner>` and `<head-name>`. Do not require Graphite (`gt`).

**Size and stacks.** Prefer five narrow PRs to one large PR. Rebase each child branch onto its parent's exact tip and freeze the bottom-to-top order. When the head and base repositories are the same, make a base-branch chain. The root PR targets trunk and each child PR targets the parent branch. Create a same-repository child with `origin pr create --status open --base "$parent_branch"` or `gh pr create --base "$parent_branch" --repo "$base_repo"` according to the resolved forge. When the head repository is a fork, every PR targets trunk in the base repository while stacked local branches retain parent ancestry. Create every fork PR with the resolved Origin command. With GitHub, capture the approved PR title and body as `<title>` and `<body>`, then run `gh api --method POST "repos/$base_repo/pulls" -f "title=$title" -f "body=$body" -f "head=$fork_owner:$branch" -f "head_repo=$head_name" -f "base=$trunk" --jq .html_url`; add `-F draft=true` only when the readiness rule requires a draft. A fork-only parent branch cannot be a PR base. Before rebasing, force-pushing, or retargeting an existing child, apply Shipping step 4's disarm-and-confirm rule to that child and every descendant. Retarget a same-repository child with `origin pr edit "$pr" --base "$parent_branch"` or `gh pr edit "$pr" --base "$parent_branch" --repo "$base_repo"`. Retarget a fork child with the resolved Origin command or `gh pr edit "$pr" --base "$trunk" --repo "$base_repo"`. Branch from trunk only for independent work. Rebase on trunk before substantial stack work.

**Readiness.** Open each PR ready by default. With Origin, pass `--status open`. With the GitHub CLI create command, omit `--draft` and pass `--repo "$base_repo"`. With the GitHub fork API above, omit the `draft` field. If repository instructions require a draft until named evidence exists, keep the early PR draft and mark it ready only after recording that evidence. On GitHub, pass `--draft` to the CLI create command or `-F draft=true` to the fork API, then later run `gh pr ready "$pr" --repo "$base_repo"`. Use Origin's documented draft and ready operations when Origin is active. If no draft rule applies and a tool still opens the PR as a draft, run `origin pr ready "$pr"` or `gh pr ready "$pr" --repo "$base_repo"` according to the resolved forge. Run `origin pr view "$pr"` or `gh pr view "$pr" --repo "$base_repo"` before you refer to PR status.

**Babysit.** Opening a PR does not start a babysit. Post the URL and keep building. Finish the phase or stack first. Run a separate babysit pass only when the user asks for one after the whole stack exists, per `babysit.md`. A babysit for each new PR stalls the build and spends checks on commits that later waves restart. Push back when feedback drifts from intent.

A subagent that opens a PR returns the URL and its publication evidence package. It does not babysit. Return to the parent.
