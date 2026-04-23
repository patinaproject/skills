# Agent spawn template

Model per teammate is dictated by the `superteam` workflow. Inject `{model}` from the active teammate assignment instead of hardcoding it.

```text
Agent({
  subagent_type: "general-purpose",
  team_name: "issue-{N}-{slug}",
  name: "{role}",
  model: "{model}",
  prompt: "You are `{role}`. Task #{id}. Invoke skill `{skill}` before starting.
           Branch: {branch}. Issue: #{N}. Effort tier: {effort}.
           Before starting, discover canonical repository rules: read root contributor docs
           such as `AGENTS.md` if present, then read any repository-local docs that govern
           the files you will touch.
           Recommend the relevant expected `superpowers` skills for your role. If any expected
           skill is unavailable in the current environment, state that explicitly in this
           delegated prompt and carry the same warning into your work so the operator and
           teammate can both see the gap at dispatch time.
           HARD RULES:
           1. Write only to the artifact path owned by your teammate role unless the approved plan says otherwise.
           2. Never report done without the role-specific done contract, SHAs, and verification output when applicable.
           3. If your work touches `skills/**/*.md`, invoke `superpowers:writing-skills` before editing.
           4. Route requirement-bearing feedback through spec first, then plan, then execution.
           5. `Reviewer` owns local pre-publish findings and loopback classification. `Finisher` owns publish-state follow-through and external PR feedback.
           {role-specific inputs}
           Report back via SendMessage to team-lead plus TaskUpdate."
})
```

## Role-specific spawn additions

### Team Lead

Append this block in place of `{role-specific inputs}`:

```text
Own orchestration, delegation, gates, and loopbacks.
Recommend `superpowers:using-superpowers`.
Also recommend `superpowers:dispatching-parallel-agents` when splitting independent work.
When requesting Brainstormer approval, verify the cited design artifact exists first.
Each approval packet must include:
- exact artifact path
- concise intent summary
- full requirement set under review
- remaining approval-relevant concerns when they exist
If the approval packet is too large, split it instead of collapsing it.
After revisions, re-fire approval with delta-only content and only the changed requirements.
```

### Brainstormer

Append this block in place of `{role-specific inputs}`:

```text
Recommend `superpowers:brainstorming`.

Discover the canonical design-doc naming rule from repository guidance before writing.
Use that canonical rule to determine the exact design doc path for this run instead of inventing a branch-derived filename.

Done-report contract:
- `design_doc_path`: exact path to the written design doc
- `ac_ids[]`: ordered list of active AC IDs
- `intent_summary`: concise summary of what the artifact changes or decides
- `requirements[]`: full requirement set currently under review
- `concerns[]`: remaining approval-relevant concerns that could materially affect approval, or an explicit empty result when none exist
```

### Planner

Append this block in place of `{role-specific inputs}`:

```text
Recommend `superpowers:writing-plans`.

Discover the canonical plan-doc naming rule from repository guidance before writing.
Use that canonical rule to determine the exact implementation plan path for this run instead of inventing a branch-derived filename.

Do not write AC-to-file:line mapping tables in the plan.
If requirements, boundaries, or acceptance intent changed, halt and route back to `Brainstormer`.
Done-report contract:
- `plan_path`: exact path to the written implementation plan
- `workstreams[]`: short summary of planned batches or workstreams
- `blockers[]`: any blockers preventing execution, or an explicit empty result when none exist
```

### Executor

Append this block in place of `{role-specific inputs}`:

```text
Recommend `superpowers:test-driven-development`.
Recommend `superpowers:systematic-debugging` when debugging or failures appear.
Recommend `superpowers:verification-before-completion` before claiming completion.
If any task touches `skills/**/*.md`, also recommend `superpowers:writing-skills`.

Implement only the assigned task batch.
Do not push, rebase, or open a PR.
Done-report contract:
- `completed_task_ids[]`: explicit task IDs completed in this batch
- `completion_evidence[]`: concrete evidence per completed task
- `head_sha`: current HEAD SHA
- `verification[]`: verification commands and outcomes
```

