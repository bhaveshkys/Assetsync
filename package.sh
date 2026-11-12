#!/bin/bash
# Builds both a signed .zxp and a 1-click installer .zip ready for GitHub Releases
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION=$(grep -o 'ExtensionBundleVersion="[^"]*"' "$DIR/CSXS/manifest.xml" | cut -d'"' -f2)
VERSION=${VERSION:-"1.0.0"}

DIST_DIR="$DIR/dist"
STAGE_DIR="$DIST_DIR/AssetSync-v$VERSION"
ZIP_NAME="AssetSync-v$VERSION.zip"
ZXP_NAME="AssetSync-v$VERSION.zxp"

echo "========================================================"
echo "          Building AssetSync Release v$VERSION"
echo "========================================================"
echo ""

# 1. Build .zxp
echo "[1/2] Building and signing $ZXP_NAME..."
node "$DIR/scripts/build-zxp.js"
echo ""

# 2. Build .zip with 1-click installers
echo "[2/2] Packaging $ZIP_NAME..."
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

chmod +x "$STAGE_DIR"/*.sh "$STAGE_DIR"/*.command 2>/dev/null || true
find "$STAGE_DIR" -name ".DS_Store" -delete

cd "$DIST_DIR"
zip -r -q "$ZIP_NAME" "AssetSync-v$VERSION"
rm -rf "$STAGE_DIR"

echo ""
echo "========================================================"
echo "  Build Complete! Artifacts ready in $DIST_DIR:"
echo "  1. $ZXP_NAME (for aescripts / Anastasiy / ZXP Installer)"
echo "  2. $ZIP_NAME (with 1-click install.bat & install.command)"
echo "========================================================"
