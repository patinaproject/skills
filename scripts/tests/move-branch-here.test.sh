#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HELPER="$REPO_ROOT/plugins/engineering/skills/move-branch-here/scripts/worktree-context.sh"
TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

assert_equal() {
  local actual="$1" expected="$2" message="$3"
  if [ "$actual" != "$expected" ]; then
    fail "$message (expected '$expected', got '$actual')"
  fi
}

# Creates a repository on main plus a linked worktree holding `feature`.
new_fixture() {
  local root
  root="$(mktemp -d "$TMP_ROOT/fixture-XXXXXX")"
  # The helper reports physical paths, and mktemp can hand back a symlinked one.
  root="$(cd "$root" && pwd -P)"
  mkdir -p "$root/repo"
  git -c init.defaultBranch=main init --quiet "$root/repo"
  git -C "$root/repo" config user.email tests@patinaproject.com
  git -C "$root/repo" config user.name 'patinaproject Tests'
  printf 'base\n' > "$root/repo/README.md"
  git -C "$root/repo" add README.md
  git -C "$root/repo" commit --quiet -m 'chore: #350 base'
  git -C "$root/repo" branch feature
  git -C "$root/repo" worktree add --quiet "$root/held" feature
  printf 'base\nfeature\n' > "$root/held/README.md"
  git -C "$root/held" commit --quiet -am 'feat: #350 feature work'
  printf '%s\n' "$root"
}

# Leaves the holder on `feature` with a `conflicting` branch whose commit
# touches the same line, so any replay of it stops on a conflict.
new_conflicting_fixture() {
  local root
  root="$(new_fixture)"
  git -C "$root/held" switch --quiet -c conflicting main
  printf 'base\nconflict\n' > "$root/held/README.md"
  git -C "$root/held" commit --quiet -am 'fix: #350 conflicting work'
  git -C "$root/held" switch --quiet feature
  printf '%s\n' "$root"
}

resolve_field() {
  local root="$1" branch="$2" index="$3"
  (cd "$root/repo" && "$HELPER" resolve "$branch") | cut -f "$index"
}

# A refusal that only reaches `resolve` is not a refusal: `move` re-resolves
# through a command substitution, where an exit escapes only the substitution.
assert_move_blocked() {
  local root="$1" branch="$2" expected="$3" description="$4" head output
  head="$(git -C "$root/repo" rev-parse "$branch")"
  if output="$(cd "$root/repo" && "$HELPER" move "$branch" "$head" \
    2>"$root/move-stderr")"; then
    fail "$description: move unexpectedly succeeded: $output"
  fi
  assert_equal "$output" '' "$description: a refused move emits no row"
  if ! grep -Fq "$expected" "$root/move-stderr"; then
    fail "$description: move error was not actionable: $(cat "$root/move-stderr")"
  fi
  assert_equal "$(git -C "$root/repo" branch --show-current)" main \
    "$description: a refused move leaves the current worktree alone"
}

assert_blocked() {
  local root="$1" branch="$2" expected="$3" description="$4" output
  if output="$(cd "$root/repo" && "$HELPER" resolve "$branch" 2>&1)"; then
    fail "$description unexpectedly resolved: $output"
    return
  fi
  if ! grep -Fq "$expected" <<< "$output"; then
    fail "$description error was not actionable: $output"
  fi
  assert_equal "$(git -C "$root/held" branch --show-current)" feature \
    "$description should leave the holder attached"
}

# A held branch moves, and moving it again is a reported no-op.
{
  root="$(new_fixture)"
  head="$(git -C "$root/held" rev-parse HEAD)"

  assert_equal "$(resolve_field "$root" feature 1)" held 'a held branch resolves as held'
  assert_equal "$(resolve_field "$root" feature 3)" "$head" 'resolve reports the branch head'
  assert_equal "$(resolve_field "$root" feature 5)" "$root/held" \
    'resolve reports the holding worktree'

  result="$(cd "$root/repo" && "$HELPER" move feature "$head" "$root/held")"
  assert_equal "$(cut -f1 <<< "$result")" moved 'move reports the release'
  assert_equal "$(cut -f4 <<< "$result")" "$head" 'move reports the detached head'
  assert_equal "$(git -C "$root/repo" branch --show-current)" feature \
    'the branch is attached to the current worktree'
  assert_equal "$(git -C "$root/held" rev-parse HEAD)" "$head" \
    'the released worktree stays at the same commit'
  if git -C "$root/held" symbolic-ref --quiet HEAD >/dev/null; then
    fail 'the released worktree should be left on a detached HEAD'
  fi
  assert_equal "$(resolve_field "$root" feature 1)" here 'a moved branch resolves as here'
}

