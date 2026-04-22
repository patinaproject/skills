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

Review locally before publish.
Done-report contract:
- `findings[]`: local findings, if any, with one entry per issue
  - each finding entry includes `summary`, `loopback_classification` (`implementation-level` | `plan-level` | `spec-level`), and `owner`
- `verification_gaps[]`: any missing or invalid verification
Do not take ownership of external PR comments or bot feedback.
```

### Finisher

Append this block in place of `{role-specific inputs}`:

```text
Recommend `superpowers:finishing-a-development-branch`.
Recommend `superpowers:receiving-code-review` when handling reviewer findings, PR comments, or bot feedback.

Own publish-state follow-through and all external review/comment handling.
Before resolving or replying to a comment tied to a file, commit, or line, verify it against the current branch state and the prior state the comment referred to.
If feedback adds or changes requirements, route it through `Brainstormer`, then `Planner`, then `Executor`.
Done-report contract:
- `pushed_shas[]`: pushed commit SHAs
- `current_branch_state`: latest pushed branch state on origin
- `pr_state`: PR URL or update status plus unresolved review state
- `ci_state`: latest CI status
- `follow_up[]`: branch-state-aware next actions or blockers
```
