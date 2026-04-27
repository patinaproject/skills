# Make Issue References Optional for Release Bump PRs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limit no-issue PR and commit wording to bot-generated release bump PRs while preserving issue-ID requirements for human commits and PRs.

**Architecture:** Keep the release-bump workflow output issue-free, then restore human-facing commit and PR validation to require issue references. Add a narrow PR lint exception keyed to `github-actions[bot]` and `bot/bump-*` branches, and document that exception only in release-bump guidance.

**Tech Stack:** GitHub Actions YAML, `peter-evans/create-pull-request`, `amannn/action-semantic-pull-request`, commitlint, Commitizen, Markdown docs, `pnpm`, `actionlint`.

---

## File Structure

- `.github/workflows/plugin-release-bump.yml`: generated release bump PR title, commit message, and body.
- `.github/workflows/lint-pr.yml`: PR title/body policy, including the bot bump exception.
- `commitlint.config.js`: local commit-message policy for human commits.
- `commitizen.config.js`: guided human commit prompts.
- `.github/pull_request_template.md`: human PR title and linked-issue guidance.
- `AGENTS.md`: canonical agent repository rules.
- `CONTRIBUTING.md`: contributor-facing commit and PR rules.
- `docs/release-flow.md`: release-bump exception documentation.

## Task 1: Keep Bot Release Bump Output Issue-Free

**Files:**

- Modify: `.github/workflows/plugin-release-bump.yml`

- [ ] **Step 1: Inspect the current release PR creation block**

Run:

```bash
sed -n '108,130p' .github/workflows/plugin-release-bump.yml
```

Expected: the `Create PR` block is visible.

- [ ] **Step 2: Ensure generated bot bump PRs omit issue references**

In `.github/workflows/plugin-release-bump.yml`, keep the `Create PR` values as:

```yaml
          branch: bot/bump-${{ steps.inputs.outputs.plugin }}-${{ steps.inputs.outputs.tag }}
          base: main
          title: "chore: bump ${{ steps.inputs.outputs.plugin }} to ${{ steps.inputs.outputs.tag }}"
          commit-message: "chore: bump ${{ steps.inputs.outputs.plugin }} to ${{ steps.inputs.outputs.tag }}"
          body: |
            Automated bump from a new tagged release of `${{ steps.inputs.outputs.plugin }}`.

            - Plugin: `${{ steps.inputs.outputs.plugin }}`
            - Tag: `${{ steps.inputs.outputs.tag }}`
            - Source repo: `${{ steps.inputs.outputs.repo }}`
```

- [ ] **Step 3: Verify AC-26-1**

Run:

```bash
rg -n "Closes the marketplace side|#12 bump|patinaproject/skills#12" .github/workflows/plugin-release-bump.yml
```

Expected: command exits with no matches.

- [ ] **Step 4: Commit Task 1 if changed**

Run:

```bash
git add .github/workflows/plugin-release-bump.yml
git commit -m "ci: #26 remove release bump issue reference"
```

Expected: commit succeeds if the workflow changed; skip if already committed.

## Task 2: Restore Human Commit Policy

**Files:**

- Modify: `commitlint.config.js`
- Modify: `commitizen.config.js`

- [ ] **Step 1: Restore commitlint issue-ID enforcement**

Set `commitlint.config.js` to:

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "ticket-required": (parsed) => {
          const { subject } = parsed;
          if (!subject) {
            return [false, "Subject cannot be empty"];
          }

          if (!/^#\d+\s+/.test(subject)) {
            return [
              false,
              "Subject must start with a GitHub issue reference. Use `type: #123 description`."
            ];
          }

          return [true, ""];
        }
      }
    }
  ],
  rules: {
    "scope-empty": [2, "always"],
    "subject-case": [0],
    "subject-max-length": [2, "always", 72],
    "ticket-required": [2, "always"]
  }
};
```

- [ ] **Step 2: Restore Commitizen required ticket prompt**

In `commitizen.config.js`, set:

```js
  allowTicketNumber: true,
  isTicketNumberRequired: true,
  ticketNumberPrefix: "",
  ticketNumberRegExp: "#\\d+",
  prependTicketToHead: false,
  skipQuestions: ["scope", "body", "footer"],
  messages: {
    type: "Select the type of change you're committing:",
    ticketNumber: "Enter the GitHub issue reference (e.g. #1):\n",
    subject: "Write a short description of the change:\n",
    confirmCommit: "Are you sure you want to proceed with the commit above?"
  },
