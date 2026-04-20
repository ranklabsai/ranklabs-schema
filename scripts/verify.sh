#!/usr/bin/env bash
# Preflight verification: build, lint, test, version-consistency check.
# Safe to run any time. Exits non-zero on any failure.
#
#   scripts/verify.sh            full checks
#   scripts/verify.sh --fast     skip tests (emergency only)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SKIP_TESTS=false
for arg in "$@"; do
  case "$arg" in
    --fast|--skip-tests) SKIP_TESTS=true ;;
    -h|--help)
      sed -n '2,7p' "$0" | sed 's/^# //;s/^#//'
      exit 0
      ;;
    *) echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done

say() { printf "\033[1;34m→\033[0m %s\n" "$*"; }
ok()  { printf "\033[1;32m✓\033[0m %s\n" "$*"; }

say "Checking package version consistency"
CORE_VER=$(node -p "require('./packages/core/package.json').version")
HYDROGEN_VER=$(node -p "require('./packages/hydrogen/package.json').version")
NEXT_VER=$(node -p "require('./packages/next/package.json').version")

if [[ "$CORE_VER" != "$HYDROGEN_VER" || "$CORE_VER" != "$NEXT_VER" ]]; then
  echo "✗ Version mismatch across packages:" >&2
  echo "    @ranklabs/schema           $CORE_VER" >&2
  echo "    @ranklabs/schema-hydrogen  $HYDROGEN_VER" >&2
  echo "    @ranklabs/schema-next      $NEXT_VER" >&2
  echo "  The three packages ship in lockstep. Run scripts/bump.sh to sync them." >&2
  exit 1
fi
ok "All three packages pinned at $CORE_VER"

say "Running type-check across workspace"
pnpm -r lint
ok "Lint clean"

say "Building all packages"
pnpm -r build
ok "Build success"

if [[ "$SKIP_TESTS" == "true" ]]; then
  say "Skipping tests (--fast)"
else
  say "Running test suite"
  pnpm -F @ranklabs/schema test
  ok "Tests pass"
fi

ok "Preflight complete at v$CORE_VER"
