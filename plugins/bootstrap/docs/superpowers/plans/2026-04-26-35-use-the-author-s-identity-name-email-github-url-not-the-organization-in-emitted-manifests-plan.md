# Plan: Use the author's identity (name, email, GitHub URL), not the organization, in emitted manifests [#35](https://github.com/patinaproject/bootstrap/issues/35)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Emit a single human author identity record across `package.json`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json`.

**Architecture:** This is a templates-first baseline change. The bootstrap skill documentation and audit checklist define the prompt and realignment contract; the three manifest templates encode the emitted author record; the bootstrap repo root files mirror those templates for this repository.

**Tech Stack:** Markdown skill docs, JSON templates, root JSON manifests, PNPM markdownlint and version checks.

---

## Source References

Approved design:
`docs/superpowers/specs/2026-04-26-35-use-the-author-s-identity-name-email-github-url-not-the-organization-in-emitted-manifests-design.md`

Design handoff commit: `cf26aa1`

Active acceptance criteria:

- `AC-35-1`: authenticated `gh` produces consistent author blocks.
- `AC-35-2`: unauthenticated `gh` falls back to a required handle prompt.
- `AC-35-3`: repository URLs stay owner/repo URLs.
- `AC-35-4`: realignment flags org-based author URLs.

## File Structure

- `skills/bootstrap/SKILL.md`: prompt table, author identity behavior, and realignment contract.
- `skills/bootstrap/audit-checklist.md`: concrete audit checks for package and plugin author blocks.
- `skills/bootstrap/templates/core/package.json.tmpl`: core package author record.
- `skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl`: Claude plugin author record.
- `skills/bootstrap/templates/agent-plugin/.codex-plugin/plugin.json.tmpl`: Codex plugin author record.
- `package.json`: mirrored root package author record for this repo.
- `.claude-plugin/plugin.json`: mirrored root Claude plugin author record for this repo.
- `.codex-plugin/plugin.json`: mirrored root Codex plugin author record for this repo.

## Task 1: Template and Skill Contract Updates

**Files:**

- Modify: `skills/bootstrap/SKILL.md`
- Modify: `skills/bootstrap/audit-checklist.md`
- Modify: `skills/bootstrap/templates/core/package.json.tmpl`
- Modify: `skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl`
- Modify: `skills/bootstrap/templates/agent-plugin/.codex-plugin/plugin.json.tmpl`

- [ ] **Step 1: Capture current failing evidence**

Run:

```bash
rg -n '"url": "https://github.com/\{\{owner\}\}"|"email": "\{\{author-email\}\}"|"url": "https://github.com/\{\{author-handle\}\}"' \
  skills/bootstrap/templates/core/package.json.tmpl \
  skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl \
  skills/bootstrap/templates/agent-plugin/.codex-plugin/plugin.json.tmpl
```

Expected before implementation: plugin manifest templates show owner-based
author URLs, `package.json.tmpl` has no author URL, and plugin manifests have no
author email.

- [ ] **Step 2: Update prompt and behavior docs**

In `skills/bootstrap/SKILL.md`:

- Change the prompt intro to mention that `<author-handle>` is resolved by
  `gh api user --jq .login` and otherwise prompted with no default.
- Add a prompt row:
  `| <author-handle> | from gh api user --jq .login | prompted if unavailable; written into author.url |`
- Update `<author-name>` and `<author-email>` notes so they say the values are
  written into all author blocks, not only `package.json`.
- Add a convention bullet explaining that author identity is name/email/GitHub
  profile URL and repository URLs remain owner/repo URLs.
- Add a realignment sentence requiring org-based author URLs to be reported as
  divergences.

- [ ] **Step 3: Update audit checklist**

In `skills/bootstrap/audit-checklist.md`:

- Update the `package.json` check so it requires `author.name`, `author.email`,
  and `author.url`.
- Update `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` checks so
  they require author name, email, and URL.
- Add one concise note that author URL must point to the resolved
  `https://github.com/<author-handle>`, not the repository owner URL.

- [ ] **Step 4: Update manifest templates**

Change `skills/bootstrap/templates/core/package.json.tmpl` author block to:

```json
  "author": {
    "name": "{{author-name}}",
    "email": "{{author-email}}",
    "url": "https://github.com/{{author-handle}}"
  },
```

Change both plugin manifest author blocks to:

```json
  "author": {
    "name": "{{author-name}}",
    "email": "{{author-email}}",
    "url": "https://github.com/{{author-handle}}"
  },
```

- [ ] **Step 5: Verify template evidence**

Run:

