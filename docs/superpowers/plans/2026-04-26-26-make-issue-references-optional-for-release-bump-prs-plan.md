# Make Issue References Optional for Release Bump PRs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make issue references optional for release bump PRs and repo commit/PR policy while preserving conventional commit hygiene.

**Architecture:** Update the release-bump workflow output first, then relax the shared validation paths that currently enforce issue IDs. Finish by aligning contributor-facing docs and templates so humans see the same policy that automation enforces.

**Tech Stack:** GitHub Actions YAML, `peter-evans/create-pull-request`, `amannn/action-semantic-pull-request`, commitlint, Commitizen, Markdown docs, `pnpm`, `actionlint`.

---

## File Structure

- `.github/workflows/plugin-release-bump.yml`: generated release bump PR title, commit message, and body.
- `.github/workflows/lint-pr.yml`: PR title/body policy enforced in CI.
- `commitlint.config.js`: local commit-message policy enforced by Husky and `pnpm exec commitlint`.
- `commitizen.config.js`: guided commit prompt behavior.
- `.github/pull_request_template.md`: contributor-facing PR title and linked-issue guidance.
- `AGENTS.md`: canonical agent repository rules.
- `CONTRIBUTING.md`: contributor-facing commit and PR rules.
- `docs/release-flow.md`: plugin release flow documentation.

## Task 1: Update Generated Release Bump PR Output

**Files:**

- Modify: `.github/workflows/plugin-release-bump.yml`

- [ ] **Step 1: Inspect the current release PR creation block**

Run:

```bash
sed -n '108,130p' .github/workflows/plugin-release-bump.yml
```

Expected: output shows `title`, `commit-message`, and body text containing the hardcoded issue #12 release reference.

- [ ] **Step 2: Remove the generated hardcoded issue references**

In `.github/workflows/plugin-release-bump.yml`, replace the `Create PR` `with:` block values so they match:

```yaml
          title: "chore: bump ${{ steps.inputs.outputs.plugin }} to ${{ steps.inputs.outputs.tag }}"
          commit-message: "chore: bump ${{ steps.inputs.outputs.plugin }} to ${{ steps.inputs.outputs.tag }}"
          body: |
            Automated bump from a new tagged release of `${{ steps.inputs.outputs.plugin }}`.

            - Plugin: `${{ steps.inputs.outputs.plugin }}`
            - Tag: `${{ steps.inputs.outputs.tag }}`
            - Source repo: `${{ steps.inputs.outputs.repo }}`
          delete-branch: true
```

- [ ] **Step 3: Verify AC-26-1 by searching for removed generated text**

Run:

```bash
rg -n "Closes the marketplace side|#12 bump|patinaproject/skills#12" .github/workflows/plugin-release-bump.yml
```

Expected: command exits with no matches.

- [ ] **Step 4: Commit Task 1**

Run:

```bash
git add .github/workflows/plugin-release-bump.yml
git commit -m "ci: #26 remove release bump issue reference"
```

Expected: commit succeeds.

## Task 2: Relax Commit and PR Validation Policy

**Files:**

- Modify: `commitlint.config.js`
- Modify: `commitizen.config.js`
- Modify: `.github/workflows/lint-pr.yml`

- [ ] **Step 1: Update commitlint to require only conventional commits with non-empty subjects**

Replace the custom `ticket-required` plugin in `commitlint.config.js` with built-in subject validation:

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-empty": [2, "always"],
    "subject-case": [0],
    "subject-empty": [2, "never"],
    "subject-max-length": [2, "always", 72]
  }
};
```

- [ ] **Step 2: Make Commitizen ticket entry optional**

In `commitizen.config.js`, set the ticket requirement to false and update the prompt:

```js
  allowTicketNumber: true,
  isTicketNumberRequired: false,
  ticketNumberPrefix: "",
  ticketNumberRegExp: "#\\d+",
  prependTicketToHead: false,
  skipQuestions: ["scope", "body", "footer"],
  messages: {
    type: "Select the type of change you're committing:",
    ticketNumber: "Enter the GitHub issue reference, if any (e.g. #1):\n",
    subject: "Write a short description of the change:\n",
    confirmCommit: "Are you sure you want to proceed with the commit above?"
  },
