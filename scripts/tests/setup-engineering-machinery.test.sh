#!/usr/bin/env bash
# setup-engineering-machinery.test.sh — behavioral guard for the machinery
# installer that setup-engineering runs. Asserts the bundled payloads stay
# byte-identical to their canonical plugin sources, and that install-machinery.sh
# is idempotent and never clobbers unrelated content. Documentation prose is not
# asserted (see docs/adr/ADR-224-no-tests-on-documentation-content.md).

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SKILL="plugins/engineering/skills/setup-engineering"
SCRIPT="$SKILL/scripts/install-machinery.sh"
FAIL=0

fail() { echo "FAIL: $1" >&2; FAIL=$((FAIL + 1)); }

count() { grep -cF "$1" "$2" 2>/dev/null || true; }

# Vendoring carries the skill's assets, so they must stay byte-identical to the
# canonical plugin sources or a skills-only consumer gets a stale mandate.
diff -q plugins/engineering/hooks/session-start-context.md "$SKILL/assets/mandate.md" >/dev/null \
  || fail "assets/mandate.md drifted from hooks/session-start-context.md"
diff -q plugins/engineering/agents/patina-agent.md "$SKILL/assets/agents/patina-agent.md" >/dev/null \
  || fail "assets/agents/patina-agent.md drifted from agents/patina-agent.md"
diff -q plugins/engineering/agents/comment-sicko.md "$SKILL/assets/agents/comment-sicko.md" >/dev/null \
  || fail "assets/agents/comment-sicko.md drifted from agents/comment-sicko.md"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
REPO="$TMP/repo"
CODEX="$TMP/codex"
mkdir -p "$REPO"

# Pre-existing unrelated content that must survive every run.
printf '# Project rules\n\nKeep my house style.\n' > "$REPO/CLAUDE.md"
mkdir -p "$CODEX"
printf '[features]\nother = true\nmulti_agent = false\n\n[sandbox]\nmode = "read"\n' > "$CODEX/config.toml"
printf '# My Codex rules\n\nUnrelated line.\n' > "$CODEX/AGENTS.md"

run_install() {
  bash "$SCRIPT" --repo "$REPO" --codex \
    --codex-config "$CODEX/config.toml" --codex-agents "$CODEX/AGENTS.md" >/dev/null
}

run_install
run_install  # second run proves idempotency

BEGIN='<!-- BEGIN engineering:patina-mode'
END='<!-- END engineering:patina-mode -->'

# Subagents installed and matching the bundled assets.
diff -q "$SKILL/assets/agents/patina-agent.md" "$REPO/.claude/agents/patina-agent.md" >/dev/null \
  || fail "patina-agent.md not installed correctly"
diff -q "$SKILL/assets/agents/comment-sicko.md" "$REPO/.claude/agents/comment-sicko.md" >/dev/null \
  || fail "comment-sicko.md not installed correctly"

# Exactly one managed block per instructions file, unrelated content intact.
[ "$(count "$BEGIN" "$REPO/CLAUDE.md")" -eq 1 ] || fail "repo CLAUDE.md has $(count "$BEGIN" "$REPO/CLAUDE.md") mandate blocks, expected 1"
[ "$(count "$END" "$REPO/CLAUDE.md")" -eq 1 ] || fail "repo CLAUDE.md END marker count wrong"
grep -qF "Keep my house style." "$REPO/CLAUDE.md" || fail "repo CLAUDE.md lost unrelated content"
grep -qF "engineering:patina-mode" "$REPO/CLAUDE.md" || fail "repo CLAUDE.md missing mandate body"

[ "$(count "$BEGIN" "$CODEX/AGENTS.md")" -eq 1 ] || fail "Codex AGENTS.md has $(count "$BEGIN" "$CODEX/AGENTS.md") mandate blocks, expected 1"
grep -qF "Unrelated line." "$CODEX/AGENTS.md" || fail "Codex AGENTS.md lost unrelated content"

