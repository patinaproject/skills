# Plan: Require Lint checks in branch rulesets [#72](https://github.com/patinaproject/bootstrap/issues/72)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce the GitHub Actions `Lint` check in repository rulesets and make the actionlint workflow safe to require on every pull request.

**Architecture:** Use the live GitHub ruleset API for repository enforcement and keep file changes limited to the bootstrap-owned actionlint workflow template plus its mirrored root output. Treat PR publication as the final proof point for shared `Lint` context behavior.

**Tech Stack:** GitHub CLI/API, GitHub Actions rulesets, YAML workflows, markdownlint, actionlint, bootstrap template realignment discipline.

---

## File Structure

- Modify: `skills/bootstrap/templates/core/.github/workflows/actions.yml`
  Source template for the actionlint workflow.
- Modify: `.github/workflows/actions.yml`
  Mirrored root workflow produced from the template realignment loop.
- Verify: GitHub repository ruleset `Required Lint checks`
  Repository-owned branch ruleset requiring GitHub Actions `Lint`.
- Verify: GitHub pull request checks
  Latest-head evidence that the required `Lint` context behaves as intended.

## Task 1: Capture Ruleset Enforcement

**Files:**

- Verify: GitHub repository rulesets

- [ ] **Step 1: Inspect inherited and repository rulesets**

Run:

```bash
gh api 'repos/{owner}/{repo}/rulesets?includes_parents=true' \
  --jq '.[] | {id,name,source_type,enforcement,target,rules}'
```

Expected: inherited branch rulesets are visible. If no active rule requires
`Lint`, continue to Step 2.

- [ ] **Step 2: Confirm GitHub Actions app integration ID**

Run against a recent pull request commit with GitHub Actions checks:

```bash
gh api repos/{owner}/{repo}/commits/<sha>/check-runs \
  --jq '.check_runs[] | select(.app.slug=="github-actions") | .app | {id,slug,name}' \
  | sort -u
```

Expected: the app is GitHub Actions and its integration ID is available for the
ruleset payload.

- [ ] **Step 3: Create or update repository ruleset**

If inherited org rulesets cannot be edited from the current token, create a
repo-owned active ruleset:

```bash
gh api repos/{owner}/{repo}/rulesets --method POST --input - <<'JSON'
{
  "name": "Required Lint checks",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH", "refs/heads/production"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          {
            "context": "Lint",
            "integration_id": <github-actions-integration-id>
          }
        ]
      }
    }
  ]
}
JSON
```

Expected: response shows an active branch ruleset with
`required_status_checks` for `Lint` and the GitHub Actions integration.

- [ ] **Step 4: Verify ruleset**

Run:

```bash
gh api repos/{owner}/{repo}/rulesets/<ruleset-id> \
  --jq '{id,name,source_type,enforcement,conditions,rules}'
```

Expected: `Required Lint checks` is active, applies to `~DEFAULT_BRANCH` and
`refs/heads/production`, and requires `Lint` from GitHub Actions.

## Task 2: Remove Actionlint Path Filter Through Template Realignment

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/workflows/actions.yml`
- Modify: `.github/workflows/actions.yml`

- [ ] **Step 1: Edit source template first**

Remove only the pull request `paths` filter from:

```yaml
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
```

Expected: the source template has no `paths:` key under `pull_request`.

- [ ] **Step 2: Realign root workflow from the template**

Use the local bootstrap realignment discipline for the workflow batch. If no
non-interactive runner exists, record the evidence used for the accepted root
diff:

```bash
diff -u \
  skills/bootstrap/templates/core/.github/workflows/actions.yml \
  .github/workflows/actions.yml
```

Expected: no diff between the source template and root workflow after applying
the accepted root workflow update. If realignment cannot be run safely, record
that blocker in the PR body.

- [ ] **Step 3: Verify no workflow path filter remains**

Run:

```bash
rg -n "paths:" \
  .github/workflows/actions.yml \
  skills/bootstrap/templates/core/.github/workflows/actions.yml