```

- [ ] **Step 3: Verify AC-26-2 human no-issue commits fail**

Run:

```bash
printf 'chore: bump bootstrap to v1.2.3\n' >/tmp/skills-commit-msg-no-issue
pnpm exec commitlint --edit /tmp/skills-commit-msg-no-issue
```

Expected: command exits non-zero with `ticket-required`.

- [ ] **Step 4: Verify issue-tagged commits still pass**

Run:

```bash
printf 'chore: #26 bump bootstrap to v1.2.3\n' >/tmp/skills-commit-msg-with-issue
pnpm exec commitlint --edit /tmp/skills-commit-msg-with-issue
```

Expected: command exits 0.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add commitlint.config.js commitizen.config.js
git commit -m "ci: #26 restore human issue reference commits"
```

Expected: commit succeeds.

## Task 3: Narrow PR Lint Exception to Bot Bumps

**Files:**

- Modify: `.github/workflows/lint-pr.yml`

- [ ] **Step 1: Restore normal PR title issue-ID enforcement**

In `.github/workflows/lint-pr.yml`, the normal semantic PR step should run unless the PR is from `github-actions[bot]` on a `bot/bump-*` branch:

```yaml
      - name: Validate conventional commits + issue ref
        if: "${{ github.event.pull_request.user.login != 'github-actions[bot]' || !startsWith(github.event.pull_request.head.ref, 'bot/bump-') }}"
```

Its subject pattern and error should be:

```yaml
          subjectPattern: '^#\d+ .+$'
          subjectPatternError: |
            PR title subject must start with a GitHub issue reference. Example:
              feat: #123 add boot timeline
              fix: #456 restore search
            Scopes are not permitted. See AGENTS.md for conventions.
```

- [ ] **Step 2: Add the bot release bump title exception**

Add a second semantic PR step:

```yaml
      - name: Validate bot release bump title
        if: "${{ github.event.pull_request.user.login == 'github-actions[bot]' && startsWith(github.event.pull_request.head.ref, 'bot/bump-') }}"
        # amannn/action-semantic-pull-request@v5.5.3
        uses: amannn/action-semantic-pull-request@0723387faaf9b38adef4775cd42cfd5155ed6017
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            chore
          requireScope: false
          disallowScopes: |
            .+
          subjectPattern: '^bump .+$'
          subjectPatternError: |
            Bot release bump PR titles must use: chore: bump <plugin> to <tag>
            Scopes are not permitted. This no-issue exception is only for github-actions[bot] bot/bump-* PRs.
```

- [ ] **Step 3: Restore normal PR body closing-keyword enforcement**

The PR body job should reject non-bot-bump PRs without a closing keyword and allow only `github-actions[bot]` `bot/bump-*` PRs to omit one:

```bash
          if printf '%s' "$sanitized" | grep -qiE \
            '(^|[^A-Za-z])(close[sd]?|fix(e[sd])?|resolve[sd]?)[ \t]+([A-Za-z0-9._-]+/[A-Za-z0-9._-]+)?#[1-9][0-9]*([^0-9A-Za-z_]|$)'; then
            echo "Closing keyword found."
            exit 0
          fi
          if [ "$PR_USER" = "github-actions[bot]" ]; then
            case "$PR_HEAD_REF" in
              bot/bump-*)
                echo "No closing keyword found; allowed for bot-generated release bump PR."
                exit 0
                ;;
            esac
          fi
          echo "::error::PR body must contain a GitHub closing keyword (e.g. 'Closes #123') outside code blocks, HTML comments, strikethrough, and blockquotes."
          exit 1
```

- [ ] **Step 4: Verify workflow syntax**

Run:

```bash
actionlint .github/workflows/lint-pr.yml .github/workflows/plugin-release-bump.yml
```

