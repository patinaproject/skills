#!/usr/bin/env bash
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }
upstream="$work/upstream"
consumer="$work/consumer"
mkdir -p "$upstream/plugins/pstack/skills/poteto-mode" "$consumer/plugins/engineering/skills/patina-mode"
git init -q -b main "$upstream"
printf 'line-a\nshared-v1\n' > "$upstream/plugins/pstack/skills/poteto-mode/SKILL.md"
printf 'other-v1\n' > "$upstream/plugins/pstack/other.md"
git -C "$upstream" add -A
git -C "$upstream" -c user.name=test -c user.email=test@example.com commit -q -m v1
v1="$(git -C "$upstream" rev-parse HEAD)"
printf 'line-a\nshared-v1\n' > "$consumer/plugins/engineering/skills/patina-mode/SKILL.md"
printf 'other-v1\n' > "$consumer/plugins/engineering/other.md"
printf 'Patina-only\n' > "$consumer/plugins/engineering/NOTICE.md"
git init -q -b main "$consumer"
git -C "$consumer" add -A
git -C "$consumer" -c user.name=test -c user.email=test@example.com commit -q -m base
cp "$repo_root/scripts/sync-upstream-skills.mjs" "$consumer/sync.mjs"
cat > "$consumer/upstream-skills.json" <<JSON
{"version":1,"sources":[{"name":"fixture","repo":"$upstream","ref":"main","pin":"$v1","transformsHash":"41800c48c46fc45fc13c0e19c4ce7cf27b755415326cf55b3bb93ac2f4d7cfa6","transforms":{"rename":{"poteto-mode":"patina-mode"},"denylist":[]},"targets":[{"kind":"subtree","source":"plugins/pstack","destination":"plugins/engineering","exclude":[]}]}]}
JSON
printf '{}\n' > "$consumer/upstream-skills-forks.json"
git -C "$consumer" add -A
git -C "$consumer" -c user.name=test -c user.email=test@example.com commit -q -m manifest
(cd "$consumer" && node sync.mjs --dry-run) || fail 'dry run at the pin should pass'
other="$work/other"
mkdir -p "$other/skills/extra" "$consumer/plugins/engineering/skills/extra"
git init -q -b main "$other"
printf 'extra-v1\n' > "$other/skills/extra/SKILL.md"
git -C "$other" add -A
git -C "$other" -c user.name=test -c user.email=test@example.com commit -q -m v1
other_v1="$(git -C "$other" rev-parse HEAD)"
printf 'extra-patina\n' > "$consumer/plugins/engineering/skills/extra/SKILL.md"
node - "$consumer" "$other" "$other_v1" <<'NODE'
const fs=require('fs'), [dir, repo, pin]=process.argv.slice(2);
const manifestPath=`${dir}/upstream-skills.json`, manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
manifest.sources.push({name:'other',repo,ref:'main',pin,transformsHash:'f47e57f0b19e8c15dfa9968b4f05a7ffa8ac503bff81904cdae924ec029dde84',transforms:{rename:{},denylist:[]},targets:[{kind:'skill',source:'skills/extra',destination:'plugins/engineering/skills/extra'}]});
fs.writeFileSync(manifestPath, JSON.stringify(manifest)+'\n');
fs.writeFileSync(`${dir}/upstream-skills-forks.json`, JSON.stringify({'plugins/engineering/skills/extra/SKILL.md':{kind:'policy',reason:'fixture other-source policy',upstream:{status:'not-proposed'}}})+'\n');
NODE
git -C "$consumer" add -A
git -C "$consumer" -c user.name=test -c user.email=test@example.com commit -q -m other-source
(cd "$consumer" && node sync.mjs --dry-run) || fail 'full dry run with an other-source fork should pass'
(cd "$consumer" && node sync.mjs fixture --dry-run) || fail 'single-source dry run should ignore another source fork'
printf 'extra-v1\n' > "$consumer/plugins/engineering/skills/extra/SKILL.md"
git -C "$consumer" -c user.name=test -c user.email=test@example.com commit -q -am revert-extra
if (cd "$consumer" && node sync.mjs other --dry-run 2>"$work/err"); then fail 'stale fork in the selected source should fail'; fi
grep -q 'stale forks:' "$work/err" || fail 'selected-source stale fork not reported as stale'
if (cd "$consumer" && node sync.mjs --dry-run 2>"$work/err"); then fail 'stale fork should fail a full dry run'; fi
grep -q 'stale forks:' "$work/err" || fail 'full-run stale fork not reported as stale'
printf 'extra-patina\n' > "$consumer/plugins/engineering/skills/extra/SKILL.md"
git -C "$consumer" -c user.name=test -c user.email=test@example.com commit -q -am restore-extra
node - "$consumer/upstream-skills-forks.json" <<'NODE'
const fs=require('fs'); const p=process.argv[2]; const j=JSON.parse(fs.readFileSync(p,'utf8')); j['docs/outside.md']={kind:'policy',reason:'fixture unowned fork',upstream:{status:'not-proposed'}}; fs.writeFileSync(p,JSON.stringify(j)+'\n');
NODE
git -C "$consumer" -c user.name=test -c user.email=test@example.com commit -q -am unowned-fork
if (cd "$consumer" && node sync.mjs fixture --dry-run 2>"$work/err"); then fail 'a fork outside every destination should fail'; fi
grep -q 'forks outside every source destination' "$work/err" || fail 'unowned fork not reported'
git -C "$consumer" reset -q --hard HEAD~1
perl -0pi -e 's/shared-v1/shared-v2/' "$upstream/plugins/pstack/skills/poteto-mode/SKILL.md"
printf 'other-v2\n' > "$upstream/plugins/pstack/other.md"
git -C "$upstream" add -A
git -C "$upstream" -c user.name=test -c user.email=test@example.com commit -q -m v2
v2="$(git -C "$upstream" rev-parse HEAD)"
head_before="$(git -C "$consumer" rev-parse HEAD)"
assert_untouched() {
  test "$(git -C "$consumer" rev-parse HEAD)" = "$head_before" || fail "$1: HEAD moved"
  test -z "$(git -C "$consumer" status --porcelain)" || fail "$1: index or working tree changed"
  test "$(jq -r '.sources[0].pin' "$consumer/upstream-skills.json")" = "$v1" || fail "$1: manifest pin changed"
}
# Upstream is at v2 here, so a real sync would visibly change the consumer.
for bad in --dryrun --dry_run --force -x; do
  status=0; (cd "$consumer" && node sync.mjs "$bad" 2>"$work/err") || status=$?
  test "$status" -eq 2 || fail "unknown argument $bad should exit 2, got $status"
  grep -q "unknown argument: $bad" "$work/err" || fail "unknown argument $bad not named"
  assert_untouched "unknown argument $bad"