```

- [ ] **Step 3: Relax PR title linting**

In `.github/workflows/lint-pr.yml`, update the semantic PR title step so the step name and subject pattern no longer require an issue reference:

```yaml
      - name: Validate conventional commit title
        # amannn/action-semantic-pull-request@v5.5.3
        uses: amannn/action-semantic-pull-request@0723387faaf9b38adef4775cd42cfd5155ed6017
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            chore
            style
            refactor
            perf
            test
            build
            ci
            revert
          requireScope: false
          disallowScopes: |
            .+
          subjectPattern: '^.+$'
          subjectPatternError: |
            PR title subject cannot be empty.
            Scopes are not permitted. See AGENTS.md for conventions.
          ignoreLabels: |
            dependencies
```

- [ ] **Step 4: Relax PR body closing-keyword linting**

In `.github/workflows/lint-pr.yml`, rename the closing-keyword job and keep only the non-empty body requirement. The end of the script should say:

```bash
          if printf '%s' "$sanitized" | grep -qiE \
            '(^|[^A-Za-z])(close[sd]?|fix(e[sd])?|resolve[sd]?)[ \t]+([A-Za-z0-9._-]+/[A-Za-z0-9._-]+)?#[1-9][0-9]*([^0-9A-Za-z_]|$)'; then
            echo "Closing keyword found."
            exit 0
          fi
          echo "No closing keyword found; linked issues are optional."
```

Also change the empty-body error to:

```bash
            echo "::error::PR body is empty. Fill in the PR template."
```

- [ ] **Step 5: Update the breaking-change example**

In `.github/workflows/lint-pr.yml`, replace the example `feat!: #123 ...` with:

```bash
feat!: add new API
```

- [ ] **Step 6: Verify AC-26-2 with a no-issue commit message**

Run:

```bash
printf 'chore: bump bootstrap to v1.2.3\n' >/tmp/skills-commit-msg-no-issue
pnpm exec commitlint --edit /tmp/skills-commit-msg-no-issue
```

Expected: command exits 0.

- [ ] **Step 7: Verify issue references still work when meaningful**

Run:

```bash
printf 'chore: #26 bump bootstrap to v1.2.3\n' >/tmp/skills-commit-msg-with-issue
pnpm exec commitlint --edit /tmp/skills-commit-msg-with-issue
```

Expected: command exits 0.

- [ ] **Step 8: Verify workflow syntax**

Run:

```bash
actionlint .github/workflows/lint-pr.yml .github/workflows/plugin-release-bump.yml
```

Expected: command exits 0.

- [ ] **Step 9: Commit Task 2**

Run:

```bash
git add commitlint.config.js commitizen.config.js .github/workflows/lint-pr.yml
git commit -m "ci: #26 make issue references optional"
```

Expected: commit succeeds.

## Task 3: Align Contributor Docs and Templates

**Files:**

- Modify: `.github/pull_request_template.md`
- Modify: `AGENTS.md`
- Modify: `CONTRIBUTING.md`
- Modify: `docs/release-flow.md`

- [ ] **Step 1: Update the PR template title examples**

In `.github/pull_request_template.md`, make the opening title guidance read:

```markdown
PR title rule for squash merges: use conventional-commit format for the PR title so the squash commit can be reused unchanged. Issue IDs are optional.

`type: short description`

Examples:

- `docs: add bootstrap skill guide`
- `chore: bootstrap commit hooks`
```

Leave the `## Linked issue` section present and optional with its existing `Omit this section when no issue applies` guidance.

- [ ] **Step 2: Update AGENTS.md commit and PR guidance**

In `AGENTS.md`, update the commit command description and commit/PR examples to:

```markdown
- `pnpm commit`: create a guided conventional commit
```

