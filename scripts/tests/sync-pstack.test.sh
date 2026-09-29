#!/usr/bin/env bash
# Behavioral tests for the pstack sync tooling: the rebrand transform's
# determinism contract, and the end-to-end sync producing true 3-way merge
# conflicts only where local edits diverge. Fully hermetic, no network.
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
mkdir -p "$src/skills/poteto-mode/scripts" "$src/skills/setup-pstack" \
  "$src/agents" "$src/assets"
printf -- '---\nname: poteto-mode\n---\ntrigger /poteto-mode\ndispatches poteto-agent\nbrand pstack and poteto stay\nref pstack:tdd\n' \
  > "$src/skills/poteto-mode/SKILL.md"
printf 'setup pstack\n' > "$src/skills/setup-pstack/SKILL.md"
printf -- '---\nname: poteto-agent\n---\nagent body\n' > "$src/agents/poteto-agent.md"
printf '#!/usr/bin/env bash\necho poteto-mode tool\n' \
  > "$src/skills/poteto-mode/scripts/tool.sh"
chmod +x "$src/skills/poteto-mode/scripts/tool.sh"
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
            skills/patina-mode/scripts/tool.sh; do
  [ -e "$work/out1/$kept" ] || fail "expected upstream-named path missing: $kept"
done
# executable bit preserved (script keeps its upstream filename under patina-mode)
[ -x "$work/out1/skills/patina-mode/scripts/tool.sh" ] \
  || fail "executable bit not preserved"
# binary copied verbatim
cmp -s "$src/assets/logo.bin" "$work/out1/assets/logo.bin" \
  || fail "binary file was altered by the transform"
# non-empty dest guard
if bash "$transform" "$src" "$work/out1" 2>/dev/null; then
  fail "transform did not reject a non-empty dest-dir"
fi

# --- sync: 3-way conflicts from a regenerated merge base ------------------
# The repository squash-merges, so a synced tree reaches main with no ancestry
# back to any sync commit. The merge base must come from the upstream SHA
# recorded in upstream.json.
export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.com
export GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.com

failures=0
expect() {
  local what="$1"
  shift
  if ! "$@"; then
    echo "FAIL: $what" >&2
    failures=$((failures + 1))
  fi
}
no_markers() { ! grep -q '^<<<<<<<' "$1"; }
recorded_commit() { jq -r '.commit // empty' "$1/plugins/engineering/upstream.json" 2>/dev/null; }
local_branches() { git -C "$1" for-each-ref --format='%(refname:short)' refs/heads; }

upstream="$work/upstream"
up_skill="$upstream/plugins/pstack/skills/poteto-mode/SKILL.md"
git init -q -b main "$upstream"
mkdir -p "$(dirname "$up_skill")"
printf 'line-a\nshared-line-v1\nline-c\n' > "$up_skill"
printf 'other-v1\n' > "$upstream/plugins/pstack/other.md"
git -C "$upstream" add -A
git -C "$upstream" commit -q -m "v1"
v1="$(git -C "$upstream" rev-parse HEAD)"

consumer="$work/consumer"
git init -q -b main "$consumer"
printf 'root\n' > "$consumer/README.md"
mkdir -p "$consumer/plugins/engineering"
printf 'patina-only notice\n' > "$consumer/plugins/engineering/NOTICE.md"
git -C "$consumer" add -A
git -C "$consumer" commit -q -m "base"

run_sync() {
  ( cd "$1" &&
    PSTACK_REMOTE=test-upstream \
    PSTACK_REMOTE_URL="$upstream" \
    PSTACK_UPSTREAM_REF=main \
    PSTACK_UPSTREAM_SUBTREE=plugins/pstack \
    PSTACK_DEST=plugins/engineering \
    bash "$sync" )
}

# Initial import: no recorded commit, so everything upstream applies cleanly.
pre_sync="$(git -C "$consumer" rev-parse HEAD)"
expect "initial sync exits 0" run_sync "$consumer" >/dev/null 2>&1
dest_skill="$consumer/plugins/engineering/skills/patina-mode/SKILL.md"
expect "initial sync imports content at the renamed path" grep -q 'shared-line-v1' "$dest_skill"
expect "initial sync imports other files" grep -q 'other-v1' "$consumer/plugins/engineering/other.md"
expect "initial sync leaves Patina-only files untouched" \
  grep -q 'patina-only notice' "$consumer/plugins/engineering/NOTICE.md"
