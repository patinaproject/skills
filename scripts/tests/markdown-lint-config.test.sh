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

# 1. An excluded path passed explicitly - the lint-staged path - is skipped.
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

# 3. The pre-commit hook routes markdown through markdownlint-cli2, so it
#    inherits the same ignores instead of re-implementing an exclusion filter.
node --input-type=module -e "
import assert from 'node:assert/strict';
const config = (await import('${REPO_ROOT}/.lintstagedrc.js')).default;
const entry = config['*.md'];
const commands = typeof entry === 'function'
  ? [entry(['README.md'])].flat()
  : [entry].flat();
assert.ok(
  commands.length > 0 && commands.every((c) => String(c).includes('markdownlint-cli2')),
  'lint-staged must run markdownlint-cli2 for *.md, got: ' + JSON.stringify(commands)
);
" || fail "lint-staged markdown command does not route through markdownlint-cli2"

echo "OK: markdown lint exclusion contract passed"
