#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
"$DIR/install.sh"
echo "Press any key to exit..."
read -n 1 -s -r

