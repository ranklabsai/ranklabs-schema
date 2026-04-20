#!/usr/bin/env bash
# Publish the three packages to npm in dependency order.
#
#   scripts/publish.sh                   prompts for confirmation
#   scripts/publish.sh --otp 123456      pass npm 2FA one-time code
#   scripts/publish.sh --dry-run         pnpm publish --dry-run on all three
#   scripts/publish.sh --tag beta        publish under a dist-tag other than latest
#   scripts/publish.sh --yes             skip the confirmation prompt
#
# pnpm rewrites `workspace:^X.Y.Z` deps to `^X.Y.Z` at publish time, so
# the tarballs installed by consumers get the registry version.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OTP=""
DRY_RUN=false
DIST_TAG="latest"
ASSUME_YES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --otp) OTP="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --tag) DIST_TAG="$2"; shift 2 ;;
    --yes|-y) ASSUME_YES=true; shift ;;
    -h|--help)
      sed -n '2,10p' "$0" | sed 's/^# //;s/^#//'
      exit 0
      ;;
    *) echo "Unknown flag: $1" >&2; exit 2 ;;
  esac
done

VERSION=$(node -p "require('./packages/core/package.json').version")

say() { printf "\033[1;34m→\033[0m %s\n" "$*"; }
ok()  { printf "\033[1;32m✓\033[0m %s\n" "$*"; }

publish_one() {
  local pkg="$1"
  local args=(publish --no-git-checks --access public --tag "$DIST_TAG")
  if [[ -n "$OTP" ]]; then args+=(--otp "$OTP"); fi
  if [[ "$DRY_RUN" == "true" ]]; then args+=(--dry-run); fi
  say "Publishing $pkg@$VERSION (tag=$DIST_TAG${DRY_RUN:+, dry-run})"
  pnpm -F "$pkg" "${args[@]}"
}

if [[ "$DRY_RUN" != "true" && "$ASSUME_YES" != "true" ]]; then
  echo
  echo "About to publish to npm:"
  echo "    @ranklabs/schema@$VERSION          (tag=$DIST_TAG)"
  echo "    @ranklabs/schema-hydrogen@$VERSION (tag=$DIST_TAG)"
  echo "    @ranklabs/schema-next@$VERSION     (tag=$DIST_TAG)"
  echo
  read -r -p "Proceed? (y/N) " confirm
  case "$confirm" in
    y|Y|yes|YES) ;;
    *) echo "Aborted." >&2; exit 1 ;;
  esac
fi

# Publish core first; hydrogen and next depend on it.
publish_one "@ranklabs/schema"
publish_one "@ranklabs/schema-hydrogen"
publish_one "@ranklabs/schema-next"

if [[ "$DRY_RUN" == "true" ]]; then
  ok "Dry run complete. Nothing was pushed to the registry."
else
  ok "All three packages published at $VERSION (tag=$DIST_TAG)"
fi