expect "initial sync records the upstream commit" test "$(recorded_commit "$consumer")" = "$v1"
expect "initial sync writes no commit" test "$(git -C "$consumer" rev-parse HEAD)" = "$pre_sync"

# Land the sync on main the way a squash merge does: one new single-parent
# commit holding the synced tree, with no link to anything the sync created.
git -C "$consumer" add -A
synced_tree="$(git -C "$consumer" write-tree)"
squash="$(git -C "$consumer" commit-tree "$synced_tree" -p "$pre_sync" -m "squash of sync v1")"
git -C "$consumer" reset -q --hard "$squash"

# Patina edits the shared line after the squash.
perl -0pi -e 's/shared-line-v1/shared-line-PATINA-EDIT/' "$dest_skill"
git -C "$consumer" commit -q -am "patina local edit"

# Upstream changes the same line, and separately a file Patina never edited.
perl -0pi -e 's/shared-line-v1/shared-line-UPSTREAM-CHANGE/' "$up_skill"
printf 'other-v2\n' > "$upstream/plugins/pstack/other.md"
git -C "$upstream" commit -q -am "v2"
v2="$(git -C "$upstream" rev-parse HEAD)"

# Run the next sync from a fresh single-branch clone: nothing but main.
clone="$work/clone"
git clone -q --single-branch --branch main "$consumer" "$clone"
clone_skill="$clone/plugins/engineering/skills/patina-mode/SKILL.md"
clone_head="$(git -C "$clone" rev-parse HEAD)"
sync_output="$work/sync-output"
if run_sync "$clone" >"$sync_output" 2>&1; then
  expect "diverged sync exits non-zero because of conflicts" false
fi
expect "only the Patina-edited file conflicts" \
  test "$(git -C "$clone" diff --name-only --diff-filter=U)" = "plugins/engineering/skills/patina-mode/SKILL.md"
expect "conflict markers present on the diverged line" grep -q '^<<<<<<<' "$clone_skill"
expect "ours side present in the conflict" grep -q 'shared-line-PATINA-EDIT' "$clone_skill"
expect "theirs side present in the conflict" grep -q 'shared-line-UPSTREAM-CHANGE' "$clone_skill"
expect "unrelated upstream change applies cleanly" grep -qx 'other-v2' "$clone/plugins/engineering/other.md"
expect "unrelated upstream change has no conflict markers" no_markers "$clone/plugins/engineering/other.md"
expect "Patina-only files stay untouched" \
  grep -q 'patina-only notice' "$clone/plugins/engineering/NOTICE.md"
expect "upstream.json records the new tip" test "$(recorded_commit "$clone")" = "$v2"
expect "upstream.json update is staged" \
  test -n "$(git -C "$clone" diff --cached --name-only -- plugins/engineering/upstream.json)"
expect "sync writes no commit" test "$(git -C "$clone" rev-parse HEAD)" = "$clone_head"
expect "sync creates no branch" test "$(local_branches "$clone")" = "main"
expect "conflict output routes to fix-merge-conflicts" grep -q 'fix-merge-conflicts skill' "$sync_output"

# The operator resolves and commits with a normal single-parent commit.
printf 'line-a\nshared-line-RESOLVED\nline-c\n' > "$clone_skill"
git -C "$clone" add -A
expect "operator commit succeeds after resolving" git -C "$clone" commit -q -m "resolve sync"
expect "operator commit is single-parent" \
  test "$(git -C "$clone" rev-list --parents -n 1 HEAD | wc -w | tr -d ' ')" = "2"
expect "tree is clean after the operator commit" test -z "$(git -C "$clone" status --porcelain)"

# Nothing to sync: the recorded commit equals the upstream tip.
resolved_head="$(git -C "$clone" rev-parse HEAD)"
expect "up-to-date sync exits 0" run_sync "$clone" >/dev/null 2>&1
expect "up-to-date sync writes no commit" test "$(git -C "$clone" rev-parse HEAD)" = "$resolved_head"
expect "up-to-date sync leaves the tree unchanged" test -z "$(git -C "$clone" status --porcelain)"

[ "$failures" -eq 0 ] || fail "$failures sync assertion(s) failed"
echo "PASS: sync-pstack.test.sh"
