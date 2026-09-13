#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SKILL="$ROOT/skills/maintain-orchestrator"
ORCH="$ROOT/plugins/engineering/skills/patina-mode/scripts/orch/orch.ts"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
STORE="$TMP/store"
mkdir -p "$STORE/inbox" "$TMP/bin"
cat > "$TMP/playbook.md" <<'EOF'
# Orchestrate

Create one durable store and preserve worker history.
EOF
cat > "$TMP/operator.md" <<'EOF'
/patina-mode Go, be fully autonomous, and use Orchestrate.

## Standing orders

1. Current intake rule.
2. Keep unrelated history.
EOF
cat > "$STORE/preferences.md" <<'EOF'
1. Old intake rule.
9. Historical worker constraint.
EOF
cp "$TMP/operator.md" "$STORE/program-prompt.md"
printf '# Overview\nold issue history\n' > "$STORE/overview.md"
printf 'id\ttrack\tstate\tbranch\tpr\tsha\tbrief\nunit-1\tbuild\tdone\tbranch\t1\tsha\tbrief\n' > "$STORE/units.tsv"
printf 'pr\tsha\tverdict\tevidence\tverifier\tts\n1\tsha\tunit-test-verified\told.json\told\t2026-01-01T00:00:00Z\n' > "$STORE/ledger.tsv"
printf '' > "$STORE/gates.md"
printf '{}\n' > "$STORE/frontier.json"
cat > "$STORE/poll-state.json" <<'EOF'
{"interval_seconds":600,"runtime_mechanism":"heartbeat","restart_command":"start wake","stop_command":"stop wake","state":"active","intake_enabled":true}
EOF
cat > "$STORE/ownership-config.json" <<EOF
{"repository":"github.com/patinaproject/skills","ref":"refs/heads/patinaproject-issue-ownership","client":"$TMP/bin/registry.py","readCommand":["$TMP/bin/registry.py","show"],"claimSubcommand":"claim","atomicOperation":"Validated atomic fast-forward push"}
EOF
cat > "$TMP/bin/registry.py" <<'EOF'
#!/usr/bin/env python3
print('{}')
EOF
chmod +x "$TMP/bin/registry.py"
cat > "$STORE/slack-config.json" <<'EOF'
{"appId":"A","botUserId":"B","workspaceId":"T","recipientUserId":"U","credentialSource":{"provider":"Infisical","path":"/shell"},"notificationPolicy":"Checkpoint gates only; one deduplicated DM per gate","cliContract":{"authTest":"infisical run -- slack api auth.test","send":"infisical run -- slack api chat.postMessage","requiredAuthTest":"Require ok=true"}}
EOF
printf '# Handoff\nold handoff\n' > "$STORE/HANDOFF.md"
printf 'ts\tphase\tdecision\twhy\tevidence\tresult\nold\tphase\told decision\told\told\told\n' > "$STORE/decisions.tsv"
printf '' > "$STORE/status.md"

python3 "$SKILL/scripts/maintain-orchestrator.py" --store "$STORE" --playbook "$TMP/playbook.md" --operator-prompt "$TMP/operator.md" --orch "$ORCH" > "$TMP/first.json"
grep -q '1. Current intake rule.' "$STORE/preferences.md"
grep -q '3. Historical worker constraint.' "$STORE/preferences.md"
grep -q 'old issue history' "$STORE/overview.md"
grep -q 'unit-1' "$STORE/units.tsv"
grep -q 'old decision' "$STORE/decisions.tsv"
first_lines=$(wc -l < "$STORE/decisions.tsv")
first_state=$(cat "$STORE/preferences.md" "$STORE/program-prompt.md" "$STORE/poll-state.json")
python3 "$SKILL/scripts/maintain-orchestrator.py" --store "$STORE" --playbook "$TMP/playbook.md" --operator-prompt "$TMP/operator.md" --orch "$ORCH" > "$TMP/second.json"
test "$first_lines" = "$(wc -l < "$STORE/decisions.tsv")"
test "$first_state" = "$(cat "$STORE/preferences.md" "$STORE/program-prompt.md" "$STORE/poll-state.json")"

python3 - <<'PY' "$STORE/ownership-config.json"
import json,sys
p=sys.argv[1]; x=json.load(open(p)); x['claimSubcommand']='wrong'; json.dump(x,open(p,'w'))
PY
python3 "$SKILL/scripts/maintain-orchestrator.py" --store "$STORE" --playbook "$TMP/playbook.md" --operator-prompt "$TMP/operator.md" > "$TMP/registry.json"
test "$(jq -r .registry.ok "$TMP/registry.json")" = false

python3 - <<'PY' "$STORE/slack-config.json"
import json,sys
p=sys.argv[1]; x=json.load(open(p)); del x['cliContract']['send']; json.dump(x,open(p,'w'))
PY
python3 "$SKILL/scripts/maintain-orchestrator.py" --store "$STORE" --playbook "$TMP/playbook.md" --operator-prompt "$TMP/operator.md" >/dev/null
test "$(jq -r .intake_enabled "$STORE/poll-state.json")" = false

python3 - <<'PY' "$STORE/poll-state.json"
import json,sys
p=sys.argv[1]; x=json.load(open(p)); x['interval_seconds']=0; json.dump(x,open(p,'w'))
PY
python3 "$SKILL/scripts/maintain-orchestrator.py" --store "$STORE" --playbook "$TMP/playbook.md" --operator-prompt "$TMP/operator.md" > "$TMP/wake.json"
test "$(jq -r .wake.ok "$TMP/wake.json")" = false

printf 'malformed\n' > "$STORE/units.tsv"
cp "$STORE/units.tsv" "$TMP/units.before"
if python3 "$SKILL/scripts/maintain-orchestrator.py" --store "$STORE" --playbook "$TMP/playbook.md" --operator-prompt "$TMP/operator.md" >/dev/null 2>&1; then
  echo 'malformed store unexpectedly accepted' >&2
  exit 1
fi
cmp "$TMP/units.before" "$STORE/units.tsv"
echo 'OK: maintain-orchestrator focused tests'
