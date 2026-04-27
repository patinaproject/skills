# Auto-Merge Release Bump PRs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure trusted plugin release-bump PRs to request GitHub native
auto-merge after the existing workflow creates or updates them.

**Architecture:** Keep the release-bump workflow as the single owner of bump PR
creation and auto-merge enablement. Add a post-create-pull-request GitHub CLI
step scoped to the PR number returned by the action, then document the
maintainer-facing behavior in the release flow.

**Tech Stack:** GitHub Actions YAML, GitHub CLI (`gh`), Markdown, `pnpm`
repository scripts.

---

### Task 1: Add workflow auto-merge request

**Files:**

- Modify: `.github/workflows/plugin-release-bump.yml`

- [ ] **Step 1: Add an id to the existing Create PR step**

Edit the `Create PR` step so it has an `id` that later steps can reference:

```yaml
      - name: Create PR
        id: cpr
        # peter-evans/create-pull-request@v8.1.1
        uses: peter-evans/create-pull-request@5f6978faf089d4d20b00c7766989d076bb2fc7f1
```

- [ ] **Step 2: Add the auto-merge step immediately after Create PR**

Append this step after the existing `Create PR` `with:` block:

```yaml
      - name: Enable auto-merge
        if: steps.cpr.outputs.pull-request-operation == 'created' || steps.cpr.outputs.pull-request-operation == 'updated'
        env:
          GH_TOKEN: ${{ github.token }}
          PR_NUMBER: ${{ steps.cpr.outputs.pull-request-number }}
        run: gh pr merge "$PR_NUMBER" --auto --squash
```

This step must not include `--admin`, `continue-on-error`, `|| true`, or shell
fallback logic that would hide a `gh pr merge` failure.

- [ ] **Step 3: Inspect the workflow diff**

Run:

```bash
git diff -- .github/workflows/plugin-release-bump.yml
```

Expected: the diff only adds `id: cpr` and the `Enable auto-merge` step. The
new step is gated on `created` or `updated`, uses
`steps.cpr.outputs.pull-request-number`, and calls
`gh pr merge "$PR_NUMBER" --auto --squash`.

### Task 2: Document release-flow behavior

**Files:**

- Modify: `docs/release-flow.md`

- [ ] **Step 1: Update the lifecycle merge step**

Replace lifecycle step 4 with:

```markdown
4. The workflow requests GitHub auto-merge for the trusted bump PR after it is
   created or updated. GitHub merges it only after required checks and branch
   protection requirements pass. The new version becomes the one users get on
   install.
```

- [ ] **Step 2: Add maintainer fallback documentation**

After the paragraph that starts `The release-bump PR workflow enables commit
signing`, add:

```markdown
The workflow also enables GitHub auto-merge for release-bump PRs that it creates
or updates from `bot/bump-*` branches. This uses `gh pr merge --auto --squash`
against the PR number returned by `peter-evans/create-pull-request`; it does not
use admin bypass and does not merge unrelated PRs. If repository auto-merge is
disabled, token permissions are insufficient, required checks fail, or the PR
contains unexpected changes, maintainers should inspect the open PR and resolve
the blocker manually.
```

- [ ] **Step 3: Inspect the documentation diff**

Run:

```bash
git diff -- docs/release-flow.md
```

Expected: the lifecycle no longer says a maintainer always reviews and merges
every bump PR, and the new note documents `bot/bump-*`, `gh pr merge --auto
--squash`, no admin bypass, and maintainer fallback cases.

### Task 3: Verify and commit implementation

**Files:**

- Verify: `.github/workflows/plugin-release-bump.yml`
- Verify: `docs/release-flow.md`
- Verify: `docs/superpowers/specs/2026-04-27-41-auto-merge-release-bump-prs-design.md`
- Verify: `docs/superpowers/plans/2026-04-27-41-auto-merge-release-bump-prs-plan.md`

- [ ] **Step 1: Run Markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: exits 0.

- [ ] **Step 2: Run actionlint if available**

Run:

```bash
if command -v actionlint >/dev/null 2>&1; then actionlint .github/workflows/plugin-release-bump.yml; else echo "actionlint not installed; inspected workflow manually"; fi
```

Expected: exits 0. If `actionlint` is not installed, the command prints the
manual-inspection message and exits 0.

- [ ] **Step 3: Inspect auto-merge safety constraints**

Run:

```bash
rg -n -- '--admin|continue-on-error|\\|\\| true|pull-request-operation|pull-request-number|gh pr merge' .github/workflows/plugin-release-bump.yml
```

Expected: output includes `pull-request-operation`, `pull-request-number`, and
`gh pr merge "$PR_NUMBER" --auto --squash`; output does not include `--admin`,
`continue-on-error`, or `|| true`.

- [ ] **Step 4: Commit the implementation**

Run:

```bash
git add .github/workflows/plugin-release-bump.yml docs/release-flow.md docs/superpowers/plans/2026-04-27-41-auto-merge-release-bump-prs-plan.md
git commit -m "feat: #41 auto-merge release bump PRs"
```

Expected: commit succeeds and contains the workflow, release-flow doc, and plan
artifact changes.