Expected: command exits 0.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add .github/workflows/lint-pr.yml
git commit -m "ci: #26 limit issue exception to bot bumps"
```

Expected: commit succeeds.

## Task 4: Align Documentation With Narrow Exception

**Files:**

- Modify: `.github/pull_request_template.md`
- Modify: `AGENTS.md`
- Modify: `CONTRIBUTING.md`
- Modify: `docs/release-flow.md`

- [ ] **Step 1: Restore human PR title examples**

In `.github/pull_request_template.md`, use:

```markdown
`type: #123 short description`

Examples:

- `docs: #12 add bootstrap skill guide`
- `chore: #34 bootstrap commit hooks`

Bot-generated release bump PRs from `bot/bump-*` branches are the only no-issue exception.
```

- [ ] **Step 2: Restore AGENTS.md and CONTRIBUTING.md human issue guidance**

Both docs must state that human commits and PR titles require issue tags, and both must mention the only exception:

```markdown
Bot-generated release bump PRs from `bot/bump-*` branches are the only no-issue exception.
```

- [ ] **Step 3: Document bot bump exception in release flow**

In `docs/release-flow.md`, document that automated release bumps use:

```markdown
`chore: bump <plugin> to <tag>`
```

and that manual bumps use:

```markdown
`chore: #<issue> bump <plugin> to <tag>`
```

- [ ] **Step 4: Verify active policy text**

Run:

```bash
rg -n "Issue IDs are optional|GitHub issue tags are optional|No closing keyword found; linked issues are optional|subjectPattern: '\\^\\.\\+\\$'|isTicketNumberRequired: false" .github AGENTS.md CONTRIBUTING.md docs/release-flow.md commitlint.config.js commitizen.config.js
```

Expected: command exits with no matches.

- [ ] **Step 5: Verify Markdown formatting**

Run:

```bash
pnpm lint:md
```

Expected: command exits 0.

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add .github/pull_request_template.md AGENTS.md CONTRIBUTING.md docs/release-flow.md
git commit -m "docs: #26 document bot bump issue exception"
```

Expected: commit succeeds.

## Task 5: Final Verification

**Files:**

- Read: all files changed in Tasks 1-4.

- [ ] **Step 1: Run all verification commands**

Run:

```bash
printf 'chore: bump bootstrap to v1.2.3\n' >/tmp/skills-commit-msg-no-issue
pnpm exec commitlint --edit /tmp/skills-commit-msg-no-issue
printf 'chore: #26 bump bootstrap to v1.2.3\n' >/tmp/skills-commit-msg-with-issue
pnpm exec commitlint --edit /tmp/skills-commit-msg-with-issue
pnpm lint:md
actionlint .github/workflows/lint-pr.yml .github/workflows/plugin-release-bump.yml
rg -n "Issue IDs are optional|GitHub issue tags are optional|No closing keyword found; linked issues are optional|subjectPattern: '\\^\\.\\+\\$'|isTicketNumberRequired: false" .github AGENTS.md CONTRIBUTING.md docs/release-flow.md commitlint.config.js commitizen.config.js
```

Expected: no-issue commitlint exits non-zero, issue-tagged commitlint exits 0, lint commands exit 0, and the final `rg` exits with no matches.

- [ ] **Step 2: Inspect final diff for scope**

Run:

```bash
git diff origin/main...HEAD --stat
git diff origin/main...HEAD -- .github/workflows/plugin-release-bump.yml .github/workflows/lint-pr.yml commitlint.config.js commitizen.config.js .github/pull_request_template.md AGENTS.md CONTRIBUTING.md docs/release-flow.md
```

Expected: release bump output remains no-issue, and all human-facing policy remains issue-required except the documented bot bump exception.

## Self-Review

- Spec coverage: Tasks 1-4 cover AC-26-1 through AC-26-5.
- Placeholder scan: `<plugin>`, `<tag>`, and `#<issue>` are literal documented examples in release-flow and title guidance.
- Scope check: the plan does not touch marketplace manifests, release dispatch behavior, dependency installation, or label policy.
