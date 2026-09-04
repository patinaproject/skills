#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HELPER="$REPO_ROOT/plugins/engineering/skills/move-session-here/scripts/session-handoff.mjs"
FIXTURE_ROOT="$(mktemp -d)"
trap 'rm -rf "$FIXTURE_ROOT"' EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

run_handoff() {
  env -u CLAUDE_CONFIG_DIR -u CODEX_HOME HOME="$FIXTURE_ROOT/home" \
    node "$HELPER" "$@"
}

mkdir -p "$FIXTURE_ROOT/home/.claude/projects/project"
mkdir -p "$FIXTURE_ROOT/home/.claude-t3/projects/project"
mkdir -p "$FIXTURE_ROOT/home/.codex-t3/sessions/2026/09/04"

claude_id="11111111-1111-4111-8111-111111111111"
claude_file="$FIXTURE_ROOT/home/.claude/projects/project/$claude_id.jsonl"
claude_sidecar="$FIXTURE_ROOT/home/.claude/projects/project/$claude_id/subagents/agent-a.jsonl"
mkdir -p "$(dirname "$claude_sidecar")"
cat >"$claude_file" <<JSONL
{"type":"queue-operation","sessionId":"$claude_id","operation":"enqueue"}
{"type":"user","sessionId":"$claude_id","uuid":"u1","parentUuid":null,"isSidechain":false,"cwd":"/work/project","gitBranch":"feature/session","message":{"content":"Build the handoff."}}
{"type":"assistant","sessionId":"$claude_id","uuid":"ignored","parentUuid":"u1","isSidechain":true,"message":{"content":[{"type":"text","text":"sidechain noise"}]}}
{"type":"assistant","sessionId":"$claude_id","uuid":"a1","parentUuid":"u1","isSidechain":false,"attributionSkill":"engineering:patina-mode","attributionPlugin":"engineering","message":{"content":[{"type":"text","text":"I will inspect it."},{"type":"tool_use","name":"Read","input":{"file_path":"src/main.js"}}]}}
{"type":"user","sessionId":"$claude_id","uuid":"t1","parentUuid":"a1","isSidechain":false,"attributionMcpServer":"github","attributionMcpTool":"get_issue","message":{"content":[{"type":"tool_result","content":"file contents"}]},"toolUseResult":{"path":"src/main.js","status":"read"}}
{"type":"last-prompt","sessionId":"$claude_id","leafUuid":"t1"}
JSONL
cat >"$claude_sidecar" <<JSONL
{"type":"user","sessionId":"agent-a","uuid":"su1","parentUuid":null,"isSidechain":false,"cwd":"/work/project","gitBranch":"feature/session","message":{"content":"Inspect tests."}}
{"type":"assistant","sessionId":"agent-a","uuid":"sa1","parentUuid":"su1","isSidechain":false,"message":{"content":[{"type":"text","text":"Tests need one case."}]}}
JSONL

before_hash="$(cksum "$claude_file" "$claude_sidecar")"
claude_output="$(run_handoff "$claude_id")"
after_hash="$(cksum "$claude_file" "$claude_sidecar")"
test "$before_hash" = "$after_hash" || fail "Claude source files changed"
test "$(jq -r '.format' <<<"$claude_output")" = "claude" || fail "Claude format missing"
test "$(jq -r '.metadata.cwd' <<<"$claude_output")" = "/work/project" || fail "Claude cwd missing"
test "$(jq -r '.metadata.gitBranch' <<<"$claude_output")" = "feature/session" || fail "Claude branch missing"
test "$(jq -r '.tracks | length' <<<"$claude_output")" = "2" || fail "Claude sidecar missing"
test "$(jq -r '[.tracks[].events[] | select(.uuid == "ignored")] | length' <<<"$claude_output")" = "0" || fail "Claude sidechain was retained"
test "$(jq -r '.tracks[0].events | map(.uuid) | join(",")' <<<"$claude_output")" = "u1,a1,t1" || fail "Claude DAG order is wrong"
test "$(jq -r '.metadata.skills | join(",")' <<<"$claude_output")" = "engineering:patina-mode" || fail "Claude skill attribution missing"
test "$(jq -r '.metadata.mcp | map(.server + ":" + .tool) | join(",")' <<<"$claude_output")" = "github:get_issue" || fail "Claude MCP attribution missing"

fallback_id="22222222-2222-4222-8222-222222222222"
fork_id="33333333-3333-4333-8333-333333333333"
fork_file="$FIXTURE_ROOT/home/.claude-t3/projects/project/$fork_id.jsonl"
owner_file="$FIXTURE_ROOT/home/.claude-t3/projects/project/renamed-transcript.jsonl"
cat >"$fork_file" <<JSONL
{"type":"user","sessionId":"$fallback_id","uuid":"parent-u","parentUuid":null,"isSidechain":false,"message":{"content":"Parent history."}}
{"type":"custom-title","sessionId":"$fork_id","customTitle":"Fork"}
{"type":"user","sessionId":"$fork_id","uuid":"child-u","parentUuid":"parent-u","isSidechain":false,"message":{"content":"Quoted id: $fallback_id"}}
JSONL
cat >"$owner_file" <<JSONL
{"type":"custom-title","sessionId":"$fallback_id","customTitle":"Renamed owner"}
{"type":"user","sessionId":"$fallback_id","uuid":"owner-u","parentUuid":null,"isSidechain":false,"cwd":"/work/owner","message":{"content":"Real owner."}}
{"type":"last-prompt","sessionId":"$fallback_id","leafUuid":"owner-u"}
JSONL
fallback_output="$(run_handoff "$fallback_id")"
test "$(jq -r '.tracks[0].path' <<<"$fallback_output")" = "$owner_file" || fail "Claude fallback chose a reference instead of the owner"

