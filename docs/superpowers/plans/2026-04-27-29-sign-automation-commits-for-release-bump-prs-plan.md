# Sign Automation Commits for Release Bump PRs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the plugin release-bump workflow so automated PR commits are signed with supported bot credentials, and document the token expectations.

**Architecture:** Keep the existing release-bump workflow and manifest update logic intact. Upgrade only the `peter-evans/create-pull-request` action reference to a pinned release that supports `sign-commits`, enable that input, and add a short release-flow note explaining the supported signing path.

**Tech Stack:** GitHub Actions YAML, Markdown docs, `pnpm`, `markdownlint-cli2`, `gh`, `git`.

---

## Task 1: Enable Signed Commits in the Release-Bump Workflow

**Files:**

- Modify: `.github/workflows/plugin-release-bump.yml`

- [ ] **Step 1: Confirm the pinned action SHA for the target action release**

Run:

```bash
git ls-remote --tags --sort='v:refname' https://github.com/peter-evans/create-pull-request.git 'refs/tags/v8.1.1'
```

Expected: one line whose SHA is exactly:

```text
5f6978faf089d4d20b00c7766989d076bb2fc7f1 refs/tags/v8.1.1
```

- [ ] **Step 2: Update the create-pull-request action comment and pinned SHA**

In `.github/workflows/plugin-release-bump.yml`, replace:

```yaml
        # peter-evans/create-pull-request@v6.1.0
        uses: peter-evans/create-pull-request@c5a7806660adbe173f04e3e038b0ccdcd758773c
```

with:

```yaml
        # peter-evans/create-pull-request@v8.1.1
        uses: peter-evans/create-pull-request@5f6978faf089d4d20b00c7766989d076bb2fc7f1
```

- [ ] **Step 3: Enable bot commit signing**

In the same `with:` block, add `sign-commits: true` before the branch
configuration:

```yaml
          sign-commits: true
          branch: bot/bump-${{ steps.inputs.outputs.plugin }}-${{ steps.inputs.outputs.tag }}
```

- [ ] **Step 4: Inspect the workflow for conflicting identity inputs**

Run:

```bash
rg -n "sign-commits|author:|committer:" .github/workflows/plugin-release-bump.yml
```

Expected: `sign-commits: true` is present, and no `author:` or `committer:`
inputs are present in the `Create PR` step.

## Task 2: Document Bot Signing Expectations

**Files:**

- Modify: `docs/release-flow.md`

- [ ] **Step 1: Add a release-flow note after the lifecycle list**

After the lifecycle paragraph that explains maintainer review and merge, add:

```markdown
The release-bump PR workflow enables commit signing in
`peter-evans/create-pull-request`, so commits are expected to be signed and
verified as `github-actions[bot]` when the workflow uses the repository's
default `GITHUB_TOKEN`. Do not switch this workflow to a PAT while expecting
bot signature verification; PAT-created PRs are not the supported path for this
signing mode.
```

- [ ] **Step 2: Keep the manual fallback behavior unchanged**

Inspect the manual fallback section:

```bash
sed -n '/## Manual fallback/,/## Consuming bootstrap/p' docs/release-flow.md
```

Expected: manual maintainers are still instructed to open PRs normally, and the
new bot-signing note does not imply manual commits are signed by automation.

## Task 3: Validate, Commit, and Prepare Handoff

**Files:**

- Modify: `.github/workflows/plugin-release-bump.yml`
- Modify: `docs/release-flow.md`

- [ ] **Step 1: Run Markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: exit code `0`.

- [ ] **Step 2: Verify the workflow action pin is a full SHA**

Run:

```bash
python - <<'PY'
from pathlib import Path
import re
text = Path(".github/workflows/plugin-release-bump.yml").read_text()
match = re.search(r"peter-evans/create-pull-request@([0-9a-f]{40})", text)
assert match, "create-pull-request action is not pinned to a full 40-character SHA"
assert "sign-commits: true" in text, "sign-commits input is missing"
assert "author:" not in text and "committer:" not in text, "custom author/committer inputs conflict with bot signing"
print(match.group(1))
PY
```

Expected:

```text
5f6978faf089d4d20b00c7766989d076bb2fc7f1
```

- [ ] **Step 3: Commit the implementation**

Run:

```bash
git add .github/workflows/plugin-release-bump.yml docs/release-flow.md
git commit -m "ci: #29 sign release bump commits"
```

Expected: commit succeeds and Husky hooks pass.
