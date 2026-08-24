#!/usr/bin/env bash
set -euo pipefail

# Behavioral guard for the markdown exclusion mechanism.
#
# `markdownlint-cli2` does not read `.markdownlintignore`. Exclusions live in
# `.markdownlint-cli2.jsonc` (`ignores`), which is the only mechanism that also
# covers the explicit file paths `lint-staged` hands the pre-commit hook.
#
# Per ADR-224 this asserts tool behavior and non-`.md` config only.

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

# The inert file must not come back: an exclusion added there is silently lost.
if [ -e .markdownlintignore ]; then
  fail ".markdownlintignore is present but markdownlint-cli2 never reads it"
fi

[ -f .markdownlint-cli2.jsonc ] || fail ".markdownlint-cli2.jsonc is missing"

# A malformed config makes markdownlint-cli2 exit non-zero, so every run below
# doubles as a parse check.

# 1. An excluded path passed explicitly is skipped. `ignores` applies to
#    relative paths only, which is why case 3 covers the absolute form
#    lint-staged actually produces.
explicit_output="$(pnpm exec markdownlint-cli2 "skills/scaffold-repository/SKILL.md" 2>&1)" || {
  printf '%s\n' "$explicit_output" >&2
  fail "linting an ignored path explicitly should succeed"
}
printf '%s\n' "$explicit_output" | grep -q "Linting: 0 file(s)" ||
  fail "ignores did not apply to an explicitly passed path: $explicit_output"

# 2. Rule configuration from .markdownlint.jsonc still loads for linted files.
probe_dir="$(mktemp -d)"
trap 'rm -rf "$probe_dir"' EXIT
probe="$probe_dir/probe.md"
printf 'Bad Heading\n===========\n```\nx\n```\n' > "$probe"

if pnpm exec markdownlint-cli2 "$probe" >/dev/null 2>&1; then
  fail "a file with real violations should not lint clean"
fi

# 3. The pre-commit path, end to end, on the form lint-staged really produces.
#    lint-staged hands its task absolute paths; markdownlint-cli2 applies
#    `ignores` only to relative ones. So the config must convert them, and this
#    runs the command it emits for an absolute excluded path and requires that
#    nothing was linted. Passing the absolute path straight through selects the
#    file, which is the pre-commit failure the shared exclusion list exists to
#    prevent.
staged_command="$(REPO_ROOT="$REPO_ROOT" node --input-type=module -e '
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const root = process.env.REPO_ROOT;
const config = (await import(pathToFileURL(`${root}/.lintstagedrc.js`))).default;
const entry = config["*.md"];
const absolute = `${root}/skills/scaffold-repository/SKILL.md`;
// lint-staged appends the (absolute) paths to a plain string command, and
// uses a function command verbatim. Model both so a string config is tested
// as lint-staged would actually invoke it, not as a bare command with no args.
const commands = typeof entry === "function"
  ? [entry([absolute])].flat()
  : [entry].flat().map((command) => `${command} "${absolute}"`);
assert.equal(commands.length, 1, "expected one *.md command, got: " + JSON.stringify(commands));
assert.ok(
  String(commands[0]).includes("markdownlint-cli2"),
  "lint-staged must run markdownlint-cli2 for *.md, got: " + commands[0]
);
process.stdout.write(String(commands[0]));
')" || fail "could not resolve the lint-staged markdown command"

staged_output="$(eval "pnpm exec $staged_command" 2>&1)" || {
  printf '%s\n' "$staged_output" >&2
  fail "the lint-staged markdown command failed on an excluded path"
}
printf '%s\n' "$staged_output" | grep -q "Linting: 0 file(s)" ||
  fail "the lint-staged command lints excluded paths: $staged_output"

echo "OK: markdown lint exclusion contract passed"
