#!/bin/bash
# Builds a clean release zip ready for GitHub Releases
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION=$(grep -o 'ExtensionBundleVersion="[^"]*"' "$DIR/CSXS/manifest.xml" | cut -d'"' -f2)
VERSION=${VERSION:-"1.0.0"}

DIST_DIR="$DIR/dist"
STAGE_DIR="$DIST_DIR/AssetSync-v$VERSION"
ZIP_NAME="AssetSync-v$VERSION.zip"

echo "Building release package for AssetSync v$VERSION..."

rm -rf "$STAGE_DIR" "$DIST_DIR/$ZIP_NAME"
mkdir -p "$STAGE_DIR"

# Copy extension files
cp -R "$DIR/CSXS" "$STAGE_DIR/"
cp -R "$DIR/css" "$STAGE_DIR/"
cp -R "$DIR/js" "$STAGE_DIR/"
cp -R "$DIR/jsx" "$STAGE_DIR/"
cp "$DIR/index.html" "$STAGE_DIR/"
cp "$DIR/.debug" "$STAGE_DIR/"
cp "$DIR/install.bat" "$STAGE_DIR/"
cp "$DIR/install.ps1" "$STAGE_DIR/"
cp "$DIR/install.sh" "$STAGE_DIR/"
cp "$DIR/install.command" "$STAGE_DIR/"
cp "$DIR/uninstall.bat" "$STAGE_DIR/"
cp "$DIR/uninstall.sh" "$STAGE_DIR/"
cp "$DIR/uninstall.command" "$STAGE_DIR/"
cp "$DIR/README.md" "$STAGE_DIR/"
cp "$DIR/LICENSE" "$STAGE_DIR/"

# Ensure scripts are executable
chmod +x "$STAGE_DIR"/*.sh "$STAGE_DIR"/*.command 2>/dev/null || true

# Remove any accidental .DS_Store
find "$STAGE_DIR" -name ".DS_Store" -delete

# Create ZIP
cd "$DIST_DIR"
zip -r -q "$ZIP_NAME" "AssetSync-v$VERSION"
rm -rf "$STAGE_DIR"

echo "Done! Release zip created at: $DIST_DIR/$ZIP_NAME"

