#!/usr/bin/env bash
set -euo pipefail

VERSION_FILE="$(dirname "$0")/../VERSION"
FRONTEND_PKG="$(dirname "$0")/../frontend/package.json"
BACKEND_PKG="$(dirname "$0")/../backend/package.json"

current=$(cat "$VERSION_FILE")
IFS='.' read -r major minor patch <<< "$current"

case "${1:-patch}" in
  major)
    major=$((major + 1))
    minor=0
    patch=0
    ;;
  minor)
    minor=$((minor + 1))
    patch=0
    ;;
  patch)
    patch=$((patch + 1))
    ;;
  *)
    echo "Usage: $0 [patch|minor|major]"
    exit 1
    ;;
esac

new="$major.$minor.$patch"
echo "$new" > "$VERSION_FILE"

# Update package.json files
for pkg in "$FRONTEND_PKG" "$BACKEND_PKG"; do
  if [ -f "$pkg" ]; then
    sed -i "s/\"version\": \".*\"/\"version\": \"$new\"/" "$pkg"
  fi
done

echo "$current → $new"
