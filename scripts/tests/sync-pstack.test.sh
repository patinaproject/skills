#!/usr/bin/env bash
# Behavioral tests for the open-pstack sync tooling: the rebrand transform's
# determinism contract, and the end-to-end sync producing true 3-way merge
# conflicts only where local edits diverge. Fully hermetic — no network.
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
transform="$repo_root/scripts/pstack-transform.sh"
sync="$repo_root/scripts/sync-pstack.sh"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

fail() { echo "FAIL: $*" >&2; exit 1; }

# --- syntax ---------------------------------------------------------------
bash -n "$transform" || fail "pstack-transform.sh has a syntax error"
bash -n "$sync" || fail "sync-pstack.sh has a syntax error"

# --- transform contract ---------------------------------------------------
# The transform is exactly two renames, poteto-mode -> patina-mode and
# poteto-agent -> patina-agent, applied to both paths and content. Every other
# upstream token stays as-is.
src="$work/src"
mkdir -p "$src/skills/poteto-mode/scripts/runner" "$src/skills/setup-pstack" \
  "$src/agents" "$src/assets"
printf -- '---\nname: poteto-mode\n---\ntrigger /poteto-mode\ndispatches poteto-agent\nbrand pstack and poteto stay\nref pstack:tdd\n' \
  > "$src/skills/poteto-mode/SKILL.md"
printf 'setup pstack\n' > "$src/skills/setup-pstack/SKILL.md"
printf -- '---\nname: poteto-agent\n---\nagent body\n' > "$src/agents/poteto-agent.md"
printf '#!/usr/bin/env bash\necho pstack-runner\n' \
  > "$src/skills/poteto-mode/scripts/runner/pstack-runner"
chmod +x "$src/skills/poteto-mode/scripts/runner/pstack-runner"
# a binary file whose bytes must NOT be rewritten
printf 'poteto-mode\x00\xff\xfebinary' > "$src/assets/logo.bin"

bash "$transform" "$src" "$work/out1"
bash "$transform" "$src" "$work/out2"

diff -r "$work/out1" "$work/out2" >/dev/null || fail "transform is not deterministic"

# the renamed tokens leave no residual in content or paths
for tok in poteto-mode poteto-agent; do
  if LC_ALL=C grep -rIl "$tok" "$work/out1" >/dev/null; then
    fail "residual '$tok' in transformed content"
  fi
  if find "$work/out1" -type f | sed "s|$work/out1/||" | grep -q "$tok"; then
    fail "residual '$tok' in transformed paths"
  fi
done
# the renamed skill folder and aligned frontmatter/trigger
[ -f "$work/out1/skills/patina-mode/SKILL.md" ] || fail "poteto-mode folder not renamed"
[ -d "$work/out1/skills/poteto-mode" ] && fail "old poteto-mode folder still present"
skill="$work/out1/skills/patina-mode/SKILL.md"
grep -q '^name: patina-mode$' "$skill" || fail "frontmatter name not renamed"
grep -q 'trigger /patina-mode' "$skill" || fail "trigger not renamed"
grep -q 'dispatches patina-agent' "$skill" || fail "poteto-agent reference not renamed in content"
# the renamed agent file and aligned frontmatter
[ -f "$work/out1/agents/patina-agent.md" ] || fail "poteto-agent file not renamed"
[ -e "$work/out1/agents/poteto-agent.md" ] && fail "old poteto-agent file still present"
grep -q '^name: patina-agent$' "$work/out1/agents/patina-agent.md" || fail "agent frontmatter name not renamed"
# everything else stays upstream-named, in content and in paths
grep -q 'brand pstack and poteto stay' "$skill" || fail "unrelated tokens were changed in content"
grep -q 'ref pstack:tdd' "$skill" || fail "unrelated namespaced ref was changed"
for kept in skills/setup-pstack/SKILL.md \
            skills/patina-mode/scripts/runner/pstack-runner; do
  [ -e "$work/out1/$kept" ] || fail "expected upstream-named path missing: $kept"
done
# executable bit preserved (runner keeps its upstream filename under patina-mode)
[ -x "$work/out1/skills/patina-mode/scripts/runner/pstack-runner" ] \
  || fail "executable bit not preserved"
# binary copied verbatim
cmp -s "$src/assets/logo.bin" "$work/out1/assets/logo.bin" \
  || fail "binary file was altered by the transform"
# non-empty dest guard
if bash "$transform" "$src" "$work/out1" 2>/dev/null; then
  fail "transform did not reject a non-empty dest-dir"
fi

# --- sync produces true 3-way conflicts -----------------------------------
export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.com
export GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.com

upstream="$work/upstream"
git init -q -b main "$upstream"
mkdir -p "$upstream/plugins/pstack/skills/poteto-mode"
printf 'line-a\nshared-line-v1\nline-c\n' \
  > "$upstream/plugins/pstack/skills/poteto-mode/SKILL.md"
git -C "$upstream" add -A
git -C "$upstream" commit -q -m "v1"

consumer="$work/consumer"
git init -q -b main "$consumer"
printf 'root\n' > "$consumer/README.md"
git -C "$consumer" add -A
git -C "$consumer" commit -q -m "base"

run_sync() {
  ( cd "$consumer" &&
    PSTACK_REMOTE=test-upstream \
    PSTACK_REMOTE_URL="$upstream" \
    PSTACK_UPSTREAM_REF=main \
    PSTACK_UPSTREAM_SUBTREE=plugins/pstack \
    PSTACK_DEST=plugins/engineering \
    PSTACK_CARRIER=pstack-sync \
    bash "$sync" )
}

# First sync: clean base switch, no conflict. Content is imported verbatim
# except for the poteto-mode -> patina-mode path rename.
run_sync >/dev/null 2>&1 || fail "first sync should merge cleanly"
dest_file="$consumer/plugins/engineering/skills/patina-mode/SKILL.md"
[ -f "$dest_file" ] || fail "first sync did not import content at the renamed path"
grep -q 'shared-line-v1' "$dest_file" || fail "first sync did not import upstream content"

# Local Patina edit on the shared line.
perl -0pi -e 's/shared-line-v1/shared-line-PATINA-EDIT/' "$dest_file"
git -C "$consumer" add -A
git -C "$consumer" commit -q -m "patina local edit"

# Upstream changes the same line.
perl -0pi -e 's/shared-line-v1/shared-line-UPSTREAM-CHANGE/' \
  "$upstream/plugins/pstack/skills/poteto-mode/SKILL.md"
git -C "$upstream" add -A
git -C "$upstream" commit -q -m "v2"

# Second sync: must leave a true conflict on the diverged line.
if run_sync >/dev/null 2>&1; then
  fail "second sync should exit non-zero because of conflicts"
fi
grep -q '^<<<<<<<' "$dest_file" || fail "expected conflict markers not present after diverged sync"
grep -q 'shared-line-PATINA-EDIT' "$dest_file" || fail "ours side missing from conflict"
grep -q 'shared-line-UPSTREAM-CHANGE' "$dest_file" || fail "theirs side missing from conflict"

echo "PASS: sync-pstack.test.sh"