```markdown
Commits must use conventional commit types with no scopes. GitHub issue tags are optional:

`type: short description`

Examples:

- `chore: bootstrap marketplace repo`
- `feat: add superteam marketplace entry`

For squash-and-merge workflows, PR titles must match the commitlint commit format:

`type: short description`
```

- [ ] **Step 3: Update CONTRIBUTING.md commit and PR guidance**

In `CONTRIBUTING.md`, update the commit section to:

````markdown
Commits must follow Conventional Commits with no scope. GitHub issue tags are optional:

```text
type: short description
```

Examples:

- `feat: add a feature`
- `docs: clarify install steps`

The `commit-msg` hook enforces the conventional-commit format. PR titles follow the same format so the squash commit can be reused verbatim.
````

Also update the PR bullet to:

```markdown
- Include an `Acceptance Criteria` section when a linked issue defines ACs.
```

- [ ] **Step 4: Update release-flow examples**

In `docs/release-flow.md`, update the automated and manual bump examples to:

```markdown
opens a bump PR titled `chore: bump <plugin> to <tag>`
```

and:

```markdown
then open a PR with `chore: bump <plugin> to <tag>`.
```

- [ ] **Step 5: Verify removed-policy text is gone from active docs and workflows**

Run:

```bash
rg -n "Closes the marketplace side|#12 bump|PR title subject must start|must contain a GitHub closing|isTicketNumberRequired: true|ticket-required|feat!: #123" .github AGENTS.md CONTRIBUTING.md docs/release-flow.md commitlint.config.js commitizen.config.js
```

Expected: command exits with no matches in the active policy surface. Historical design and plan docs are intentionally excluded because they may quote old policy text as context.

- [ ] **Step 6: Verify Markdown formatting**

Run:

```bash
pnpm lint:md
```

Expected: command exits 0.

- [ ] **Step 7: Commit Task 3**

Run:

```bash
git add .github/pull_request_template.md AGENTS.md CONTRIBUTING.md docs/release-flow.md
git commit -m "docs: #26 document optional issue references"
```

Expected: commit succeeds.

## Task 4: Final Verification

**Files:**

- Read: all files changed in Tasks 1-3.

- [ ] **Step 1: Run all verification commands together**

Run:

```bash
printf 'chore: bump bootstrap to v1.2.3\n' >/tmp/skills-commit-msg-no-issue
pnpm exec commitlint --edit /tmp/skills-commit-msg-no-issue
printf 'chore: #26 bump bootstrap to v1.2.3\n' >/tmp/skills-commit-msg-with-issue
pnpm exec commitlint --edit /tmp/skills-commit-msg-with-issue
pnpm lint:md
actionlint .github/workflows/lint-pr.yml .github/workflows/plugin-release-bump.yml
```

Expected: every command exits 0.

- [ ] **Step 2: Inspect final diff for scope**

Run:

```bash
git diff origin/main...HEAD --stat
git diff origin/main...HEAD -- .github/workflows/plugin-release-bump.yml .github/workflows/lint-pr.yml commitlint.config.js commitizen.config.js .github/pull_request_template.md AGENTS.md CONTRIBUTING.md docs/release-flow.md
```

Expected: diff only changes issue-reference policy, release PR generated text, and related docs/templates.

- [ ] **Step 3: Commit any final verification-only fixes**

If Task 4 discovers formatting or wording fixes, commit them:

```bash
git add .github/workflows/plugin-release-bump.yml .github/workflows/lint-pr.yml commitlint.config.js commitizen.config.js .github/pull_request_template.md AGENTS.md CONTRIBUTING.md docs/release-flow.md
git commit -m "chore: #26 finalize optional issue reference policy"
```

Expected: no commit is needed if Tasks 1-3 were clean.

## Self-Review

- Spec coverage: Tasks 1-3 cover AC-26-1 through AC-26-5. Task 4 repeats the verification evidence for the Executor handoff.
- Placeholder scan: the plan uses `<plugin>` and `<tag>` only as literal release-flow documentation examples that must appear in the target docs.
- Scope check: the plan does not touch marketplace manifests, release dispatch behavior, dependency installation, or label policy.
