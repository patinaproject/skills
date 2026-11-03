#!/usr/bin/env bash
set -euo pipefail

FAIL_COUNT=0
fail() {
  echo "FAIL: $*" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

frontmatter() {
  awk 'NR == 1 && $0 == "---" { in_fm = 1; next } in_fm && $0 == "---" { exit } in_fm { print }' "$1"
}

body() {
  awk 'NR == 1 && $0 == "---" { in_fm = 1; next } in_fm && $0 == "---" { in_fm = 0; next } !in_fm { print }' "$1"
}

field() {
  frontmatter "$1" | awk -v key="$2" 'index($0, key ":") == 1 { sub(/^[^:]*: */, ""); print; exit }'
}

comparable_frontmatter() {
  frontmatter "$1" | grep -v -e '^name:' -e '^description:' -e '^effort:'
}

reader_dirs=(
  plugins/code
  plugins/code/skills/setup-code-skills/assets
  .claude
)
levels=(low medium high xhigh max)

for dir in "${reader_dirs[@]}"; do
  base="$dir/agents/patina-reader.md"
  variant_dir="$dir/agents"
  if [ "$dir" = "plugins/code" ]; then
    variant_dir="$dir/effort-agents"
  fi
  [ -f "$base" ] || { fail "$base missing"; continue; }

  files=("$base")
  for level in "${levels[@]}"; do
    variant="$variant_dir/patina-reader-$level.md"
    [ -f "$variant" ] || { fail "$variant missing"; continue; }
    files+=("$variant")
    [ "$(field "$variant" name)" = "patina-reader-$level" ] || fail "$variant name is not patina-reader-$level"
    [ "$(field "$variant" effort)" = "$level" ] || fail "$variant effort is not $level"
    [ "$(comparable_frontmatter "$variant")" = "$(comparable_frontmatter "$base")" ] \
      || fail "$variant frontmatter differs from $base beyond name, description, and effort"
    [ "$(body "$variant")" = "$(body "$base")" ] || fail "$variant body differs from $base"
  done

  [ "$(field "$base" name)" = "patina-reader" ] || fail "$base name is not patina-reader"
  [ -z "$(field "$base" effort)" ] || fail "$base must not set effort"

  for file in "${files[@]}"; do
    [ "$(field "$file" omitClaudeMd)" = "true" ] || fail "$file must set omitClaudeMd: true"
    denied=",$(field "$file" disallowedTools | tr -d ' '),"
    for tool in Edit Write NotebookEdit; do
      case "$denied" in
        *",$tool,"*) ;;
        *) fail "$file disallowedTools must list $tool" ;;
      esac
    done
    if frontmatter "$file" | grep -q '^tools:'; then
      fail "$file must not set a tools allowlist"
    fi
  done
done

for sicko in \
  plugins/code/agents/comment-sicko.md \
  plugins/code/skills/setup-code-skills/assets/agents/comment-sicko.md \
  plugins/code/skills/patina-mode/references/agents/comment-sicko.md \
  .claude/agents/comment-sicko.md; do
  [ -f "$sicko" ] || { fail "$sicko missing"; continue; }
  [ "$(field "$sicko" omitClaudeMd)" = "true" ] || fail "$sicko must set omitClaudeMd: true"
  case ",$(field "$sicko" disallowedTools | tr -d ' ')," in
    *,Edit,*) fail "$sicko must keep the Edit tool" ;;
  esac
done

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "FAIL: $FAIL_COUNT assertion(s) failed" >&2
  exit 1
fi

echo "OK: agent frontmatter contracts hold"
