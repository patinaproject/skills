---
name: pr-readiness
description: Evaluate pull-request evidence against the current candidate and publish the only ready transition.
---

# PR readiness

`pr-readiness` is the single owner of readiness evaluation and publication. It reads GitHub's own signals for the PR and never accepts an observation from a file, a flag, a status, or the PR author. It is an agent's pre-flight, not merge authority. GitHub enforces merge authority through the repository ruleset in [Operator setup](#operator-setup). Under the [auto-merge](#auto-merge) opt-in, `publish` asks GitHub to merge once that ruleset passes, or merges a PR that GitHub already reports as mergeable.

```sh
pr-readiness open --repo OWNER/REPO --base BASE --head BRANCH --mode draft|ready
pr-readiness check --repo OWNER/REPO --pr NUMBER
pr-readiness publish --repo OWNER/REPO --pr NUMBER
```

`open` passes the caller's selected creation mode to the forge. `check` is read-only. It prints the JSON report and writes one line per unmet obligation to stderr, naming the command that produces the missing evidence. `publish` evaluates even when the PR is already ready, reads the remote candidate and body again, rejects a race, writes an immutable packet with put-if-absent semantics, and performs the forge ready transition with an expected head. Publishing a draft requires `--takeover=true` (or the trusted automation environment). Neither command posts a status or a check. With `autoMerge: true`, `publish` then merges or arms auto-merge as [Auto-merge](#auto-merge) describes.

## Producers

| Producer | Evidence the evaluator reads | Who can author it |
| --- | --- | --- |
| `checks` | Check runs on the head from the `github-actions` app with the names the policy lists. The newest run in each check suite counts, so a successful re-run replaces a failure. | A GitHub Actions workflow job |
| `approval` | GitHub's `reviewDecision` for the PR, which must be `APPROVED`, plus an approving review whose commit is the head from a `User` with write or admin permission who is not the PR author. Each eligible reviewer's latest decisive review stands until it is dismissed, so a change request on an older commit still fails the obligation. | A `User` with write or admin permission who is not the PR author |
| `ruleset` | The base branch's live `pull_request` rules from `repos/{repo}/rules/branches/{base}`, the PR's changed paths (a rename counts under its old and new name), GitHub's `reviewDecision`, and the eligible approvals at the head. The obligation passes when no approval is required, or when `reviewDecision` is `APPROVED` and enough eligible approvals stand at the head. | A `User` with write or admin permission who is not the PR author, and whatever team members GitHub counts toward `reviewDecision` |

One approval satisfies every obligation that names `approval`. A bot's review never counts. Every factory agent acts as one GitHub App that authors its PRs, so no agent can approve its own work. An agent keeps its code-review result in its session, and resolves the findings. The result stays off the PR. In an approval-gated repository the PR waits for a maintainer's approval at the head. Agents must never hold an operator's credentials, because an approval posted with them would count as the operator's.

## Policy

The policy is `.github/pr-readiness.json`, read through the forge from the default branch. A PR cannot change the policy that judges it, and neither can the parent branch of a stacked PR. It maps each obligation (`standards`, `spec`, `hygiene`, `tests`, `lint`, `behavior`) to a producer.

```json
{ "version": 1, "obligations": { "hygiene": { "producer": "checks", "checks": ["Check diff hygiene"], "allowSkipped": true }, "standards": { "producer": "approval" } } }
```

A repository without the file, and any obligation the file omits, requires `approval`. A malformed file, an unknown obligation, or an unknown producer fails the evaluation. The `ruleset` producer is opt-in and takes no options. [The `ruleset` producer](#the-ruleset-producer) describes it. `allowSkipped` makes a check that concluded `skipped` count as not run, and an obligation whose checks all skipped is not applicable. Use it only for jobs whose workflow skips them on purpose, such as the release-please PR. `behavior` does not apply to a documentation-only change, and its evidence from another head is never reused.

The optional top-level `autoMerge` boolean turns on auto-merge arming. A missing key means off. A value that is not a boolean fails the evaluation.

The policy puts the repository in one of two modes:

- **Approval-gated.** The default. Each obligation without a `checks` mapping requires a maintainer's approval at the head.
- **Checks-only.** Every obligation, `standards` and `spec` included, maps to `checks`. No approval is needed. With `autoMerge: true`, the PR merges once every required check passes.

### The `ruleset` producer

Use `{ "producer": "ruleset" }` for a repository whose ruleset sets `required_approving_review_count` to 0 and requires approvals by path through `required_reviewers`. A PR that matches no entry needs no review. A PR that matches needs the approvals the matched entries require.

The producer reads the rules of the PR's base branch from the forge. It never reads the PR's files for rules. It collects every rule of type `pull_request`. The base count is the highest `required_approving_review_count` among them. An entry matches when any of its `file_patterns` matches a changed path. GitHub documents the patterns as `.gitignore` syntax, so a `!` pattern unmatches earlier ones and the last matching pattern decides. As in git, a negation cannot unmatch a file whose parent directory matched. Where GitHub's engine might read the patterns otherwise, this choice matches more paths, so it requires more approvals, never fewer. See [Required reviewers](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#required-reviewers).

The count is the largest of the base count and every matched entry's `minimum_approvals`. A requirement applies only when that count is above 0. An entry with `minimum_approvals` 0 adds the team for visibility only and creates no requirement. Then the obligation passes only when `reviewDecision` is `APPROVED` and at least that many distinct eligible reviewers approved the head. The eligibility filters are the `approval` producer's. The producer trusts GitHub's `reviewDecision` for team membership and never reads teams.

It fails closed, and names the cause, when any of these holds.

- The rules or the changed files cannot be read, the base has no `pull_request` rule, or the file list is truncated at GitHub's 3000-file cap.
- A `required_reviewers` entry has empty or missing `file_patterns`. An entry with an invalid pattern fails closed.
- `dismiss_stale_reviews_on_push` or `require_last_push_approval` is off on any collected rule. Only this producer guards the flags. The `approval` producer is unchanged.
- An eligible reviewer's latest decisive review is a change request.
- No requirement applies by our match, yet `reviewDecision` is `REVIEW_REQUIRED` or `CHANGES_REQUESTED`. The disagreement means a pattern bug could otherwise pass silently.

A passing decision carries the rules, the matches, and the required count in its `reason`. A `ruleset` observation is current-head only. It is never reused across heads, because rules change without the patch changing.

## Auto-merge

With `autoMerge: true`, `publish` reads the PR's `mergeStateStatus` and `isMergeQueueEnabled` after a successful ready transition. It reads again while the state is `UNKNOWN`, up to 5 reads, 2 seconds apart.

- **Merge now.** When the state is `CLEAN`, `HAS_HOOKS`, or `UNSTABLE` and the base has no merge queue, `publish` squash-merges the PR with the GraphQL `mergePullRequest` mutation, `expectedHeadOid` pinned to the published head. It confirms the PR is `MERGED` and prints the merge commit. GitHub refuses to arm auto-merge on such a PR.
- **Arm.** In every other state, or with a merge queue, `publish` arms GitHub squash auto-merge with the GraphQL `enablePullRequestAutoMerge` mutation, `expectedHeadOid` pinned to the published head.

The choice reads only those two fields, never an error message. The rules below apply to both paths.

- **Live rules.** When `publish` will arm, it first reads the base branch's live rules from `repos/{repo}/rules/branches/{base}`, before the ready transition. If a check the policy names is not a required status check there, or the read fails, `publish` fails and leaves the PR unchanged.
- **Approval.** When `publish` will arm, it also reads the live `pull_request` rule and the matching `required_reviewers` for the PR's changed files, and the PR's review decision. It skips the arm, and the merge, while a required approval is missing at the head or GitHub's review decision asks for review. It disarms an existing arm, prints the skip and why, and exits 0. It exits non-zero before the ready transition when the rules cannot be read. With no approval required, the stale-review flags do not stop the arm.
- **Default branch only.** It arms only when the PR's base is the default branch. A stacked child publishes without arming.
- **Workflow and policy paths.** It does not arm when the diff touches `.github/workflows/**` or `.github/pr-readiness.json`. It publishes, prints that it skipped auto-merge and why, and exits 0. A person merges that PR.
- **Re-runs.** A PR already armed for squash at the same head is a no-op success, unless it is already mergeable, which `publish` merges. An arm at an older head or with another merge method is replaced. The factory worker hook may already have armed the PR at creation.
- **Arm or merge failure.** If GitHub refuses the arm, `publish` reads the merge state once more and merges when the PR has become mergeable. Otherwise it exits non-zero and reports that the PR is ready but auto-merge is not on. If the first state read fails, or the merge fails and a reread does not show the PR `MERGED`, `publish` exits non-zero and reports that the PR is ready but not merged. A failed merge never falls back to arming.

On the arm path, a later push by a writer likely keeps auto-merge on, and GitHub then merges the new head once its required checks pass. Strict up-to-date checks stall auto-merge when the base moves. Babysit or the operator updates the branch, because nothing here does.

No other agent path arms auto-merge or merges. Only `publish` does, and only under this opt-in.

## Operator setup

The evaluator fails closed until the default-branch ruleset requires what the mode needs. Only an operator changes the ruleset.

- **Pull request rule.** In an approval-gated repository, set `required_approving_review_count` to at least 1, and turn on `dismiss_stale_reviews_on_push` and `require_last_push_approval`. Without a required review GitHub computes no `reviewDecision`, and `check` reports that.
- **Path-based approvals.** For the `ruleset` producer, turn on `dismiss_stale_reviews_on_push` and `require_last_push_approval` on every `pull_request` rule. `required_approving_review_count` may be 0 when `required_reviewers` carries the approvals. The producer relies on GitHub's `reviewDecision` to wait for a matched team's approvals, and it fails closed if GitHub reports otherwise. It cannot read team membership, so the team entries are trusted through GitHub alone.
- **Required checks.** Require each check the policy names, each pinned to the GitHub Actions integration (`integration_id` 15368). A checks-only repository rests on this rule, and `publish` refuses to arm auto-merge or merge until the live rules require every named check.
- **Actions approvals off.** Keep "Allow GitHub Actions to create and approve pull requests" disabled, so `github-actions[bot]` cannot satisfy the required review.

A same-repo PR can still add a workflow job that reports a passing check under a required name, because GitHub runs the PR's own `pull_request` workflows. In an approval-gated repository the required human approval at the head is the control for that, so a reviewer reads workflow changes before approving. Checks-only mode removes that control. So `publish` never arms auto-merge or merges on a diff that touches `.github/workflows/**` or `.github/pr-readiness.json`, and a person merges it.

The executable and pure evaluator live under `scripts/`. Forge and packet-store adapters are explicit seams. Production uses the `gh`/`origin` forge adapter and durable filesystem packet store, and tests inject a fake forge.
