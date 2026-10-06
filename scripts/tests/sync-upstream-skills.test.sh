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
perl -0pi -e 's/shared-v1/shared-v2/' "$upstream/plugins/pstack/skills/poteto-mode/SKILL.md"
printf 'other-v2\n' > "$upstream/plugins/pstack/other.md"
git -C "$upstream" add -A
git -C "$upstream" -c user.name=test -c user.email=test@example.com commit -q -m v2
v2="$(git -C "$upstream" rev-parse HEAD)"
head_before="$(git -C "$consumer" rev-parse HEAD)"
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
const fs=require('fs'); const p=process.argv[2]; const j={"plugins/engineering/skills/patina-mode/SKILL.md":{"kind":"policy","reason":"fixture local policy","upstream":{"status":"not-proposed"}}}; fs.writeFileSync(p,JSON.stringify(j)+'\n');
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