codex_id="019a1111-2222-7333-8444-555555555555"
codex_file="$FIXTURE_ROOT/home/.codex-t3/sessions/2026/09/04/rollout-2026-09-04T12-00-00-$codex_id.jsonl"
cat >"$codex_file" <<JSONL
{"timestamp":"2026-09-04T12:00:00Z","type":"session_meta","payload":{"id":"$codex_id","cwd":"/work/codex","model_provider":"openai","git":{"branch":"feature/codex"},"dynamic_tools":["github"]}}
{"timestamp":"2026-09-04T12:00:01Z","type":"turn_context","payload":{"cwd":"/work/codex-new","model":"gpt-test","effort":"high","workspace_roots":["/work/codex-new"]}}
{"timestamp":"2026-09-04T12:00:02Z","type":"event_msg","payload":{"type":"token_count","info":"noise"}}
{"timestamp":"2026-09-04T12:00:03Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"Continue the task."}]}}
{"timestamp":"2026-09-04T12:00:04Z","type":"response_item","payload":{"type":"reasoning","summary":[{"type":"summary_text","text":"Need inspect state."}],"encrypted_content":"opaque"}}
{"timestamp":"2026-09-04T12:00:05Z","type":"response_item","payload":{"type":"function_call","name":"exec_command","call_id":"call-1","arguments":"{\"cmd\":\"git status\"}"}}
{"timestamp":"2026-09-04T12:00:06Z","type":"response_item","payload":{"type":"function_call_output","call_id":"call-1","output":"clean"}}
{"timestamp":"2026-09-04T12:00:07Z","type":"response_item","payload":{"type":"custom_tool_call","name":"apply_patch","call_id":"call-2","input":"patch"}}
{"timestamp":"2026-09-04T12:00:08Z","type":"response_item","payload":{"type":"custom_tool_call_output","call_id":"call-2","output":"done"}}
{"timestamp":"2026-09-04T12:00:09Z","type":"response_item","payload":{"type":"agent_message","message":"Subagent result."}}
{"timestamp":"2026-09-04T12:00:10Z","type":"compacted","payload":{"summary":"Earlier work summary."}}
JSONL
mkdir -p "$FIXTURE_ROOT/home/.codex-t3/thread-writer-locks"
printf '%s\n' "$codex_id" >"$FIXTURE_ROOT/home/.codex-t3/thread-writer-locks/$codex_id.lock"

codex_output="$(run_handoff "codex://threads/$codex_id")"
test "$(jq -r '.format' <<<"$codex_output")" = "codex" || fail "Codex format missing"
test "$(jq -r '.metadata.cwd' <<<"$codex_output")" = "/work/codex-new" || fail "Codex turn cwd did not win"
test "$(jq -r '.metadata.model' <<<"$codex_output")" = "gpt-test" || fail "Codex model missing"
test "$(jq -r '.tracks[0].events | map(.kind) | join(",")' <<<"$codex_output")" = "message,reasoning,function_call,function_call_output,custom_tool_call,custom_tool_call_output,agent_message,compacted" || fail "Codex event selection is wrong"
test "$(jq -r '[.tracks[0].events[].payload | has("encrypted_content")] | any' <<<"$codex_output")" = "false" || fail "Codex encrypted reasoning leaked"
test "$(jq -r '.tracks[0].path' <<<"$codex_output")" = "$codex_file" || fail "Codex sessions lookup escaped sessions directory"

override_root="$FIXTURE_ROOT/overrides/claude"
override_id="44444444-4444-4444-8444-444444444444"
mkdir -p "$override_root/projects/project"
cat >"$override_root/projects/project/$override_id.jsonl" <<JSONL
{"type":"user","sessionId":"$override_id","uuid":"override-u","parentUuid":null,"isSidechain":false,"message":{"content":"Override home."}}
JSONL
override_output="$(env -u CODEX_HOME HOME="$FIXTURE_ROOT/home" CLAUDE_CONFIG_DIR="$override_root" node "$HELPER" "$override_id")"
test "$(jq -r '.tracks[0].path' <<<"$override_output")" = "$override_root/projects/project/$override_id.jsonl" || fail "CLAUDE_CONFIG_DIR was not honored"

set +e
not_found_output="$(run_handoff "55555555-5555-4555-8555-555555555555" 2>&1)"
not_found_status=$?
set -e
test "$not_found_status" -eq 2 || fail "not-found exit status was $not_found_status"
test "$(jq -r '.error' <<<"$not_found_output")" = "not_found" || fail "not-found error missing"
test "$(jq -r '.searchedHomes | sort | join(",")' <<<"$not_found_output")" = "$FIXTURE_ROOT/home/.claude,$FIXTURE_ROOT/home/.claude-t3" || fail "not-found homes missing"

echo "OK: move-session-here transcript contract passed"