# An unheld branch attaches without a holder argument.
{
  root="$(new_fixture)"
  git -C "$root/repo" worktree remove "$root/held"
  head="$(git -C "$root/repo" rev-parse feature)"
  assert_equal "$(resolve_field "$root" feature 1)" free 'an unheld branch resolves as free'

  # Every field keeps its slot under a tab IFS, which collapses empty runs.
  IFS=$'\t' read -r mode row_branch row_head row_untracked row_holder row_holder_head \
    <<< "$(cd "$root/repo" && "$HELPER" resolve feature)"
  assert_equal "$mode" free 'the free row keeps its mode'
  assert_equal "$row_branch" feature 'the free row keeps its branch'
  assert_equal "$row_head" "$head" 'the free row keeps its branch head'
  assert_equal "$row_untracked" 0 'the free row keeps its untracked count in its own field'
  assert_equal "$row_holder" '' 'the free row has no holder path'
  assert_equal "$row_holder_head" '' 'the free row has no holder head'

  result="$(cd "$root/repo" && "$HELPER" move feature "$head")"
  assert_equal "$(cut -f1 <<< "$result")" attached 'move attaches a free branch'
  assert_equal "$(git -C "$root/repo" branch --show-current)" feature \
    'a free branch attaches to the current worktree'
}

for transfer in staged unstaged mixed untracked; do
  root="$(new_fixture)"
  head="$(git -C "$root/held" rev-parse HEAD)"
  case "$transfer" in
    staged|mixed)
      printf 'staged\n' > "$root/held/README.md"
      git -C "$root/held" add README.md ;;
  esac
  case "$transfer" in
    unstaged|mixed) printf 'working\n' > "$root/held/README.md" ;;
    untracked) printf 'scratch\n' > "$root/held/scratch.txt" ;;
  esac
  git -C "$root/held" status --porcelain=v1 -z > "$root/status"
  git -C "$root/held" diff --binary > "$root/unstaged"
  git -C "$root/held" diff --cached --binary > "$root/staged"
  if result="$(cd "$root/repo" && "$HELPER" move feature "$head" "$root/held" 2>"$root/error")"; then
    git -C "$root/repo" status --porcelain=v1 -z > "$root/actual-status"
    git -C "$root/repo" diff --binary > "$root/actual-unstaged"
    git -C "$root/repo" diff --cached --binary > "$root/actual-staged"
    cmp "$root/status" "$root/actual-status" || fail "$transfer status transferred"
    cmp "$root/unstaged" "$root/actual-unstaged" || fail "$transfer unstaged bytes transferred"
    cmp "$root/staged" "$root/actual-staged" || fail "$transfer staged bytes transferred"
    assert_equal "$(git -C "$root/held" status --porcelain)" '' "$transfer source cleaned"
  else
    fail "$transfer transfer failed: $(cat "$root/error")"
  fi
done