done
status=0; (cd "$consumer" && node sync.mjs fixture --dryrun 2>"$work/err") || status=$?
test "$status" -eq 2 || fail "unknown flag after a source name should exit 2, got $status"
grep -q 'unknown argument: --dryrun' "$work/err" || fail 'unknown flag after a source name not named'
assert_untouched 'unknown flag after a source name'
status=0; (cd "$consumer" && node sync.mjs fixture other --dry-run 2>"$work/err") || status=$?
test "$status" -eq 2 || fail "two source names should exit 2, got $status"
grep -q 'unexpected extra source name: other' "$work/err" || fail 'second source name not named'
assert_untouched 'two source names'
for help in --help -h; do
  (cd "$consumer" && node sync.mjs "$help" >"$work/out" 2>"$work/err") || fail "$help should exit 0"
  grep -q '^usage: ' "$work/out" || fail "$help did not print usage"
  assert_untouched "$help"
done
(cd "$consumer" && node sync.mjs) || fail 'clean update should apply'
grep -q shared-v2 "$consumer/plugins/engineering/skills/patina-mode/SKILL.md" || fail 'updated skill missing'
grep -q other-v2 "$consumer/plugins/engineering/other.md" || fail 'updated subtree file missing'
test "$(git -C "$consumer" rev-parse HEAD)" = "$head_before" || fail 'sync committed unexpectedly'
test "$(git -C "$consumer" diff --cached --name-only | grep -Fx upstream-skills.json)" = upstream-skills.json || fail 'manifest pin not staged'
test "$(jq -r '.sources[0].pin' "$consumer/upstream-skills.json")" = "$v2" || fail 'manifest pin did not advance'
git -C "$consumer" add -A
git -C "$consumer" -c user.name=test -c user.email=test@example.com commit -q -m sync
perl -0pi -e 's/shared-v2/shared-patina/' "$consumer/plugins/engineering/skills/patina-mode/SKILL.md"
git -C "$consumer" -c user.name=test -c user.email=test@example.com commit -q -am local
perl -0pi -e 's/shared-v2/shared-upstream/' "$upstream/plugins/pstack/skills/poteto-mode/SKILL.md"
git -C "$upstream" add -A
git -C "$upstream" -c user.name=test -c user.email=test@example.com commit -q -m v3
node - "$consumer/upstream-skills-forks.json" <<'NODE'
const fs=require('fs'); const p=process.argv[2]; const j=JSON.parse(fs.readFileSync(p,'utf8')); Object.assign(j,{"plugins/engineering/skills/patina-mode/SKILL.md":{"kind":"policy","reason":"fixture local policy","upstream":{"status":"not-proposed"}}}); fs.writeFileSync(p,JSON.stringify(j)+'\n');
NODE
git -C "$consumer" add upstream-skills-forks.json
git -C "$consumer" -c user.name=test -c user.email=test@example.com commit -q -m fork
if (cd "$consumer" && node sync.mjs); then fail 'overlapping edits should conflict'; fi
test -n "$(git -C "$consumer" diff --name-only --diff-filter=U)" || fail 'conflict index entry missing'
grep -q shared-patina "$consumer/plugins/engineering/skills/patina-mode/SKILL.md" || fail 'ours side missing'
grep -q shared-upstream "$consumer/plugins/engineering/skills/patina-mode/SKILL.md" || fail 'theirs side missing'
git -C "$consumer" reset --merge HEAD >/dev/null
printf 'dirty\n' >> "$consumer/README.md"
if (cd "$consumer" && node sync.mjs --dry-run); then fail 'dirty tree should be rejected'; fi
echo 'PASS: sync-upstream-skills.test.sh'
