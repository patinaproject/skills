# Plan: Use Patina Project as the complete company name [#49](https://github.com/patinaproject/superteam/issues/49)

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update public-facing docs prose so the company is displayed as
`Patina Project` while preserving all `patina` identifiers.

**Architecture:** This is a documentation-only change. Use targeted search
commands as acceptance tests, edit only `README.md` and `RELEASING.md`, then
verify no protected identifiers were renamed.

**Tech Stack:** Markdown, `rg`, `pnpm lint:md`.

---

## File Structure

- Modify `README.md`: public installation and related-repository prose.
- Modify `RELEASING.md`: release fallback and marketplace prose.
- Do not modify machine-readable metadata, workflows, package files, URLs,
  domains, repository slugs, or generated changelog content.

## Task 1: Prove Current Public-Facing Short Name Usage

**Files:**

- Inspect: `README.md`
- Inspect: `RELEASING.md`

- [ ] **Step 1: Run the failing acceptance search**

  Run:

  ```bash
  rg -n 'Patina marketplace|Patina plugins|outside Patina|Patina marketplace manifest' README.md RELEASING.md
  ```

  Expected before implementation: output includes the known affected
  public-facing `Patina` phrases from issue #49.

## Task 2: Update Public-Facing Prose

**Files:**

- Modify: `README.md`
- Modify: `RELEASING.md`

- [ ] **Step 1: Replace only public-facing company-display prose**

  Update the matched prose as follows:

  ```text
  Register the Patina marketplace
  -> Register the Patina Project marketplace

  marketplace distributing Patina plugins
  -> marketplace distributing Patina Project plugins

  forks outside Patina
  -> forks outside Patina Project

  Patina marketplace manifest
  -> Patina Project marketplace manifest
  ```

  Leave identifier-shaped strings unchanged, including
  `patinaproject/skills`, `patinaproject/superteam`,
  `patina-project-automation`, `PATINAPROJECT_AUTOMATION_APP_ID`, URLs, and
  email domains.

## Task 3: Verify Acceptance Criteria

**Files:**

- Inspect: `README.md`
- Inspect: `RELEASING.md`
- Inspect: repository Markdown

- [ ] **Step 1: Verify old public-facing phrases are gone**

  Run:

  ```bash
  ! rg -n -P 'Patina marketplace|Patina plugins|outside Patina(?! Project)|Patina marketplace manifest' README.md RELEASING.md
  ```

  Expected after implementation: command succeeds because the old
  public-facing phrases are absent.

- [ ] **Step 2: Verify new public-facing phrases exist**

  Run:

  ```bash
  rg -n 'Patina Project marketplace|Patina Project plugins|outside Patina Project|Patina Project marketplace manifest' README.md RELEASING.md
  ```

  Expected after implementation: output includes the replacement phrases.

- [ ] **Step 3: Verify protected identifiers remain**

  Run:

  ```bash
  rg -n 'patinaproject/skills|patinaproject/superteam|patina-project-automation|PATINAPROJECT_AUTOMATION_APP_ID|patinaproject.com' README.md RELEASING.md .claude-plugin .codex-plugin package.json .github
  ```

  Expected after implementation: output still includes the protected
  identifier-shaped strings.

- [ ] **Step 4: Run Markdown lint**

  Run:

  ```bash
  pnpm lint:md
  ```

  Expected after implementation: `Summary: 0 error(s)`.

## Self-Review

- AC-49-1 is covered by Task 1, Task 2, and Task 3 steps 1-2.
- AC-49-2 is covered by Task 2 and Task 3 step 3.
- The plan intentionally avoids generated changelog content and historical
  planning artifacts.
- No placeholder steps remain.
