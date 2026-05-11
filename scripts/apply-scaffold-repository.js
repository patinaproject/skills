#!/usr/bin/env node
// apply-scaffold-repository.js — Idempotent scaffolding applier for the
// scaffold-repository skill (AC-58-3 check b, AC-58-5 Gate G3).
//
// Usage:
//   node scripts/apply-scaffold-repository.js <skill-dir>
//   node scripts/apply-scaffold-repository.js <skill-dir> --check
//
// <skill-dir>  Path to the scaffold-repository skill directory
//              (e.g. skills/scaffold-repository)
//
// --check       Diff mode: compare what apply would write vs. current files.
//               Exit 0 if in sync, exit 1 if any file would change.
//
// Constraints (enforced by this script):
//   - No outbound network calls (no git fetch, curl, npm install --registry).
//   - No spawning of git commands.
//   - Only node:fs, node:path, node:child_process are used, and only the
//     local filesystem is accessed.
//   - Idempotent: running twice produces the same result (no diff).

"use strict";

const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const checkMode = args.includes("--check");
const pluginDirArg = args.find((a) => !a.startsWith("--"));

if (!pluginDirArg) {
  console.error("Usage: node scripts/apply-scaffold-repository.js <skill-dir> [--check]");
  process.exit(1);
}

const pluginDir = path.resolve(pluginDirArg);
const templateDir = path.join(pluginDir, "templates");
const coreDir = path.join(templateDir, "core");

if (!fs.existsSync(coreDir)) {
  console.error(`Template directory not found: ${coreDir}`);
  console.error("Is the skill-dir pointing to the scaffold-repository skill?");
  process.exit(1);
}

// The host repo root is the current working directory (caller's repo).
const repoRoot = process.cwd();

// ---------------------------------------------------------------------------
// Static files to apply (non-.tmpl; can be copied byte-for-byte)
// These are the non-interactive, deterministic baseline items that the
// scaffold-repository skill owns in every bootstrapped repo.
// ---------------------------------------------------------------------------

const STATIC_FILES = [
  // Commitlint
  { src: "commitlint.config.js", dest: "commitlint.config.js" },
  // Husky hooks.
  // NOTE: .husky/pre-commit is intentionally excluded from self-apply.
  // The template hook calls `pnpm check:versions`, but this skills repo is a
  // monorepo root without a `version` in its root package.json, so the script
  // would always fail. The existing .husky/pre-commit (lint-staged only) is
  // correct for this repo. Downstream bootstrapped repos apply this hook normally.
  { src: ".husky/commit-msg", dest: ".husky/commit-msg", mode: 0o755 },
  // Markdown lint config
  { src: ".markdownlint.jsonc", dest: ".markdownlint.jsonc" },
  // Editor config
  { src: ".editorconfig", dest: ".editorconfig" },
  // Node version
  { src: ".nvmrc", dest: ".nvmrc" },
  // GitHub issue templates
  {
    src: ".github/ISSUE_TEMPLATE/bug_report.md",
    dest: ".github/ISSUE_TEMPLATE/bug_report.md",
  },
  {
    src: ".github/ISSUE_TEMPLATE/feature_request.md",
    dest: ".github/ISSUE_TEMPLATE/feature_request.md",
  },
  // PR template
  {
    src: ".github/pull_request_template.md",
    dest: ".github/pull_request_template.md",
  },
  // Actionlint config
  {
    src: ".github/actionlint.yaml",
    dest: ".github/actionlint.yaml",
  },
  // CI workflows (static; no templating needed for these)
  {
    src: ".github/workflows/actions.yml",
    dest: ".github/workflows/actions.yml",
  },
  // NOTE: .github/workflows/markdown.yml is intentionally excluded from
  // self-apply. The template excludes #plugins/** for vendored plugin dirs,
  // but this repo uses #skills/** for the flat skill layout. Overwriting
  // would revert the customized glob; downstream repos that use the default
  // plugin wrapper layout apply this file normally.
  {
    src: ".github/workflows/pull-request.yml",
    dest: ".github/workflows/pull-request.yml",
  },
  // PR template checkboxes validator — required by pull-request.yml
  {
    src: "scripts/check-pr-template-checkboxes.mjs",
    dest: "scripts/check-pr-template-checkboxes.mjs",
  },
];

// .markdownlintignore is a static file in core templates (non-.tmpl)
// but in this repo it has been extended to exclude skills/ and the overlay.
// We skip it to avoid overwriting the repo's customized ignore list.
// The SKILL.md lists it as part of the baseline, but for self-apply the
// in-repo version is intentionally extended and must not be reverted.

// .husky/pre-commit in the template calls `pnpm check:versions`, which runs
// scripts/check-plugin-versions.mjs. That script checks that plugin manifest
// versions match package.json. This skills repo is a monorepo root with no
// `version` field in its root package.json, so the script would always fail.
// We skip .husky/pre-commit for the self-apply case and keep the existing
// hook that only runs lint-staged. Downstream bootstrapped repos apply this
// hook without skipping it.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

let diffCount = 0;
const changes = [];

function applyFile(srcPath, destPath, mode) {
  if (!fs.existsSync(srcPath)) {
    console.warn(`SKIP: source not found: ${srcPath}`);
    return;
  }

  const srcContent = readFile(srcPath);
  const destExists = fs.existsSync(destPath);
  const destContent = destExists ? readFile(destPath) : null;

  if (srcContent === destContent) {
    // Already in sync
    return;
  }

  if (checkMode) {
    diffCount++;
    changes.push(`DIFF: ${path.relative(repoRoot, destPath)}`);
    return;
  }

  ensureDir(path.dirname(destPath));
  fs.writeFileSync(destPath, srcContent, "utf8");
  if (mode !== undefined) {
    fs.chmodSync(destPath, mode);
  }
  changes.push(`WROTE: ${path.relative(repoRoot, destPath)}`);
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

for (const { src, dest, mode } of STATIC_FILES) {
  const srcPath = path.join(coreDir, src);
  const destPath = path.join(repoRoot, dest);
  applyFile(srcPath, destPath, mode);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (changes.length > 0) {
  for (const line of changes) {
    console.log(line);
  }
}

if (checkMode) {
  if (diffCount > 0) {
    console.error(`\ncheck: ${diffCount} file(s) out of sync with scaffold-repository baseline`);
    process.exit(1);
  } else {
    console.log("check: all scaffold-repository baseline files are in sync");
    process.exit(0);
  }
} else {
  const written = changes.filter((l) => l.startsWith("WROTE:")).length;
  if (written === 0) {
    console.log("apply: all scaffold-repository baseline files already in sync (no changes)");
  } else {
    console.log(`\napply: wrote ${written} file(s) from scaffold-repository baseline`);
  }
  process.exit(0);
}
