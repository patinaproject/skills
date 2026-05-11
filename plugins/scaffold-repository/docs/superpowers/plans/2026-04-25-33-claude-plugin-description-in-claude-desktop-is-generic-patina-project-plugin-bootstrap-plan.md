# Plan: Claude plugin description in Claude Desktop is generic ("Patina Project plugin: bootstrap") [#33](https://github.com/patinaproject/bootstrap/issues/33)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic auto-generated Claude Desktop plugin description with authored copy, propagated through the template-first round-trip required by AGENTS.md.

**Architecture:** Edit the template (`plugin.json.tmpl`) first – it is the single source of truth. Then manually mirror the change to the repo-root `.claude-plugin/plugin.json` (equivalent to running the bootstrap skill in realignment mode). Commit both sides together. The `{{repo-description}}` placeholder in the template is preserved for generated repos; only the root `plugin.json` (which is this repo's own installed manifest, not a generated file) receives the literal new copy.

**Tech Stack:** JSON, Markdown, `jq`, `pnpm lint:md`, `git`

**Design doc:** `docs/superpowers/specs/2026-04-25-33-claude-plugin-description-in-claude-desktop-is-generic-patina-project-plugin-bootstrap-design.md`

---

## File Structure

| File | Role | Action |
|---|---|---|
| `skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl` | Source of truth – template for generated repos | Modify: add a comment block above the `description` line guiding maintainers; the `{{repo-description}}` placeholder itself is preserved (AC-33-4) |
| `.claude-plugin/plugin.json` | Root mirror – this repo's own installed manifest | Modify: update the `description` field to the new agreed copy (AC-33-2) |

No other files are touched in this PR.

---

## Tasks

### T1: Edit the template (source of truth first)

**Files:**

- Modify: `skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl`

The template's `description` field already uses `{{repo-description}}`. No structural change is needed – the placeholder is already the right convention (AC-33-4). However, the template has no guidance on what good copy looks like, so adding an inline comment above the field makes the convention explicit for maintainers of generated repos.

Because JSON does not support comments, represent the guidance as a sibling field using a `_description_hint` key that bootstrap's realignment step is expected to strip, or simply leave the template as-is and accept that the placeholder is self-documenting. Per the design doc: "The existing convention is sufficient for AC-33-4." No structural change is required.

**Concrete action:** Confirm the template currently contains `"description": "{{repo-description}}"` and make no change to it (the placeholder satisfies AC-33-4 as-is). Document the verification result in the commit message.

- [ ] **Step 1: Read the template and confirm the placeholder is present**

```bash
grep '"description"' /Users/tlmader/dev/patinaproject-root/bootstrap/skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl
```

Expected output:

```text
  "description": "{{repo-description}}",
```

If the output matches, no edit is needed. Proceed to T2.

If the field is missing or has a different value, add or correct it:

```json
  "description": "{{repo-description}}",
```

- [ ] **Step 2: Verify JSON validity of the template (treat `{{…}}` as opaque strings)**

```bash
sed 's/{{[^}]*}}/PLACEHOLDER/g' /Users/tlmader/dev/patinaproject-root/bootstrap/skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl | jq .
```

Expected: `jq` parses without error and pretty-prints the object. If it errors, fix the JSON syntax before proceeding.

---

### T2: Mirror the change to the root `.claude-plugin/plugin.json`

**Files:**

- Modify: `.claude-plugin/plugin.json`

This is the manual realignment step – equivalent to running the bootstrap skill in realignment mode on this repo. Update the `description` field to the agreed copy from the design doc.

Agreed copy (shorter form, preferred for `plugin.json` where space is constrained, 124 chars):

> "Scaffold or realign repositories to the Patina Project baseline: commits, PRs, PNPM tooling, agent docs, and plugin surfaces."

- [ ] **Step 1: Read the current root `plugin.json`**

```bash
cat /Users/tlmader/dev/patinaproject-root/bootstrap/.claude-plugin/plugin.json
```

Current `description` value: `"Claude Code plugin that scaffolds and realigns repositories to the Patina Project baseline."`

- [ ] **Step 2: Update the `description` field**

Open `.claude-plugin/plugin.json` and replace:

```json
  "description": "Claude Code plugin that scaffolds and realigns repositories to the Patina Project baseline.",
```

with:

```json
  "description": "Scaffold or realign repositories to the Patina Project baseline: commits, PRs, PNPM tooling, agent docs, and plugin surfaces.",
```

All other fields remain unchanged.

- [ ] **Step 3: Verify JSON validity**

```bash
jq . /Users/tlmader/dev/patinaproject-root/bootstrap/.claude-plugin/plugin.json
```

Expected: `jq` pretty-prints the full object without error. If it errors, fix the JSON before continuing.

- [ ] **Step 4: Confirm the description value is exactly the agreed copy**

```bash
grep '"description"' /Users/tlmader/dev/patinaproject-root/bootstrap/.claude-plugin/plugin.json
```

Expected:

```text
  "description": "Scaffold or realign repositories to the Patina Project baseline: commits, PRs, PNPM tooling, agent docs, and plugin surfaces.",
```

---

### T3: Verify AC-33-2 (no drift between template and root)

AC-33-2 requires confirming that the template uses its placeholder and the root uses the literal agreed copy – and that neither has drifted from what was intended.

- [ ] **Step 1: Check template placeholder is still intact**

```bash
grep '"description"' /Users/tlmader/dev/patinaproject-root/bootstrap/skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl
```

Expected output contains `"description": "{{repo-description}}"`.

- [ ] **Step 2: Check root description is the new copy**

```bash
grep '"description"' /Users/tlmader/dev/patinaproject-root/bootstrap/.claude-plugin/plugin.json
```

Expected output contains `"description": "Scaffold or realign repositories to the Patina Project baseline: commits, PRs, PNPM tooling, agent docs, and plugin surfaces."`.

- [ ] **Step 3: Run markdown lint (no Markdown files were changed, but run as a sanity gate)**

```bash
cd /Users/tlmader/dev/patinaproject-root/bootstrap && pnpm lint:md
```

Expected: exits 0 with no lint errors.

---

### T4: Commit both changes together

Per AGENTS.md: "Commit the template change and the mirrored root change together." In this case the template itself required no structural edit (placeholder was already correct), so only the root file changes. Stage the root file and commit.

- [ ] **Step 1: Stage the changed file**

```bash
git -C /Users/tlmader/dev/patinaproject-root/bootstrap add .claude-plugin/plugin.json
```

If the template was edited in T1, also stage it:

```bash
git -C /Users/tlmader/dev/patinaproject-root/bootstrap add skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl
```

- [ ] **Step 2: Check staged diff**

```bash
git -C /Users/tlmader/dev/patinaproject-root/bootstrap diff --cached
```

Expected: only the `description` line in `.claude-plugin/plugin.json` changed (and optionally the template if it was touched).

- [ ] **Step 3: Commit**

```bash
git -C /Users/tlmader/dev/patinaproject-root/bootstrap commit -m "$(cat <<'EOF'
docs: #33 update Claude plugin description to authored copy

Template placeholder ({{repo-description}}) was already correct; no
template edit required. Mirrors the new description into root
.claude-plugin/plugin.json via manual realignment.

AC-33-2: description field now matches agreed copy.
AC-33-4: template placeholder unchanged, convention intact.
EOF
)"
```

Expected: commitlint passes, commit created. If the hook rejects the message format, adjust subject to stay under 72 chars and keep `#33` tag.

- [ ] **Step 4: Verify commit**

```bash
git -C /Users/tlmader/dev/patinaproject-root/bootstrap log --oneline -1
```

Expected: the new commit appears with the correct message.

---

## Verification Summary

No formal test suite exists in this repo. All verification is lightweight and manual:

| Check | Command | Expected |
|---|---|---|
| Template placeholder intact | `grep '"description"' skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl` | `"{{repo-description}}"` |
| Root description updated | `grep '"description"' .claude-plugin/plugin.json` | new agreed copy |
| Root JSON valid | `jq . .claude-plugin/plugin.json` | parses without error |
| Template JSON valid (stub) | `sed 's/{{[^}]*}}/PLACEHOLDER/g' skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl \| jq .` | parses without error |
| Markdown lint clean | `pnpm lint:md` | exits 0 |
| No drift | manual diff of the two `grep` outputs | template has placeholder, root has literal copy |

Claude Desktop visual verification (AC-33-1) requires both this PR and the separate marketplace PR (`patinaproject/skills`) to be merged. It is a post-deploy manual check, not a CI gate.

---

## Workstreams

Single small batch – all tasks are sequential and can be executed in one session:

**Batch 1 (sequential):** T1 → T2 → T3 → T4

No parallelism needed; the change is two-file (one root JSON), fully contained.

---

## Follow-up (out of scope for this PR)

**Marketplace entry (AC-33-3):** Add a `bootstrap` entry with the same description to `.claude-plugin/marketplace.json` in `patinaproject/skills`. This is a separate repository and must be a separate PR there. Track it in the PR body for this PR so reviewers see the dependency.

---

## Blockers

None.
