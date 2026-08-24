#!/usr/bin/env bash
set -euo pipefail

# Behavioral guard for the markdown exclusion mechanism.
#
# `markdownlint-cli2` does not read `.markdownlintignore`. Exclusions live in
# `.markdownlint-cli2.jsonc` (`ignores`), the single list every markdown entry
# point inherits — including the pre-commit hook, which needs its paths made
# relative first because `ignores` does not match absolute ones.
#
# Per ADR-224 this asserts tool behavior and non-`.md` config only.

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

TMP_DIRS=()
cleanup() {
  if [ "${#TMP_DIRS[@]}" -gt 0 ]; then
    rm -rf "${TMP_DIRS[@]}"
  fi
}
# One accumulator, one trap. A bash trap replaces rather than appends, so
# registering a second one per temp directory would silently drop the first.
trap cleanup EXIT

scratch_dir() {
  local dir
  dir="$(mktemp -d)"
  TMP_DIRS+=("$dir")
  printf '%s\n' "$dir"
}

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

# `Linting: N file(s)` is the only signal cli2 gives for which files it
# *selected*, and selection is the mechanism under test — a clean file exits
# zero whether or not it was excluded. Named once so the coupling has one home.
NO_FILES_SELECTED_LINE="Linting: 0 file(s)"

# A Setext H1 with no blank line after it, plus an unlabelled fenced block:
# violates MD022, MD031 and MD040 under this repository's rule set. One home for
# the shape, so a rule-set change does not have to be chased across fixtures.
write_violating_md() {
  printf 'Violating Heading\n=================\n```\nx\n```\n' > "$1"
}

assert_ignored() {
  local path="$1" description="$2" output
  output="$(pnpm exec markdownlint-cli2 "$path" 2>&1)" || {
    printf '%s\n' "$output" >&2
    fail "linting an ignored path should succeed: $description"
  }
  printf '%s\n' "$output" | grep -q "$NO_FILES_SELECTED_LINE" ||
    fail "ignores did not apply to $description: $output"
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

# A real excluded file to probe with. It must come from a vendored overlay: this
# repo's own `skills/**` is deliberately linted, so a file from there would
# assert the opposite of the intended contract.
EXCLUDED_SAMPLE=""
for probe_root in .agents/skills .claude/skills; do
  [ -d "$probe_root" ] || continue
  EXCLUDED_SAMPLE="$(find "$probe_root" -name '*.md' -type f -print -quit)"
  [ -n "$EXCLUDED_SAMPLE" ] && break
done
[ -n "$EXCLUDED_SAMPLE" ] ||
  fail "no vendored overlay markdown found to probe the exclusion with"

# 1. An excluded path passed explicitly is skipped.
assert_ignored "$EXCLUDED_SAMPLE" "an explicitly passed path"

# 2. Rule configuration from .markdownlint.jsonc still loads for linted files.
probe_dir="$(scratch_dir)"
probe="$probe_dir/probe.md"
write_violating_md "$probe"

if pnpm exec markdownlint-cli2 "$probe" >/dev/null 2>&1; then
  fail "a file with real violations should not lint clean"
fi

# 3. Every committed vendored-skill overlay root is excluded. The baseline tells
#    repositories to commit these payloads, and they are third-party markdown
#    written against their own upstream config, so without the exclusion the
#    first vendoring run breaks lint:md, markdown CI, and pre-commit at once.
for overlay_root in .agents/skills .claude/skills; do
  [ -d "$overlay_root" ] || continue
  # `-print -quit` rather than `| head -n 1`: under `set -euo pipefail`, `head`
  # closing the pipe can kill `find` with SIGPIPE and abort the script with a
  # bare 141 once these trees grow past the pipe buffer.
  overlay_file="$(find "$overlay_root" -name '*.md' -type f -print -quit)"
  [ -n "$overlay_file" ] || continue
  assert_ignored "$overlay_file" "committed overlay $overlay_root"
done

# The other half of the contract: this repo's own authored skills are
# first-party markdown written against this config, so they must be linted.
first_party="$(find skills -name '*.md' -type f -print -quit)"
if [ -n "$first_party" ]; then
  first_party_output="$(pnpm exec markdownlint-cli2 "$first_party" 2>&1)" || {
    printf '%s\n' "$first_party_output" >&2
    fail "first-party skill markdown must lint clean: $first_party"
  }
  if printf '%s\n' "$first_party_output" | grep -q "$NO_FILES_SELECTED_LINE"; then
    fail "first-party skill markdown must be linted, not excluded: $first_party"
  fi
fi

# 4. The exclusion above is load-bearing, not vacuous: a payload written against
#    another repository's config really does violate this one's rules.
collision_dir="$(scratch_dir)"
mkdir -p "$collision_dir/.claude/skills/vendored"
cp .markdownlint.jsonc "$collision_dir/.markdownlint.jsonc"
write_violating_md "$collision_dir/.claude/skills/vendored/SKILL.md"

lint_collision_payload() {
  (cd "$collision_dir" && "$CLI2_BIN" ".claude/skills/vendored/SKILL.md" >/dev/null 2>&1)
}

if lint_collision_payload; then
  fail "vendored payload should violate this repository's rules when not excluded"
fi

printf '{ "ignores": [".claude/skills/**"] }\n' > "$collision_dir/.markdownlint-cli2.jsonc"
lint_collision_payload ||
  fail "an ignores entry must exclude the same vendored payload"

# 5. The pre-commit path, end to end, on the form lint-staged really produces.
#    lint-staged hands its task absolute paths; markdownlint-cli2 applies
#    `ignores` only to relative ones. So the config must convert them, and this
#    runs the command it emits for an absolute excluded path and requires that
#    nothing was linted. Passing the absolute path straight through selects the
#    file, which is the pre-commit failure the shared exclusion list prevents.
staged_command="$(REPO_ROOT="$REPO_ROOT" EXCLUDED_SAMPLE="$EXCLUDED_SAMPLE" node --input-type=module -e '
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const root = process.env.REPO_ROOT;
const config = (await import(pathToFileURL(`${root}/.lintstagedrc.js`))).default;
const entry = config["*.md"];
const absolute = `${root}/${process.env.EXCLUDED_SAMPLE}`;
// lint-staged appends the (absolute) paths to a plain string command, and uses
// a function command verbatim. Model both so a string config is tested as
// lint-staged would actually invoke it, not as a bare command with no args.
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
printf '%s\n' "$staged_output" | grep -q "$NO_FILES_SELECTED_LINE" ||
  fail "the lint-staged command lints excluded paths: $staged_output"

echo "OK: markdown lint exclusion contract passed"
