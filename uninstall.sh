#!/bin/bash
set -e

DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.assetsync"

echo "========================================================"
echo "              AssetSync Uninstaller"
echo "========================================================"
echo ""

if [ -e "$DEST" ]; then
  echo "Removing AssetSync from:"
  echo "$DEST"
  rm -rf "$DEST"
  echo ""
  echo "AssetSync has been removed."
else
  echo "AssetSync was not found in:"
  echo "$DEST"
fi

echo ""
echo "Restart Premiere Pro or After Effects to apply changes."
echo "========================================================"
echo ""

