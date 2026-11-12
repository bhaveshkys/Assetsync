#!/bin/bash
# AssetSync Installer for macOS
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
CEP_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
DEST="$CEP_DIR/com.assetsync"

echo "========================================================"
echo "              AssetSync Installation"
echo "   Premiere Pro & After Effects Auto-Import Extension"
echo "========================================================"
echo ""

echo "[1/3] Enabling unsigned extensions in Adobe CEP (PlayerDebugMode)..."
for v in 9 10 11 12 13 14 15 16 17 18; do
  defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1 2>/dev/null || true
done
echo "      PlayerDebugMode enabled for CSXS 9 through 18."

echo ""
echo "[2/3] Preparing extension destination..."
mkdir -p "$CEP_DIR"

if [ "$1" = "--dev" ] || [ "$1" = "-d" ] || [ "$1" = "--symlink" ]; then
  echo "      Mode: Developer (Symlink)"
  rm -rf "$DEST"
  ln -sfn "$DIR" "$DEST"
  echo "      Symlinked: $DEST -> $DIR"
else
  echo "      Mode: Standard copy install"
  rm -rf "$DEST"
  mkdir -p "$DEST"
  echo "[3/3] Copying extension files..."
  cp -R "$DIR/CSXS" "$DEST/"
  cp -R "$DIR/css" "$DEST/"
  cp -R "$DIR/js" "$DEST/"
  cp -R "$DIR/jsx" "$DEST/"
  [ -f "$DIR/index.html" ] && cp "$DIR/index.html" "$DEST/"
  [ -f "$DIR/.debug" ] && cp "$DIR/.debug" "$DEST/"
fi

echo ""
echo "========================================================"
echo "  AssetSync installed successfully!"
echo ""
echo "  Installed to:"
echo "  $DEST"
echo ""
echo "  Next steps:"
echo "  1. If Premiere Pro or After Effects is open, restart it."
echo "  2. In Premiere or After Effects, go to:"
echo "     Window -> Extensions -> AssetSync"
echo "  3. Click '+ Watch folder' and pick your download directory!"
echo "========================================================"
echo ""
