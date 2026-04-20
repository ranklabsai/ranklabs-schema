#!/usr/bin/env bash
# Bump the version across all three packages in lockstep.
#
#   scripts/bump.sh patch            1.1.0 -> 1.1.1
#   scripts/bump.sh minor            1.1.0 -> 1.2.0
#   scripts/bump.sh major            1.1.0 -> 2.0.0
#   scripts/bump.sh 1.2.3-beta.1     set explicit version
#
# Updates packages/{core,hydrogen,next}/package.json and rewrites the
# workspace:^X.Y.Z pins. Does not commit, tag, or publish.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BUMP="${1:-}"
if [[ -z "$BUMP" ]]; then
  sed -n '2,10p' "$0" | sed 's/^# //;s/^#//'
  exit 2
fi

CURRENT=$(node -p "require('./packages/core/package.json').version")

compute_next() {
  local cur="$1" kind="$2"
  node -e "
    const [M, m, p] = process.argv[1].split('.').map(s => parseInt(s.split('-')[0], 10));
    const kind = process.argv[2];
    let next;
    if (kind === 'major') next = [M + 1, 0, 0];
    else if (kind === 'minor') next = [M, m + 1, 0];
    else if (kind === 'patch') next = [M, m, p + 1];
    else throw new Error('bad bump kind: ' + kind);
    process.stdout.write(next.join('.'));
  " "$cur" "$kind"
}

case "$BUMP" in
  major|minor|patch)
    NEXT=$(compute_next "$CURRENT" "$BUMP")
    ;;
  *)
    NEXT="$BUMP"
    ;;
esac

if [[ "$NEXT" == "$CURRENT" ]]; then
  echo "Version unchanged ($CURRENT). Nothing to do." >&2
  exit 0
fi

printf "\033[1;34m→\033[0m Bumping %s -> %s\n" "$CURRENT" "$NEXT"

# Rewrite the three package.json files plus the workspace pins in
# hydrogen/next (which depend on core via workspace:^...). Done via node
# so we preserve formatting.
node -e '
  const fs = require("fs");
  const path = require("path");
  const [next] = process.argv.slice(1);

  const pkgs = [
    "packages/core/package.json",
    "packages/hydrogen/package.json",
    "packages/next/package.json",
  ];

  for (const p of pkgs) {
    const json = JSON.parse(fs.readFileSync(p, "utf8"));
    json.version = next;
    if (json.dependencies && json.dependencies["@ranklabs/schema"]) {
      const dep = json.dependencies["@ranklabs/schema"];
      if (dep.startsWith("workspace:")) {
        json.dependencies["@ranklabs/schema"] = "workspace:^" + next;
      } else {
        json.dependencies["@ranklabs/schema"] = "^" + next;
      }
    }
    fs.writeFileSync(p, JSON.stringify(json, null, 2) + "\n");
  }
' "$NEXT"

printf "\033[1;32m✓\033[0m Version bumped to %s in all three packages\n" "$NEXT"
printf "  next steps: review the diff, update CHANGELOG.md, then run scripts/release.sh\n"