# multi_agent flipped to true exactly once, sibling keys and sections intact.
[ "$(grep -c '^multi_agent = true$' "$CODEX/config.toml")" -eq 1 ] || fail "config.toml multi_agent not set once to true"
[ "$(grep -c 'multi_agent' "$CODEX/config.toml")" -eq 1 ] || fail "config.toml has duplicate multi_agent keys"
grep -qF 'other = true' "$CODEX/config.toml" || fail "config.toml lost sibling [features] key"
grep -qF '[sandbox]' "$CODEX/config.toml" || fail "config.toml lost unrelated [sandbox] section"

# TOML edit covers the section-absent and file-absent branches too.
NOFEAT="$TMP/nofeat.toml"
printf 'model = "x"\n\n[sandbox]\nmode = "read"\n' > "$NOFEAT"
bash "$SCRIPT" --repo "$REPO" --codex --codex-config "$NOFEAT" --codex-agents "$TMP/nf-agents.md" >/dev/null
bash "$SCRIPT" --repo "$REPO" --codex --codex-config "$NOFEAT" --codex-agents "$TMP/nf-agents.md" >/dev/null
[ "$(grep -c '^multi_agent = true$' "$NOFEAT")" -eq 1 ] || fail "no-[features] config did not gain multi_agent once"
grep -qF 'model = "x"' "$NOFEAT" || fail "no-[features] config lost unrelated key"

ABSENT="$TMP/created.toml"
bash "$SCRIPT" --repo "$REPO" --codex --codex-config "$ABSENT" --codex-agents "$TMP/ab-agents.md" >/dev/null
[ "$(grep -c '^multi_agent = true$' "$ABSENT")" -eq 1 ] || fail "absent config not created with multi_agent"

# Appends a block when the instructions file does not exist yet.
FRESH="$TMP/fresh"
mkdir -p "$FRESH"
bash "$SCRIPT" --repo "$FRESH" >/dev/null
[ "$(count "$BEGIN" "$FRESH/CLAUDE.md")" -eq 1 ] || fail "fresh repo CLAUDE.md missing single mandate block"

# A hand-corrupted block (lone BEGIN, END deleted) must never swallow the content
# beneath it, on the first run or any run after. Exactly one closed block ends up
# installed; a harmless orphan BEGIN comment may remain.
CORRUPT="$TMP/corrupt"
mkdir -p "$CORRUPT"
FULL_BEGIN="$BEGIN (managed by setup-engineering; re-running overwrites this block) -->"
printf '%s\ndangling half-block\nSENTINEL trailing content\n' "$FULL_BEGIN" > "$CORRUPT/CLAUDE.md"
bash "$SCRIPT" --repo "$CORRUPT" >/dev/null
grep -qF "SENTINEL trailing content" "$CORRUPT/CLAUDE.md" || fail "corrupted block swallowed content on first run"
[ "$(count "$END" "$CORRUPT/CLAUDE.md")" -eq 1 ] || fail "corrupted repo did not gain exactly one closed block"
bash "$SCRIPT" --repo "$CORRUPT" >/dev/null
grep -qF "SENTINEL trailing content" "$CORRUPT/CLAUDE.md" || fail "corrupted block swallowed content on second run"
[ "$(count "$END" "$CORRUPT/CLAUDE.md")" -eq 1 ] || fail "second run did not converge on one closed block"

# --codex with no explicit paths writes repo-scoped targets, never a user global.
CODEXREPO="$TMP/codexrepo"
mkdir -p "$CODEXREPO"
bash "$SCRIPT" --repo "$CODEXREPO" --codex >/dev/null
bash "$SCRIPT" --repo "$CODEXREPO" --codex >/dev/null
[ "$(grep -c '^multi_agent = true$' "$CODEXREPO/.codex/config.toml" 2>/dev/null || echo 0)" -eq 1 ] \
  || fail "--codex did not write repo-scoped .codex/config.toml with multi_agent"
[ "$(count "$BEGIN" "$CODEXREPO/AGENTS.md")" -eq 1 ] \
  || fail "--codex did not upsert a single mandate block into repo AGENTS.md"

if [ "$FAIL" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL assertion(s) failed" >&2
  exit 1
fi
echo "OK: setup-engineering machinery installer idempotent and non-clobbering"
exit 0