```bash
rg -n '\{\{author-handle\}\}|\{\{author-email\}\}|https://github.com/\{\{owner\}\}/\{\{repo\}\}|https://github.com/\{\{owner\}\}"' \
  skills/bootstrap/SKILL.md \
  skills/bootstrap/audit-checklist.md \
  skills/bootstrap/templates/core/package.json.tmpl \
  skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl \
  skills/bootstrap/templates/agent-plugin/.codex-plugin/plugin.json.tmpl
```

Expected: `{{author-handle}}` appears in author URL docs and the three author
blocks; `{{author-email}}` appears in all three author blocks; owner/repo URLs
remain in plugin repository fields; no plugin author URL still uses bare
`{{owner}}`.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add skills/bootstrap/SKILL.md skills/bootstrap/audit-checklist.md \
  skills/bootstrap/templates/core/package.json.tmpl \
  skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl \
  skills/bootstrap/templates/agent-plugin/.codex-plugin/plugin.json.tmpl
git commit -m "fix: #35 emit author identity in templates"
```

## Task 2: Root Mirror Updates

**Files:**

- Modify: `package.json`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.codex-plugin/plugin.json`

- [ ] **Step 1: Resolve author handle for this repo**

Run:

```bash
gh api user --jq .login
```

Expected for this branch: `tlmader`.

- [ ] **Step 2: Mirror package author**

Update root `package.json` author block to include:

```json
  "author": {
    "name": "Ted Mader",
    "email": "ted@patinaproject.com",
    "url": "https://github.com/tlmader"
  },
```

- [ ] **Step 3: Mirror plugin manifest authors**

Update both `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` author
blocks to include:

```json
  "author": {
    "name": "Ted Mader",
    "email": "ted@patinaproject.com",
    "url": "https://github.com/tlmader"
  },
```

Keep `homepage`, `repository`, `websiteURL`, `privacyPolicyURL`, and
`termsOfServiceURL` pointed at `https://github.com/patinaproject/bootstrap`.

- [ ] **Step 4: Verify root mirror evidence**

Run:

```bash
node -e '
const fs = require("node:fs");
for (const file of ["package.json", ".claude-plugin/plugin.json", ".codex-plugin/plugin.json"]) {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  console.log(file, JSON.stringify(json.author));
}
'
```

Expected: all three files print the same author object with `url` equal to
`https://github.com/tlmader`.

Run:

```bash
rg -n 'https://github.com/patinaproject/bootstrap|https://github.com/tlmader' \
  .claude-plugin/plugin.json .codex-plugin/plugin.json package.json
```

Expected: author URLs use `tlmader`; repository fields still use
`patinaproject/bootstrap`.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add package.json .claude-plugin/plugin.json .codex-plugin/plugin.json
git commit -m "fix: #35 mirror author identity manifests"
```

## Task 3: Verification and Review

**Files:**

- Verify: all files changed by Tasks 1 and 2.

- [ ] **Step 1: Run markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: exit 0.

- [ ] **Step 2: Run version lockstep check**

Run:

```bash
pnpm check:versions
```

Expected: exit 0 and all manifests at the package version.

- [ ] **Step 3: Run targeted author checks**

Run:

```bash
node -e '
const fs = require("node:fs");
const expected = { name: "Ted Mader", email: "ted@patinaproject.com", url: "https://github.com/tlmader" };
for (const file of ["package.json", ".claude-plugin/plugin.json", ".codex-plugin/plugin.json"]) {
  const actual = JSON.parse(fs.readFileSync(file, "utf8")).author;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error(file, actual);
    process.exit(1);
  }
}
'
```

Expected: exit 0.

- [ ] **Step 4: Verify AC-35-3 repository URLs**

Run:

```bash
node -e '
const fs = require("node:fs");
for (const file of [".claude-plugin/plugin.json", ".codex-plugin/plugin.json"]) {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (json.homepage !== "https://github.com/patinaproject/bootstrap") process.exit(1);
  if (json.repository !== "https://github.com/patinaproject/bootstrap") process.exit(1);
}
const codex = JSON.parse(fs.readFileSync(".codex-plugin/plugin.json", "utf8"));
for (const key of ["websiteURL", "privacyPolicyURL", "termsOfServiceURL"]) {
  if (codex.interface[key] !== "https://github.com/patinaproject/bootstrap") process.exit(1);
}
'
```

Expected: exit 0.

- [ ] **Step 5: Review skill pressure scenario**

Read the final `skills/bootstrap/SKILL.md` and `skills/bootstrap/audit-checklist.md`
as a future realignment agent. Confirm the docs make this scenario unambiguous:
a plugin repo owned by `patinaproject` but authored by `tlmader` must rewrite
`author.url` from `https://github.com/patinaproject` to
`https://github.com/tlmader` while preserving `homepage` and `repository`.

- [ ] **Step 6: Commit verification fixes only if needed**

If verification finds a bug, fix it and commit with:

```bash
git add <fixed-files>
git commit -m "fix: #35 tighten author identity verification"
```
