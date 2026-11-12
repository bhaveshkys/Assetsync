#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
"$DIR/uninstall.sh"
echo "Press any key to exit..."
read -n 1 -s -r

