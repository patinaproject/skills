#!/usr/bin/env bash
# install-machinery.sh — install Engineering's repo-level machinery for
# skills-only consumers, idempotently. Re-running converges on the same state:
# one managed mandate block per instructions file, the two subagent files in
# place, and multi_agent enabled once. Content outside the managed markers is
# never touched.
#
# Repo side (always): copies the patina-agent and comment-sicko subagents into
# <repo>/.claude/agents/ and upserts the patina-mode mandate block into
# <repo>/CLAUDE.md. Codex side (--codex): upserts the mandate block into
# <repo>/AGENTS.md and enables multi_agent in <repo>/.codex/config.toml, so the
# machinery is committed and shared across contributors rather than written into
# any one user's global Codex config. Codex loads a repo-scoped .codex/config.toml
# only for trusted projects.
#
# Usage:
#   install-machinery.sh [--repo <dir>] [--instructions <file>]
#                        [--codex] [--codex-config <file>] [--codex-agents <file>]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS_DIR="${SCRIPT_DIR}/../assets"

BEGIN_MARKER='<!-- BEGIN engineering:patina-mode (managed by setup-engineering; re-running overwrites this block) -->'
END_MARKER='<!-- END engineering:patina-mode -->'

repo=""
instructions=""
do_codex=0
codex_config=""
codex_agents=""

while [ $# -gt 0 ]; do
  case "$1" in
    --repo) repo="$2"; shift 2 ;;
    --instructions) instructions="$2"; shift 2 ;;
    --codex) do_codex=1; shift ;;
    --codex-config) codex_config="$2"; shift 2 ;;
    --codex-agents) codex_agents="$2"; shift 2 ;;
    *) echo "install-machinery.sh: unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$repo" ]; then
  repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi
[ -n "$instructions" ] || instructions="${repo}/CLAUDE.md"
[ -n "$codex_config" ] || codex_config="${repo}/.codex/config.toml"
[ -n "$codex_agents" ] || codex_agents="${repo}/AGENTS.md"

# Rewrite a file through its own path so a symlinked instructions file (for
# example a CLAUDE.md pointing at AGENTS.md) keeps pointing where it did.
write_in_place() {
  local dest="$1" src="$2"
  cat "$src" > "$dest"
  rm -f "$src"
}

# Upsert the managed block carrying PAYLOAD into FILE. Collapses any prior
# managed blocks into a single fresh one; appends when none exists.
upsert_block() {
  local file="$1" payload="$2"
  mkdir -p "$(dirname "$file")"
  local blockfile tmp
  blockfile="$(mktemp)"
  { printf '%s\n' "$BEGIN_MARKER"; cat "$payload"; printf '%s\n' "$END_MARKER"; } > "$blockfile"

  # Replace only when a well-formed BEGIN..END pair exists; otherwise append.
  # The awk buffers each candidate region and only substitutes the fresh block
  # for a region that actually closes with END, flushing an unclosed BEGIN
  # verbatim. A hand-corrupted block (a BEGIN whose END was deleted) therefore
  # never swallows the content beneath it; the mandate body itself carries no
  # markers, so a real managed block is always well-formed.
  if [ -f "$file" ] && grep -qF "$BEGIN_MARKER" "$file" && grep -qF "$END_MARKER" "$file"; then
    tmp="$(mktemp)"
    awk -v b="$BEGIN_MARKER" -v e="$END_MARKER" -v bf="$blockfile" '
      function flush(   i) { for (i = 1; i <= nbuf; i++) print buf[i]; nbuf = 0 }
      $0 == b { flush(); inblock = 1; buf[++nbuf] = $0; next }
      inblock && $0 == e {
        inblock = 0; nbuf = 0
        if (!emitted) { while ((getline l < bf) > 0) print l; emitted = 1 }
        next
      }
      inblock { buf[++nbuf] = $0; next }
      { print }
      END { flush() }
    ' "$file" > "$tmp"
    write_in_place "$file" "$tmp"
  else
    if [ -f "$file" ] && [ -s "$file" ]; then printf '\n' >> "$file"; fi
    cat "$blockfile" >> "$file"
  fi
  rm -f "$blockfile"
}

# Ensure [features] multi_agent = true exactly once, leaving other sections and
# any multi_agent key outside [features] untouched.
enable_multi_agent() {
  local config="$1" tmp
  mkdir -p "$(dirname "$config")"
  if [ ! -f "$config" ]; then
    printf '[features]\nmulti_agent = true\n' > "$config"
    return
  fi
  tmp="$(mktemp)"
  awk '
    /^\[features\][ \t]*$/ {
      have_features = 1; in_features = 1; print; next
    }
    /^\[/ {
      if (in_features && !set) { print "multi_agent = true"; set = 1 }
      in_features = 0; print; next
    }
    {
      if (in_features && $0 ~ /^[ \t]*multi_agent[ \t]*=/) {
        if (!set) { print "multi_agent = true"; set = 1 }
        next
      }
      print
    }
    END {
      if (in_features && !set) { print "multi_agent = true"; set = 1 }
      if (!have_features) { print ""; print "[features]"; print "multi_agent = true" }
    }
  ' "$config" > "$tmp"
  write_in_place "$config" "$tmp"
}

agents_dir="${repo}/.claude/agents"
mkdir -p "$agents_dir"
cp "${ASSETS_DIR}/agents/patina-agent.md" "${agents_dir}/patina-agent.md"
cp "${ASSETS_DIR}/agents/comment-sicko.md" "${agents_dir}/comment-sicko.md"
upsert_block "$instructions" "${ASSETS_DIR}/mandate.md"
echo "installed: ${agents_dir}/patina-agent.md"
echo "installed: ${agents_dir}/comment-sicko.md"
echo "mandate block upserted: ${instructions}"

if [ "$do_codex" -eq 1 ]; then
  upsert_block "$codex_agents" "${ASSETS_DIR}/mandate.md"
  enable_multi_agent "$codex_config"
  echo "mandate block upserted: ${codex_agents}"
  echo "multi_agent enabled: ${codex_config}"
fi
