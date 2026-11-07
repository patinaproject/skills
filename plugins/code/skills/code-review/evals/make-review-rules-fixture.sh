#!/usr/bin/env bash
set -euo pipefail

usage="usage: make-review-rules-fixture.sh <new-dir> <nit-control|nit|skip|severity|head-only|none>"
dir=${1:?$usage}
scenario=${2:?$usage}
case $scenario in
  nit-control | nit | skip | severity | head-only | none) ;;
  *) echo "$usage" >&2; exit 2 ;;
esac

mkdir "$dir"
cd "$dir"
git init -q -b main
git config user.name fixture
git config user.email fixture@example.com

mkdir src
echo "export const VERSION = 1;" > src/version.js

write_sum() {
  mkdir -p "$(dirname "$1")"
  cat > "$1" <<'JS'
export function sumAmounts(rows) {
  let total = 0;
  for (let i = 0; i <= rows.length; i++) total += rows[i].amount;
  return total;
}
JS
}

case $scenario in
  nit-control | nit)
    cat > CONTRIBUTING.md <<'MD'
# Style

These rules are minor. Tag a breach `Nit`.

- Use `const` or `let`, never `var`.
- Do not write `else` after a branch that returns.
- Do not leave unused variables.
- Name a function for what it does.
MD
    if [ "$scenario" = nit ]; then
      echo "Report at most 2 nits per review." > REVIEW.md
    fi
    cat > spec.md <<'MD'
# Padding

- Add a helper in `src/pad.js` that left-pads an integer from 0 to 99 to two digits.
MD
    ;;
  skip)
    printf 'Skip `generated/**`.\n' > REVIEW.md
    cat > spec.md <<'MD'
# Sums and export

- Add `sumAmounts(rows)` to `src/x.js` and to the generated client in `generated/x.js`.
- Add a generated API client in `generated/y.js`.
- Add `exportCsv(rows)` to `src/csv.js`, returning one CSV line per row.
MD
    ;;
  severity)
    printf 'Missing JSDoc on an exported function is `Important`.\n' > REVIEW.md
    cat > spec.md <<'MD'
# Geometry

- Add `area(width, height)` to `src/area.js`.
MD
    ;;
  head-only | none)
    if [ "$scenario" = none ]; then
      mkdir docs
      printf 'ZQX-REVIEW-MARKER\n\nSkip `src/**`.\n' > docs/REVIEW.md
    fi
    cat > spec.md <<'MD'
# Sums

- Add `sumAmounts(rows)` to `src/x.js`.
MD
    ;;
esac

git add . && git commit -qm "chore: base"
git tag base
git switch -qc feature

case $scenario in
  nit-control | nit)
    cat > src/pad.js <<'JS'
export function fmt(n) {
  var s = String(n);
  const unused = s.length;
  if (s.length < 2) {
    return "0" + s;
  } else {
    return s;
  }
}
JS
    ;;
  skip)
    write_sum src/x.js
    write_sum generated/x.js
    cat > generated/y.js <<'JS'
const API_KEY = "ak_fixture_7f3a9c2e41d84b6aa0e5";

export function fetchOrders() {
  return fetch("https://api.example.com/orders", {
    headers: { Authorization: "Bearer " + API_KEY },
  });
}
JS
    ;;
  severity)
    cat > src/area.js <<'JS'
export function area(width, height) {
  return width * height;
}
JS
    ;;
  head-only)
    printf 'Skip `src/**`.\n' > REVIEW.md
    write_sum src/x.js
    ;;
  none)
    write_sum src/x.js
    ;;
esac

git add . && git commit -qm "feat: $scenario changes"