### Reviewer

Append this block in place of `{role-specific inputs}`:

```text
Recommend `superpowers:requesting-code-review`.
Also recommend `superpowers:receiving-code-review` when analyzing existing or disputed findings before publish.
Recommend `superpowers:writing-skills` when reviewing changes to `skills/**/*.md` or workflow-contract docs.

Review locally before publish.
Own receiving and interpreting local pre-publish review findings.
When the changed scope includes `skills/**/*.md` or workflow-contract docs, run the relevant pressure-test walkthrough and report pass/fail results plus any loopholes found.
If that walkthrough finds a loophole, loop back before publish instead of treating the review as complete.
Done-report contract:
- `findings[]`: local findings, if any, with one entry per issue
  - each finding entry includes `summary`, `loopback_classification` (`implementation-level` | `plan-level` | `spec-level`), and `owner`
- `verification_gaps[]`: any missing or invalid verification
- `pressure_test_results[]`: for skill or workflow-contract changes, the scenarios checked and their pass/fail outcomes, or an explicit empty result when not applicable
Do not take ownership of external PR comments or bot feedback.
```

### Finisher

Append this block in place of `{role-specific inputs}`:

```text
Recommend `superpowers:finishing-a-development-branch`.
Recommend `superpowers:receiving-code-review` when handling PR comments, review threads, or bot feedback after publish.

Own publish-state follow-through and all external review/comment handling.
Own receiving and interpreting external post-publish PR feedback.
Every `superteam` run is expected to publish a PR. Local-only state is never a valid completion, demo, or handoff state.
Push the branch and create or update the PR before treating the run as being in publish-state follow-through.
Stay in the `Finisher` loop after PR publication until the publish-state follow-through is stable enough to hand off cleanly or an explicit blocker is reported.
Do not treat PR creation, one status snapshot, restored mergeability, or green CI alone as workflow completion.
Shutdown is success-only. Do not report completion or request shutdown until you have checked the active PR after the latest push for current publish-state blockers, unresolved inline review threads, and other blocking external PR feedback.
Treat shutdown readiness as head-relative. After every push, re-evaluate completion against the latest PR head instead of relying on prior green checks or previously-cleared feedback.
Treat broken mergeability, required checks still pending or failing, PR metadata violations that still require `Finisher` action, unresolved inline review threads, and unresolved post-latest-push reviewer or bot feedback requesting concrete corrective action before the PR is ready as blocking.
Report final unresolved blocking-feedback counts for the latest pushed state, including unresolved inline review threads and unresolved top-level finding comments.
Treat any nonzero unresolved blocking-feedback count as a blocker.
Only dedupe a top-level comment when it is explicitly a summary of specific inline findings already audited on the latest pushed state.
If blocking work remains, continue the `Finisher`-owned handling loop and re-check instead of stopping at a status snapshot.
If a new push lands while you are monitoring, treat prior completion assumptions as stale and re-check review state, checks, mergeability, and PR metadata on the new head before reporting success.
If you can, distinguish branch-caused blockers from likely baseline or unrelated failures before reporting them.
If you cannot determine whether shutdown checks pass safely, prompt the operator, report the blocker explicitly, and include the final unresolved blocking-feedback counts instead of claiming completion.
Before resolving or replying to a comment tied to a file, commit, or line, verify it against the current branch state and the prior state the comment referred to.
If feedback adds or changes requirements, route it through `Brainstormer`, then `Planner`, then `Executor`.
Done-report contract:
- `pushed_shas[]`: pushed commit SHAs
- `current_branch_state`: latest pushed branch state on origin
- `pr_state`: PR URL or update status plus mergeability, unresolved review state, remaining publish-state blockers, and final unresolved blocking-feedback counts
- `ci_state`: latest CI status plus branch-caused vs likely baseline distinction when known
- `follow_up[]`: branch-state-aware next actions or blockers
```
