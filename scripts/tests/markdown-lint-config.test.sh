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

# Resolved once so the temp-directory cases below can run the same binary
# without `pnpm exec`, which needs a package.json in the working directory and
# would otherwise fail for a reason unrelated to what is being asserted.
CLI2_BIN="$REPO_ROOT/node_modules/.bin/markdownlint-cli2"
[ -x "$CLI2_BIN" ] || fail "markdownlint-cli2 is not installed at $CLI2_BIN"

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

# 3. Every committed vendored-skill overlay root is excluded. The baseline tells
#    repositories to commit these payloads, and they are third-party markdown
#    written against their own upstream config, so without the exclusion the
#    first vendoring run breaks lint:md, markdown CI, and pre-commit at once.
for overlay_root in skills .agents/skills .claude/skills; do
  [ -d "$overlay_root" ] || continue
  # `-print -quit` rather than `| head -n 1`: under `set -euo pipefail`, `head`
  # closing the pipe can kill `find` with SIGPIPE and abort the script with a
  # bare 141 once these trees grow past the pipe buffer.
  overlay_file="$(find "$overlay_root" -name '*.md' -type f -print -quit)"
  [ -n "$overlay_file" ] || continue
  overlay_output="$(pnpm exec markdownlint-cli2 "$overlay_file" 2>&1)" || {
    printf '%s\n' "$overlay_output" >&2
    fail "committed overlay $overlay_root is not excluded from markdown lint"
  }
  printf '%s\n' "$overlay_output" | grep -q "Linting: 0 file(s)" ||
    fail "committed overlay $overlay_root is not excluded: $overlay_output"
done

# 4. The exclusion above is load-bearing, not vacuous: a payload written against
#    another repository's config really does violate this one's rules.
collision_dir="$(mktemp -d)"
trap 'rm -rf "$probe_dir" "$collision_dir"' EXIT
mkdir -p "$collision_dir/.claude/skills/vendored"
cp .markdownlint.jsonc "$collision_dir/.markdownlint.jsonc"
printf 'Vendored Heading\n================\n```\nx\n```\n' \
  > "$collision_dir/.claude/skills/vendored/SKILL.md"

if (cd "$collision_dir" && "$CLI2_BIN" ".claude/skills/vendored/SKILL.md" >/dev/null 2>&1); then
  fail "vendored payload should violate this repository's rules when not excluded"
fi

printf '{ "ignores": [".claude/skills/**"] }\n' > "$collision_dir/.markdownlint-cli2.jsonc"
(cd "$collision_dir" && "$CLI2_BIN" ".claude/skills/vendored/SKILL.md" >/dev/null 2>&1) ||
  fail "an ignores entry must exclude the same vendored payload"

# 5. The pre-commit hook routes markdown through markdownlint-cli2, so it
#    inherits the same ignores instead of re-implementing an exclusion filter.
REPO_ROOT="$REPO_ROOT" node --input-type=module -e '
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const config = (await import(pathToFileURL(`${process.env.REPO_ROOT}/.lintstagedrc.js`))).default;
const entry = config["*.md"];
const commands = typeof entry === "function"
  ? [entry(["README.md"])].flat()
  : [entry].flat();
assert.ok(
  commands.length > 0 && commands.every((c) => String(c).includes("markdownlint-cli2")),
  "lint-staged must run markdownlint-cli2 for *.md, got: " + JSON.stringify(commands)
);
' || fail "lint-staged markdown command does not route through markdownlint-cli2"

echo "OK: markdown lint exclusion contract passed"