{
  root="$(new_conflicting_fixture)"
  # Override merge.ff=only because this case needs Git to write MERGE_HEAD.
  git -C "$root/held" merge --no-ff conflicting >/dev/null 2>&1 || true
  assert_blocked "$root" feature "git -C $root/held merge --abort" \
    'a merge in progress in the holder'

  root="$(new_conflicting_fixture)"
  git -C "$root/held" cherry-pick conflicting >/dev/null 2>&1 || true
  assert_blocked "$root" feature "git -C $root/held cherry-pick --abort" \
    'a cherry-pick in progress in the holder'

  root="$(new_conflicting_fixture)"
  git -C "$root/held" rebase conflicting >/dev/null 2>&1 || true
  # A rebase detaches the holder, so no worktree record claims the branch.
  if output="$(cd "$root/repo" && "$HELPER" resolve feature 2>&1)"; then
    fail "a rebasing holder should not resolve: $output"
  elif ! grep -Fq "git -C $root/held rebase --abort" <<< "$output"; then
    fail "a rebasing holder error was not actionable: $output"
  fi
  git -C "$root/held" rebase --abort >/dev/null 2>&1 || true

  root="$(new_fixture)"
  git -C "$root/held" revert --no-edit HEAD~1 >/dev/null 2>&1 || true
  assert_blocked "$root" feature "git -C $root/held revert --abort" \
    'a revert in progress in the holder'

  root="$(new_fixture)"
  git -C "$root/held" bisect start >/dev/null 2>&1
  git -C "$root/held" bisect bad >/dev/null 2>&1
  git -C "$root/held" bisect good main >/dev/null 2>&1 || true
  assert_blocked "$root" feature "git -C $root/held bisect reset" \
    'a bisect in progress in the holder'
  git -C "$root/held" bisect reset >/dev/null 2>&1

  # A bisect detaches only when an untested revision sits strictly between its
  # good and bad ends, which is the midpoint git checks out. One commit past the
  # fixture's two supplies that gap; then no worktree record claims the branch.
  root="$(new_fixture)"
  printf 'base\nfeature\nmidpoint\n' > "$root/held/README.md"
  git -C "$root/held" commit --quiet -am 'chore: #350 bisect midpoint'
  first="$(git -C "$root/held" rev-list --max-parents=0 HEAD)"
  git -C "$root/held" bisect start >/dev/null 2>&1
  git -C "$root/held" bisect bad >/dev/null 2>&1
  git -C "$root/held" bisect good "$first" >/dev/null 2>&1 ||
    fail 'the deep bisect fixture could not start a bisect'
  if git -C "$root/held" symbolic-ref --quiet HEAD >/dev/null; then
    fail 'the deep bisect fixture did not detach the holder'
  fi
  if output="$(cd "$root/repo" && "$HELPER" resolve feature 2>&1)"; then
    fail "a bisecting holder should not resolve: $output"
  elif ! grep -Fq "git -C $root/held bisect reset" <<< "$output"; then
    fail "a bisecting holder error was not actionable: $output"
  fi
  assert_move_blocked "$root" feature "git -C $root/held bisect reset" \
    'a bisecting bystander'
  git -C "$root/held" bisect reset >/dev/null 2>&1

  # git am borrows the rebase-apply state, and only git am --abort clears it.
  root="$(new_conflicting_fixture)"
  git -C "$root/held" format-patch --quiet -1 -o "$root/patches" conflicting >/dev/null
  git -C "$root/held" am "$root/patches"/*.patch >/dev/null 2>&1 || true
  assert_blocked "$root" feature "git -C $root/held am --abort" \
    'a patch application in progress in the holder'
  git -C "$root/held" am --abort >/dev/null 2>&1 || true

  root="$(new_fixture)"
  git -C "$root/repo" worktree lock "$root/held" --reason 'pinned by the operator'
  assert_blocked "$root" feature "git worktree unlock $root/held" 'a locked holder'
  git -C "$root/repo" worktree unlock "$root/held"

  root="$(new_fixture)"
  printf 'base\nedited\n' > "$root/repo/README.md"
  assert_blocked "$root" feature "git -C $root/repo stash --include-untracked" \
    'uncommitted tracked changes in the current worktree'
}

# A stale worktree entry names the command that clears it.
{
  root="$(new_fixture)"
  rm -rf "$root/held"
  if output="$(cd "$root/repo" && "$HELPER" resolve feature 2>&1)"; then
    fail "a stale holder should not resolve: $output"
  elif ! grep -Fq 'run: git worktree prune' <<< "$output"; then
    fail "a stale holder error was not actionable: $output"
  fi
  git -C "$root/repo" worktree prune
  assert_equal "$(resolve_field "$root" feature 1)" free 'a pruned holder frees the branch'
}

# A failed attach restores the holder.
{
  root="$(new_fixture)"
  printf 'kept\n' > "$root/held/collide.txt"
  git -C "$root/held" add collide.txt
  git -C "$root/held" commit --quiet -m 'feat: #350 add a colliding file'
  head="$(git -C "$root/held" rev-parse HEAD)"
  printf 'local\n' > "$root/repo/collide.txt"
  printf 'scratch\n' > "$root/held/scratch.txt"

  assert_equal "$(resolve_field "$root" feature 4)" 1 'resolve counts untracked files in the holder'
  if output="$(cd "$root/repo" && "$HELPER" move feature "$head" "$root/held" 2>&1)"; then
    fail "a colliding untracked file should block the attach: $output"
  elif ! grep -Fq "path collision" <<< "$output"; then
    fail "a colliding path was not refused before mutation: $output"
  fi
  assert_equal "$(git -C "$root/held" branch --show-current)" feature \
    'a failed attach restores the holder'
  assert_equal "$(git -C "$root/repo" branch --show-current)" main \
    'a failed attach leaves the current worktree alone'
  assert_equal "$(cat "$root/repo/collide.txt")" local \
    'a failed attach preserves the untracked file'
}

# Invalid input and stale context are refused.
{
  root="$(new_fixture)"
  if output="$(cd "$root/repo" && "$HELPER" resolve absent 2>&1)"; then
    fail "an absent branch should not resolve: $output"
  elif ! grep -Fq 'local branch absent does not exist' <<< "$output"; then
    fail "an absent branch error was not actionable: $output"
  fi

  if output="$(cd "$root/repo" && "$HELPER" move feature 0000000 "$root/held" 2>&1)"; then
    fail "a stale branch head should not move: $output"
  elif ! grep -Fq 'rerun resolve against current context' <<< "$output"; then
    fail "a stale branch head error was not actionable: $output"
  fi

  head="$(git -C "$root/held" rev-parse HEAD)"
  if output="$(cd "$root/repo" && "$HELPER" move feature "$head" 2>&1)"; then
    fail "a held branch should not move as free: $output"
  elif ! grep -Fq 'rather than free' <<< "$output"; then
    fail "a held-versus-free error was not actionable: $output"
  fi
  assert_equal "$(git -C "$root/held" branch --show-current)" feature \
    'refused moves leave the holder attached'

  if output="$(cd "$root/repo" && "$HELPER" 2>&1)"; then
    fail "a missing subcommand should not succeed: $output"
  elif ! grep -Fq 'usage: worktree-context.sh' <<< "$output"; then
    fail "a missing subcommand error did not print usage: $output"
  fi

  root="$(new_fixture)"
  printf 'garbage\n' > "$root/held/.git"
  if output="$(cd "$root/repo" && "$HELPER" resolve feature 2>&1)"; then
    fail "an unreadable holder should not resolve: $output"
  elif ! grep -Fq 'is not a readable git worktree' <<< "$output"; then
    fail "an unreadable holder error was not actionable: $output"
  fi
  assert_move_blocked "$root" feature 'is not a readable git worktree' \
    'an unreadable holder'

  # A state file that yields nothing hides the branch it names just as well as
  # an unreadable worktree, so it is refused rather than read as absent.
  root="$(new_fixture)"
  git -C "$root/repo" worktree remove "$root/held"
  git -C "$root/repo" worktree add --quiet "$root/other" -b other-work
  # A lone newline reads back as an empty first line, which hides the branch
  # just as an empty file does.
  printf '\n' > "$(git -C "$root/other" rev-parse --absolute-git-dir)/BISECT_START"
  if output="$(cd "$root/repo" && "$HELPER" resolve feature 2>"$root/stderr")"; then
    fail "an unreadable state file should not resolve: $output"
  fi
  assert_equal "$output" '' 'a refused state read emits no row'
  if ! grep -Fq 'git state file is empty or unreadable' "$root/stderr"; then
    fail "an unreadable state file error was not actionable: $(cat "$root/stderr")"
  fi
  assert_move_blocked "$root" feature 'git state file is empty or unreadable' \
    'an unreadable state file'

  # An unreadable worktree hides whatever operation it is running, so a free
  # branch is refused rather than reported free on stdout.
  root="$(new_fixture)"
  git -C "$root/repo" worktree remove "$root/held"
  git -C "$root/repo" worktree add --quiet "$root/other" -b other-work
  printf 'garbage\n' > "$root/other/.git"
  if output="$(cd "$root/repo" && "$HELPER" resolve feature 2>"$root/stderr")"; then
    fail "an unreadable bystander worktree should not resolve: $output"
  fi
  # The refusal has to reach the machine channel: a row on stdout would move the
  # branch no matter what stderr said.
  assert_equal "$output" '' 'a refused resolve emits no row'
  if ! grep -Fq "git worktree remove --force $root/other" "$root/stderr"; then
    fail "an unreadable bystander error was not actionable: $(cat "$root/stderr")"
  fi
  assert_move_blocked "$root" feature 'its operations could not be checked' \
    'an unreadable bystander worktree'
}

HELPER="$HELPER" TEST_ROOT="$TMP_ROOT" node --input-type=module <<'NODE'
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const helper = process.env.HELPER;
const realGit = spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim();
const run = (cwd, command, args, env = {}) => spawnSync(command, args, {
  cwd, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', ...env }, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
});
function git(cwd, ...args) {
  const result = run(cwd, 'git', args);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function fixture() {
  const root = fs.mkdtempSync(path.join(process.env.TEST_ROOT, 'transaction-'));
  const destination = path.join(root, 'repo');
  const source = path.join(root, 'held');
  fs.mkdirSync(destination);
  git(destination, '-c', 'init.defaultBranch=main', 'init', '-q');
  git(destination, 'config', 'user.email', 'fixture@example.com');
  git(destination, 'config', 'user.name', 'Fixture');
  fs.writeFileSync(path.join(destination, 'base'), 'base\n');
  fs.writeFileSync(path.join(destination, '.gitignore'), '*.ignored\n');
  git(destination, 'add', '.'); git(destination, 'commit', '-qm', 'base');
  for (const value of ['stash one', 'stash two']) {
    fs.writeFileSync(path.join(destination, 'base'), value);
    git(destination, 'stash', 'push', '-qm', value);
  }
  git(destination, 'worktree', 'add', '-qb', 'feature', source);
  fs.writeFileSync(path.join(source, 'base'), 'staged\n'); git(source, 'add', 'base');
  fs.writeFileSync(path.join(source, 'base'), 'working\n');
  fs.writeFileSync(path.join(source, 'scratch'), 'scratch\n');
  fs.writeFileSync(path.join(source, 'stay.ignored'), 'ignored\n');
  fs.writeFileSync(path.join(destination, 'local'), 'destination\n');
  fs.mkdirSync(path.join(root, 'tools'));
  fs.writeFileSync(path.join(root, 'tools', 'git'), `#!/bin/sh
for argument in "$@"; do
  if [ "$argument" = stash ]; then echo 'helper attempted stash' >&2; exit 96; fi
done
"$REAL_GIT" "$@"
`, { mode: 0o755 });
  return { root, source, destination, oid: git(source, 'rev-parse', 'HEAD') };
}
function files(root) {
  const result = {};
  function visit(relative) {
    const absolute = path.join(root, relative);
    for (const name of fs.readdirSync(absolute)) {
      if (name === '.git') continue;
      const child = path.join(relative, name);
      const stat = fs.lstatSync(path.join(root, child));
      if (stat.isDirectory()) { result[child] = 'directory'; visit(child); }
      else if (stat.isSymbolicLink()) result[child] = ['link', fs.readlinkSync(path.join(root, child))];
      else result[child] = [stat.mode & 0o777, fs.readFileSync(path.join(root, child)).toString('base64')];
    }
  }
  visit(''); return result;
}
function snapshot(f) {
  return [f.source, f.destination].map(root => ({
    head: git(root, 'rev-parse', 'HEAD'),
    branch: run(root, 'git', ['symbolic-ref', '-q', 'HEAD']).stdout,
    index: fs.readFileSync(path.join(git(root, 'rev-parse', '--absolute-git-dir'), 'index')).toString('base64'),
    files: files(root),
    stash: fs.readFileSync(path.join(f.destination, '.git', 'logs', 'refs', 'stash')).toString('base64'),
    stashRef: git(root, 'rev-parse', 'refs/stash'),
    stashList: git(root, 'stash', 'list'),
  }));
}
function helperEnv(f) { return { PATH: `${path.join(f.root, 'tools')}:${process.env.PATH}`, REAL_GIT: realGit }; }
function move(f, env = {}) { return run(f.destination, helper, ['move', 'feature', f.oid, f.source], { ...helperEnv(f), ...env }); }
function transaction(f) {
  const folder = path.join(f.destination, '.git', 'move-branch-here', 'transactions');
  return fs.readdirSync(folder)[0];
}
function recover(f, id) { return run(f.destination, helper, ['recover', id], helperEnv(f)); }
function check(name, test) {
  test(); console.log(`OK: ${name}`);
}

check('raw bytes, modes, symlinks, rename, deletion, and unusual names', () => {
  const f = fixture();
  for (const name of ['binary', 'executable', 'deleted', 'renamed']) fs.writeFileSync(path.join(f.source, name), 'before');
  git(f.source, 'add', '.'); git(f.source, 'commit', '-qm', 'forms');
  f.oid = git(f.source, 'rev-parse', 'HEAD');
  fs.writeFileSync(path.join(f.source, 'binary'), Buffer.from([0, 1, 255, 0, 17]));
  fs.chmodSync(path.join(f.source, 'executable'), 0o755);
  fs.unlinkSync(path.join(f.source, 'deleted'));
  git(f.source, 'mv', 'renamed', 'new name');
  fs.symlinkSync('binary', path.join(f.source, 'link'));
  for (const name of ['space name', 'tab\tname', 'line\nname', '-dash', '[*]']) fs.writeFileSync(path.join(f.source, name), name);
  git(f.source, 'add', '-A');
  fs.writeFileSync(path.join(f.source, 'binary'), Buffer.from([8, 0, 222, 0]));
  fs.writeFileSync(path.join(f.source, 'untracked'), Buffer.from([0, 255, 0]));
  const expected = files(f.source);
  const status = git(f.source, 'status', '--porcelain=v1', '-z');
  const staged = git(f.source, 'diff', '--cached', '--binary');
  const unstaged = git(f.source, 'diff', '--binary');
  const stash = snapshot(f)[0].stash;
  const result = move(f);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trimEnd().split('\t').length, 4);
  const actual = files(f.destination); delete actual.local; delete expected['stay.ignored'];
  assert.deepEqual(actual, expected);
  assert.equal(git(f.destination, 'status', '--porcelain=v1', '-z').replace('?? local\0', ''), status);
  assert.equal(git(f.destination, 'diff', '--cached', '--binary'), staged);
  assert.equal(git(f.destination, 'diff', '--binary'), unstaged);
  assert.equal(git(f.source, 'status', '--porcelain'), '');
  assert.equal(snapshot(f)[0].stash, stash);
  assert.equal(fs.readFileSync(path.join(f.source, 'stay.ignored'), 'utf8'), 'ignored\n');
});

for (const fault of ['prepared', 'before-head', 'after-head', 'detached', 'attached', 'before-index', 'index-write', 'index-renamed', 'after-index', 'before-file', 'after-file', 'after-file:2', 'after-file:3', 'after-file:4', 'temporary', 'destination', 'source', 'verify']) {
  check(`rollback at ${fault}`, () => {
    const f = fixture(); const before = snapshot(f);
    const result = move(f, { MOVE_BRANCH_HERE_FAULT: fault });
    assert.notEqual(result.status, 0, result.stdout);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /injected failure/);
    assert.deepEqual(snapshot(f), before, result.stderr);
  });
}
for (const phase of ['prepared', 'detached', 'attached', 'after-index', 'after-file:2', 'temporary', 'destination', 'source']) {
  check(`interrupted recovery at ${phase}`, () => {
    const f = fixture(); const before = snapshot(f);
    assert.notEqual(move(f, { MOVE_BRANCH_HERE_KILL: phase }).status, 0);
    const id = transaction(f);
    const first = recover(f, id); assert.equal(first.status, 0, first.stderr);
    assert.deepEqual(snapshot(f), before);
    assert.equal(recover(f, id).status, 0);
  });
}
check('ignored descendants and unrelated destination descendants survive', () => {
  const f = fixture();
  fs.mkdirSync(path.join(f.source, 'dir'));
  fs.writeFileSync(path.join(f.source, 'dir', 'payload'), 'move');
  fs.writeFileSync(path.join(f.source, 'dir', 'stay.ignored'), 'stay');
  fs.chmodSync(path.join(f.source, 'dir'), 0o750);
  const result = move(f); assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(f.source, 'dir', 'stay.ignored'), 'utf8'), 'stay');
  assert.equal(fs.existsSync(path.join(f.source, 'dir', 'payload')), false);
  assert.equal(fs.readFileSync(path.join(f.destination, 'dir', 'payload'), 'utf8'), 'move');
  assert.equal(fs.statSync(path.join(f.source, 'dir')).mode & 0o777, 0o750);
});
for (const failure of ['', 'verify']) {
  check(`directory swaps and staged deletion recreation ${failure || 'success'}`, () => {
    const f = fixture();
    fs.mkdirSync(path.join(f.source, 'nested'));
    fs.writeFileSync(path.join(f.source, 'nested', 'old'), 'tracked');
    git(f.source, 'add', '-A'); git(f.source, 'commit', '-qm', 'tree');
    f.oid = git(f.source, 'rev-parse', 'HEAD');
    git(f.source, 'rm', '-r', 'nested');
    fs.writeFileSync(path.join(f.source, 'nested'), 'replacement'); git(f.source, 'add', 'nested');
    git(f.source, 'rm', 'base'); fs.writeFileSync(path.join(f.source, 'base'), 'recreated untracked');
    const before = snapshot(f); const status = git(f.source, 'status', '--porcelain=v1', '-z');
    const result = move(f, failure ? { MOVE_BRANCH_HERE_FAULT: failure } : {});
    if (failure) { assert.notEqual(result.status, 0); assert.deepEqual(snapshot(f), before, result.stderr); }
    else {
      assert.equal(result.status, 0, result.stderr);
      assert.equal(git(f.destination, 'status', '--porcelain=v1', '-z').replace('?? local\0', ''), status);
      assert.equal(git(f.source, 'status', '--porcelain'), '');
      assert.equal(fs.readFileSync(path.join(f.source, 'base'), 'utf8'), 'working\n');
    }
  });
}
check('empty directory collision is refused', () => {
  const f = fixture(); fs.mkdirSync(path.join(f.destination, 'scratch'));
  const before = snapshot(f); const result = move(f);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /collision/); assert.deepEqual(snapshot(f), before);
});
check('Git mutate-then-fail rolls back actual HEAD state', () => {
  const f = fixture(); const before = snapshot(f);
  fs.writeFileSync(path.join(f.root, 'tools', 'git'), `#!/bin/sh
"$REAL_GIT" "$@" || exit $?
case " $* " in
  *" update-ref --no-deref HEAD "*)
    if [ ! -e "$INJECTED" ]; then touch "$INJECTED"; exit 77; fi ;;
esac
`);
  const result = move(f, { INJECTED: path.join(f.root, 'injected') });
  assert.notEqual(result.status, 0); assert.deepEqual(snapshot(f), before, result.stderr);
});
check('concurrent staging is retained and requires recovery', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.root, 'tools', 'git'), `#!/bin/sh
"$REAL_GIT" "$@" || exit $?
case " $* " in
  *" symbolic-ref HEAD refs/heads/feature "*)
    if [ ! -e "$INJECTED" ]; then touch "$INJECTED"; "$REAL_GIT" -C "$SOURCE" add scratch; fi ;;
esac
`);
  const result = move(f, { INJECTED: path.join(f.root, 'injected'), SOURCE: f.source });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /unexpected index/);
  assert.match(git(f.source, 'ls-files'), /scratch/);
});
check('hook suppression', () => {
  const f = fixture(); const hooks = path.join(f.root, 'hooks'); fs.mkdirSync(hooks);
  for (const hook of ['post-checkout', 'reference-transaction']) fs.writeFileSync(path.join(hooks, hook), '#!/bin/sh\necho invoked > "$SENTINEL"\nexit 1\n', { mode: 0o755 });
  git(f.source, 'config', 'core.hooksPath', hooks);
  const sentinel = path.join(f.root, 'sentinel'); const result = move(f, { SENTINEL: sentinel });
  assert.equal(result.status, 0, result.stderr); assert.equal(fs.existsSync(sentinel), false);
});
check('recovery preserves private objects across garbage collection', () => {
  const f = fixture(); const before = snapshot(f); move(f, { MOVE_BRANCH_HERE_KILL: 'destination' });
  git(f.destination, 'gc', '--prune=now');
  const result = recover(f, transaction(f)); assert.equal(result.status, 0, result.stderr); assert.deepEqual(snapshot(f), before);
});
check('truncated journal refuses and preserves recovery artifacts', () => {
  const f = fixture(); move(f, { MOVE_BRANCH_HERE_KILL: 'destination' }); const id = transaction(f);
  fs.writeFileSync(path.join(f.destination, '.git', 'move-branch-here', 'transactions', id, 'journal.json'), '{');
  const result = recover(f, id); assert.notEqual(result.status, 0); assert.match(result.stderr, /artifacts retained/);
  assert.notEqual(git(f.destination, 'for-each-ref', '--format=%(refname)', `refs/move-branch-here/${id}`), '');
});
check('detached destination restores its original commit', () => {
  const f = fixture(); git(f.destination, 'switch', '--detach'); const before = snapshot(f);
  const result = move(f, { MOVE_BRANCH_HERE_FAULT: 'verify' });
  assert.notEqual(result.status, 0); assert.deepEqual(snapshot(f), before, result.stderr);
});
check('signal rollback', () => {
  const f = fixture(); const before = snapshot(f);
  const result = move(f, { MOVE_BRANCH_HERE_SIGNAL: 'after-file:1' });
  assert.notEqual(result.status, 0); assert.deepEqual(snapshot(f), before, result.stderr);
});
check('committed cleanup retry', () => {
  const f = fixture(); const result = move(f, { MOVE_BRANCH_HERE_FAULT: 'cleanup' });
  assert.equal(result.status, 0, result.stderr);
  const committed = snapshot(f); const id = transaction(f);
  assert.equal(recover(f, id).status, 0); assert.deepEqual(snapshot(f), committed);
});
check('concurrent edit remains untouched and recovery data survives', () => {
  const f = fixture(); move(f, { MOVE_BRANCH_HERE_KILL: 'destination' });
  fs.writeFileSync(path.join(f.destination, 'base'), 'another writer');
  const id = transaction(f); const result = recover(f, id);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /unexpected file/);
  assert.equal(fs.readFileSync(path.join(f.destination, 'base'), 'utf8'), 'another writer');
  assert.notEqual(git(f.destination, 'for-each-ref', '--format=%(refname)', `refs/move-branch-here/${id}`), '');
});
for (const kind of ['exact', 'ancestor', 'descendant', 'ignored']) {
  check(`collision refusal ${kind}`, () => {
    const f = fixture();
    if (kind === 'exact') fs.writeFileSync(path.join(f.destination, 'scratch'), 'local');
    if (kind === 'ancestor') { fs.mkdirSync(path.join(f.source, 'dir')); fs.writeFileSync(path.join(f.source, 'dir', 'file'), 'source'); fs.writeFileSync(path.join(f.destination, 'dir'), 'local'); }
    if (kind === 'descendant') { fs.mkdirSync(path.join(f.destination, 'scratch')); fs.writeFileSync(path.join(f.destination, 'scratch', 'local'), 'local'); }
    if (kind === 'ignored') { fs.writeFileSync(path.join(f.source, 'new.ignored'), 'source'); git(f.source, 'add', '-f', 'new.ignored'); fs.writeFileSync(path.join(f.destination, 'new.ignored'), 'local'); }
    const before = snapshot(f); const result = move(f);
    assert.notEqual(result.status, 0); assert.match(result.stderr, /collision/); assert.deepEqual(snapshot(f), before);
  });
}
for (const kind of ['intent', 'split', 'skip', 'assume', 'sparse', 'sparse-index', 'filter', 'conversion', 'submodule', 'nested', 'special']) {
  check(`unsupported state refuses before mutation ${kind}`, () => {
    const f = fixture();
    if (kind === 'intent') git(f.source, 'add', '-N', 'scratch');
    if (kind === 'split') git(f.source, 'update-index', '--split-index');
    if (kind === 'skip') git(f.source, 'update-index', '--skip-worktree', 'base');
    if (kind === 'assume') git(f.source, 'update-index', '--assume-unchanged', 'base');
    if (kind === 'sparse') git(f.source, 'config', 'core.sparseCheckout', 'true');
    if (kind === 'sparse-index') git(f.source, 'config', 'index.sparse', 'true');
    if (kind === 'filter') fs.writeFileSync(path.join(f.source, '.gitattributes'), 'base filter=external\n');
    if (kind === 'conversion') git(f.source, 'config', 'core.autocrlf', 'true');
    if (kind === 'submodule') git(f.source, 'update-index', '--add', '--cacheinfo', `160000,${f.oid},module`);
    if (kind === 'nested') { fs.mkdirSync(path.join(f.source, 'nested')); git(path.join(f.source, 'nested'), 'init', '-q'); }
    if (kind === 'special') assert.equal(run(f.source, 'mkfifo', ['scratch-pipe']).status, 0);
    const before = kind === 'special' ? null : snapshot(f);
    const result = move(f);
    assert.notEqual(result.status, 0); assert.match(result.stderr, /unsupported/);
    if (before) assert.deepEqual(snapshot(f), before);
    else assert.equal(git(f.source, 'branch', '--show-current'), 'feature');
  });
}
check('maximum-length and non-UTF8 pathnames retain bytes', () => {
  const f = fixture();
  const names = [Buffer.from('a'.repeat(255))];
  const nonUtf8 = Buffer.from([0x72, 0xff, 0x61]);
  try {
    fs.writeFileSync(Buffer.concat([Buffer.from(`${f.source}/`), nonUtf8]), Buffer.from([0, 255, 17]));
    names.push(nonUtf8);
  } catch (error) {
    if (error.code !== 'EILSEQ') throw error;
  }
  for (const name of names.slice(0, 1)) fs.writeFileSync(Buffer.concat([Buffer.from(`${f.source}/`), name]), Buffer.from([0, 255, 17]));
  const result = move(f); assert.equal(result.status, 0, result.stderr);
  for (const name of names) {
    assert.deepEqual(fs.readFileSync(Buffer.concat([Buffer.from(`${f.destination}/`), name])), Buffer.from([0, 255, 17]));
    assert.equal(fs.existsSync(Buffer.concat([Buffer.from(`${f.source}/`), name])), false);
  }
  if (names.length > 1) assert.match(result.stderr, /\\xff/);
});
check('staged addition deleted in working tree retains index split', () => {
  const f = fixture(); git(f.source, 'add', 'scratch'); fs.unlinkSync(path.join(f.source, 'scratch'));
  const status = git(f.source, 'status', '--porcelain=v1', '-z');
  const result = move(f); assert.equal(result.status, 0, result.stderr);
  assert.equal(git(f.destination, 'status', '--porcelain=v1', '-z').replace('?? local\0', ''), status);
  assert.equal(git(f.source, 'status', '--porcelain'), '');
});
NODE

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT assertion(s) failed" >&2
  exit 1
fi

echo "OK: move-branch-here worktree contract passed"
