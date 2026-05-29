#!/usr/bin/env bash
# worktree-setup.test.sh
#
# Focused behavior coverage for scripts/worktree-setup.sh, which auto-runs on
# every Claude `SessionStart` and in the Codex `[setup]` block. The script must:
#   1. treat branch sync as best-effort — a fetch failure (e.g. offline) warns
#      but still runs `pnpm env:setup`;
#   2. never clobber a feature branch — a HEAD with commits not on origin's
#      default branch is left untouched (the ancestor guard);
#   3. fast-forward a behind-but-ancestor HEAD onto the default branch.
#
# The script hardcodes `origin main`, so each scenario builds a throwaway repo
# whose origin default branch is `main`, and stubs `pnpm` so `env:setup` is
# observable without running a real install.
set -euo pipefail

SCRIPT="$(git rev-parse --show-toplevel)/scripts/worktree-setup.sh"

FAIL_COUNT=0
fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

test ! -f "$SCRIPT" && fail "missing script: $SCRIPT"

# pnpm stub: record every invocation so we can assert `env:setup` ran.
STUB_DIR="$(mktemp -d)"
cat > "$STUB_DIR/pnpm" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "${PNPM_LOG:?PNPM_LOG must be set}"
STUB
chmod +x "$STUB_DIR/pnpm"

GIT_ID=(-c user.email=test@example.com -c user.name=test)

# Build an origin repo (default branch main, one commit) plus a clone whose
# scripts/ dir carries a copy of the real worktree-setup.sh. Echoes the base
# temp dir; "$base/origin" and "$base/clone" are the two repos.
build_sandbox() {
  local base origin clone
  base="$(mktemp -d)"
  origin="$base/origin"
  clone="$base/clone"
  git init -q -b main "$origin"
  git -C "$origin" "${GIT_ID[@]}" commit -q --allow-empty -m "c1"
  git clone -q "$origin" "$clone" 2>/dev/null
  git -C "$clone" config user.email test@example.com
  git -C "$clone" config user.name test
  mkdir -p "$clone/scripts"
  cp "$SCRIPT" "$clone/scripts/worktree-setup.sh"
  chmod +x "$clone/scripts/worktree-setup.sh"
  printf '%s\n' "$base"
}

# Run the copied script from inside the clone with the pnpm stub on PATH.
run_setup() {
  local clone="$1" log="$1/pnpm.log"
  : > "$log"
  ( cd "$clone" && PATH="$STUB_DIR:$PATH" PNPM_LOG="$log" bash scripts/worktree-setup.sh ) 2>&1
}

# Scenario 1: fetch failure warns but still runs env:setup.
base="$(build_sandbox)"
clone="$base/clone"
git -C "$clone" remote set-url origin "$base/missing-remote.git"
if out="$(run_setup "$clone")"; then
  grep -q "could not fetch" <<<"$out" ||
    fail "scenario 1: expected fetch-failure warning, got: $out"
  grep -q "env:setup" "$clone/pnpm.log" ||
    fail "scenario 1: env:setup did not run after fetch failure"
else
  fail "scenario 1: script aborted on fetch failure instead of warning"
fi

# Scenario 2: a feature branch with commits not on origin/main is left untouched.
base="$(build_sandbox)"
origin="$base/origin"
clone="$base/clone"
git -C "$origin" "${GIT_ID[@]}" commit -q --allow-empty -m "origin-advance"
git -C "$clone" "${GIT_ID[@]}" commit -q --allow-empty -m "local-only"
before="$(git -C "$clone" rev-parse HEAD)"
run_setup "$clone" >/dev/null
after="$(git -C "$clone" rev-parse HEAD)"
[ "$before" = "$after" ] ||
  fail "scenario 2: feature-branch HEAD moved ($before -> $after); ancestor guard failed"
grep -q "env:setup" "$clone/pnpm.log" ||
  fail "scenario 2: env:setup did not run"

# Scenario 3: a behind-but-ancestor HEAD fast-forwards onto origin/main.
base="$(build_sandbox)"
origin="$base/origin"
clone="$base/clone"
git -C "$origin" "${GIT_ID[@]}" commit -q --allow-empty -m "origin-advance"
target="$(git -C "$origin" rev-parse HEAD)"
run_setup "$clone" >/dev/null
after="$(git -C "$clone" rev-parse HEAD)"
[ "$after" = "$target" ] ||
  fail "scenario 3: HEAD did not fast-forward to origin/main ($after != $target)"
grep -q "env:setup" "$clone/pnpm.log" ||
  fail "scenario 3: env:setup did not run"

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT worktree-setup assertion(s) failed" >&2
  exit 1
fi

echo "OK: worktree-setup behavior assertions passed"