```

Expected: no matches and exit code `1`.

## Task 3: Local Verification

**Files:**

- Verify: `.github/workflows/*.yml`
- Verify: `skills/bootstrap/templates/core/.github/workflows/*.yml`
- Verify: Markdown artifacts changed for #72

- [ ] **Step 1: Run actionlint**

Run:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir" || exit 1
  bash <(curl -sL https://raw.githubusercontent.com/rhysd/actionlint/v1.7.12/scripts/download-actionlint.bash) 1.7.12 >/dev/null
)
"$tmpdir/actionlint" -color .github/workflows/*.yml skills/bootstrap/templates/core/.github/workflows/*.yml
lint_exit=$?
rm -rf "$tmpdir"
exit "$lint_exit"
```

Expected: exit code `0`.

- [ ] **Step 2: Run markdown lint**

Run after dependencies are installed:

```bash
pnpm lint:md
```

Expected: exit code `0`. If dependencies are not installed, run
`pnpm install` first and keep unrelated lockfile churn out of the diff.

- [ ] **Step 3: Confirm root/template parity**

Run:

```bash
diff -u \
  skills/bootstrap/templates/core/.github/workflows/actions.yml \
  .github/workflows/actions.yml
```

Expected: exit code `0`.

## Task 4: Review Workflow-Contract Risks

**Files:**

- Review: `docs/superpowers/specs/2026-04-30-72-require-lint-checks-in-branch-rulesets-design.md`
- Review: `docs/superpowers/plans/2026-04-30-72-require-lint-checks-in-branch-rulesets-plan.md`
- Review: workflow diffs and ruleset evidence

- [ ] **Step 1: Run workflow-contract pressure review**

Check the design's required dimensions:

- RED baseline is documented by the initial missing ruleset requirement and
  path-filtered workflow.
- GREEN behavior is documented by active ruleset output and no `paths:` matches.
- Duplicate `Lint` contexts are treated as a live PR verification gate.
- Template/root parity is backed by diff output.
- No unrelated workflow behavior was changed.

Expected: no implementation-level, plan-level, or spec-level blockers remain.

## Task 5: Publish PR And Verify Latest Head

**Files:**

- Publish: branch `72-require-lint-checks-in-branch-rulesets`
- Publish: PR for issue #72

- [ ] **Step 1: Push branch**

Run:

```bash
git push -u origin 72-require-lint-checks-in-branch-rulesets
```

Expected: branch exists on origin and tracks the remote branch.

- [ ] **Step 2: Create PR with repository template**

Use `.github/pull_request_template.md` headings in order. The title must be:

```text
fix: #72 require lint checks in rulesets
```

Expected: PR body includes `Closes #72`, the template's sections, verification
commands, and `### AC-72-1`, `### AC-72-2`, and `### AC-72-3` outcomes.

- [ ] **Step 3: Verify latest-head checks and mergeability**

Run after checks start:

```bash
gh pr view <pr> --json headRefOid,mergeStateStatus,reviewDecision,statusCheckRollup
```

Expected: latest pushed SHA is visible. Required GitHub Actions `Lint` checks
are not bypassed. If shared `Lint` contexts behave ambiguously, halt and route
a follow-up design change instead of claiming AC-72-1 complete.

## Acceptance Criteria Trace

- AC-72-1: Task 1 configures and verifies ruleset enforcement; Task 5 verifies
  latest-head PR behavior.
- AC-72-2: Task 2 removes the actionlint workflow `paths` filter; Task 3 checks
  no `paths:` key remains.
- AC-72-3: Task 2 records template-first realignment evidence; Task 3 confirms
  root/template parity.

## Planner Self-Review

- Spec coverage: R1-R7 map to Tasks 1-5.
- Placeholder scan: no `TBD`, `TODO`, or vague implementation placeholders
  remain.
- Type and name consistency: the required status-check context remains `Lint`;
  the ruleset name remains `Required Lint checks`.
