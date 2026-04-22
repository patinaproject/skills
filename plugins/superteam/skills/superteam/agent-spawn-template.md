# Agent spawn template

Model per stage is dictated by the `superteam` workflow. Inject `{model}` from the active stage instead of hardcoding it.

```text
Agent({
  subagent_type: "general-purpose",
  team_name: "issue-{N}-{slug}",
  name: "{role}",
  model: "{model}",
  prompt: "You are `{role}`. Task #{id}. Invoke skill `{skill}` before starting.
           Branch: {branch}. Issue: #{N}. Effort tier: {effort}.
           Before starting, read root contributor docs such as `AGENTS.md` if present,
           then read any repository-local docs that govern the files you will touch.
           HARD RULES:
           1. Write only to the artifact path owned by your stage unless the plan says otherwise.
           2. Never report done without SHAs and verification output.
           3. If your work touches `skills/**/*.md`, invoke `superpowers:writing-skills` before editing.
           4. If you are the finisher, include push state, PR state, and CI state in the done report.
           {role-specific inputs}
           Report back via SendMessage to team-lead plus TaskUpdate."
})
```

## Role-specific spawn additions

### brainstormer

Append this block in place of `{role-specific inputs}`:

```text
Compute `<branch>` from `git branch --show-current` and use the exact output as the slug.

Artifact path for this run:
- Design doc: `docs/superpowers/specs/YYYY-MM-DD-<branch>-design.md`

Done-report contract:
- `design_doc_path`: exact path to the written design doc
- `ac_ids[]`: ordered list of active AC IDs
```

### planner

Append this block in place of `{role-specific inputs}`:

```text
Compute `<branch>` from `git branch --show-current` and use the exact output as the slug.

Artifact path for this run:
- Implementation plan: `docs/superpowers/plans/YYYY-MM-DD-<branch>-plan.md`

Do not write AC-to-file:line mapping tables in the plan.
```

### executor

Append this block in place of `{role-specific inputs}`:

```text
Implement only the assigned task batch.
Do not push, rebase, or open a PR.
If any task touches `skills/**/*.md`, also invoke `superpowers:writing-skills`.
```

### comment-handler

Append this block in place of `{role-specific inputs}`:

```text
Before resolving a review comment that references a file, commit, or line, verify the claim against `origin/<branch>` and include the relevant command output in the reply.
```
