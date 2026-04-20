#!/usr/bin/env bash
# End-to-end release orchestrator.
#
#   scripts/release.sh                     release current version (already bumped)
#   scripts/release.sh patch               bump patch, then release
#   scripts/release.sh minor               bump minor, then release
#   scripts/release.sh major               bump major, then release
#   scripts/release.sh 1.2.3-beta.1        bump to explicit version, then release
#
# Flags:
#   --dry-run           run the flow but do not push or publish
#   --skip-tests        skip the test suite during preflight
#   --skip-publish      commit + tag + push, but do not publish to npm
#   --allow-dirty       allow uncommitted changes before starting
#   --otp <code>        npm 2FA one-time code (passed to pnpm publish)
#   --tag <dist-tag>    publish under a dist-tag other than latest (e.g. beta)
#   --remote <name>     git remote to push to (default: origin)
#   --branch <name>     git branch to push (default: current)
#   --yes               skip all confirmation prompts
#
# Flow:
#   1. Verify clean working tree (unless --allow-dirty)
#   2. Optionally bump version
#   3. Preflight: lint, build, tests
#   4. Commit the version bump (or detect no-op)
#   5. Tag v<version>
#   6. Push commits + tags
#   7. Publish to npm in dep order

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BUMP_ARG=""
DRY_RUN=false
SKIP_TESTS=false
SKIP_PUBLISH=false
ALLOW_DIRTY=false
OTP=""
DIST_TAG="latest"
GIT_REMOTE="origin"
GIT_BRANCH=""
ASSUME_YES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --skip-tests) SKIP_TESTS=true; shift ;;
    --skip-publish) SKIP_PUBLISH=true; shift ;;
    --allow-dirty) ALLOW_DIRTY=true; shift ;;
    --otp) OTP="$2"; shift 2 ;;
    --tag) DIST_TAG="$2"; shift 2 ;;
    --remote) GIT_REMOTE="$2"; shift 2 ;;
    --branch) GIT_BRANCH="$2"; shift 2 ;;
    --yes|-y) ASSUME_YES=true; shift ;;
    -h|--help)
      sed -n '2,29p' "$0" | sed 's/^# //;s/^#//'
      exit 0
      ;;
    patch|minor|major) BUMP_ARG="$1"; shift ;;
    [0-9]*) BUMP_ARG="$1"; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

say() { printf "\033[1;34m→\033[0m %s\n" "$*"; }
ok()  { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
warn(){ printf "\033[1;33m!\033[0m %s\n" "$*"; }

# 1. Clean tree check
if [[ "$ALLOW_DIRTY" != "true" && -n "$(git status --porcelain)" ]]; then
  echo "✗ Working tree has uncommitted changes. Commit or pass --allow-dirty." >&2
  git status --short >&2
  exit 1
fi

# 2. Optional bump
if [[ -n "$BUMP_ARG" ]]; then
  say "Bumping version ($BUMP_ARG)"
  "$ROOT_DIR/scripts/bump.sh" "$BUMP_ARG"
fi

VERSION=$(node -p "require('./packages/core/package.json').version")
TAG="v$VERSION"

# 3. Preflight
say "Running preflight checks"
if [[ "$SKIP_TESTS" == "true" ]]; then
  "$ROOT_DIR/scripts/verify.sh" --fast
else
  "$ROOT_DIR/scripts/verify.sh"
fi

# 4. Commit (only if dirty from the bump)
if [[ -n "$(git status --porcelain)" ]]; then
  say "Staging version bump and CHANGELOG if present"
  git add packages/core/package.json packages/hydrogen/package.json packages/next/package.json
  if [[ -f CHANGELOG.md ]]; then git add CHANGELOG.md; fi
  if [[ -f pnpm-lock.yaml ]]; then git add pnpm-lock.yaml; fi

  if [[ -n "$(git diff --cached --name-only)" ]]; then
    if [[ "$DRY_RUN" == "true" ]]; then
      say "[dry-run] git commit -m 'chore(release): $TAG'"
    else
      git commit -m "chore(release): $TAG"
      ok "Committed chore(release): $TAG"
    fi
  else
    warn "No staged changes to commit"
  fi
fi

# 5. Tag
if git rev-parse "$TAG" >/dev/null 2>&1; then
  warn "Tag $TAG already exists locally, skipping tag creation"
else
  if [[ "$DRY_RUN" == "true" ]]; then
    say "[dry-run] git tag -a $TAG -m 'Release $TAG'"
  else
    git tag -a "$TAG" -m "Release $TAG"
    ok "Tagged $TAG"
  fi
fi

# 6. Push
if [[ -z "$GIT_BRANCH" ]]; then
  GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

if [[ "$DRY_RUN" == "true" ]]; then
  say "[dry-run] git push $GIT_REMOTE $GIT_BRANCH"
  say "[dry-run] git push $GIT_REMOTE $TAG"
else
  say "Pushing branch $GIT_BRANCH and tag $TAG to $GIT_REMOTE"
  git push "$GIT_REMOTE" "$GIT_BRANCH"
  git push "$GIT_REMOTE" "$TAG"
  ok "Pushed"
fi

# 7. Publish
if [[ "$SKIP_PUBLISH" == "true" ]]; then
  warn "Skipping npm publish (--skip-publish). Run scripts/publish.sh when ready."
  exit 0
fi

PUBLISH_FLAGS=(--tag "$DIST_TAG")
if [[ -n "$OTP" ]]; then PUBLISH_FLAGS+=(--otp "$OTP"); fi
if [[ "$DRY_RUN" == "true" ]]; then PUBLISH_FLAGS+=(--dry-run); fi
if [[ "$ASSUME_YES" == "true" ]]; then PUBLISH_FLAGS+=(--yes); fi

"$ROOT_DIR/scripts/publish.sh" "${PUBLISH_FLAGS[@]}"

ok "Release $TAG complete"
