#!/usr/bin/env bash
# Deterministically rebrand an open-pstack plugin tree into the Patina
# Engineering layout.
#
# Usage: pstack-transform.sh <src-dir> <dest-dir>
#
#   <src-dir>   A directory holding the contents of open-pstack's
#               plugins/pstack/** (i.e. the plugin root, so <src-dir>/agents,
#               <src-dir>/skills, ... exist).
#   <dest-dir>  Where the transformed plugins/engineering/** contents are
#               written. Created if missing; must be empty or absent so a run
#               never mixes with stale output.
#
# The transform is exactly two renames applied to BOTH path segments and file
# contents:
#
#     poteto-mode  -> patina-mode
#     poteto-agent -> patina-agent
#
# Everything else stays upstream-named on purpose: the fewer things the fork
# rebrands, the less surface there is for a resync to conflict on. Applying the
# renames to content as well as paths keeps each renamed thing consistent with
# how the rest of the tree refers to it (a skill folder and its SKILL.md
# `name:`, an agent file and its references). No replacement contains a source
# token, and the two source tokens are distinct, so a single pass cannot
# double-apply and rule order is irrelevant. The run is byte-stable: LC_ALL=C
# fixes collation, the rules are literal, and binary files are copied verbatim
# (never fed through sed). Given identical input bytes it produces identical
# output bytes on every machine, which is what lets a later `git merge` isolate
# Patina's real divergence instead of manufacturing phantom conflicts.
set -euo pipefail

if [ "$#" -ne 2 ]; then
  printf 'usage: %s <src-dir> <dest-dir>\n' "${0##*/}" >&2
  exit 2
fi

src="$1"
dest="$2"

if [ ! -d "$src" ]; then
  printf 'error: src-dir does not exist: %s\n' "$src" >&2
  exit 2
fi

if [ -e "$dest" ] && [ -n "$(ls -A "$dest" 2>/dev/null)" ]; then
  printf 'error: dest-dir must be empty or absent: %s\n' "$dest" >&2
  exit 2
fi

# Two renames, applied identically to paths and content.
rules='s/poteto-mode/patina-mode/g; s/poteto-agent/patina-agent/g'

rename_path() {
  # Rebrand each path segment. LC_ALL=C keeps byte semantics stable.
  printf '%s' "$1" | LC_ALL=C sed -E "$rules"
}

# Walk files in a stable, locale-independent order for reproducibility.
while IFS= read -r rel; do
  out_rel="$(rename_path "$rel")"
  out_path="$dest/$out_rel"
  mkdir -p "$(dirname "$out_path")"

  if LC_ALL=C grep -Iq . "$src/$rel"; then
    # Text file: rebrand contents. cp -p first carries the mode/executable
    # bit; the redirect truncates and rewrites content while preserving that
    # mode, so no non-portable stat/chmod dance is needed.
    cp -p "$src/$rel" "$out_path"
    LC_ALL=C sed -E "$rules" "$src/$rel" > "$out_path"
  else
    # Binary (or empty) file: copy verbatim, preserving mode.
    cp -p "$src/$rel" "$out_path"
  fi
done < <(cd "$src" && LC_ALL=C find . -type f | LC_ALL=C sort | sed 's|^\./||')
