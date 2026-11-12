# AssetSync

[![Adobe Premiere Pro](https://img.shields.io/badge/Premiere%20Pro-2020--2025%2B-purple.svg)](https://www.adobe.com/products/premiere.html)
[![Adobe After Effects](https://img.shields.io/badge/After%20Effects-2020--2025%2B-darkblue.svg)](https://www.adobe.com/products/aftereffects.html)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-blue.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**AssetSync** is an Adobe CEP extension for **Premiere Pro** and **After Effects** that watches your folders (like your `Downloads` or project asset directories) and **automatically imports newly saved files into your project**.

No more switching out of your editor to drag-and-drop or navigate file dialogs — download a sound effect, stock clip, music track, or graphic, and it instantly shows up in your project bins.

---

## Features

- ⚡ **Zero-Click Auto-Import**: Dropped or downloaded files are imported into the active project automatically.
- 🛡️ **Download-Safe Settling**: Waits for files to finish downloading (stabilizes size for ~1.2s) and automatically ignores incomplete browser temp files (`.crdownload`, `.part`, `.partial`, `.tmp`, `~`).
- 📂 **Mirror Subfolders as Bins**: Keeps your project organized by replicating folder hierarchies directly into matching Premiere/AE bins.
- 🔁 **Smart Deduplication**: Checks existing media paths in the project so files already imported are never duplicated.
- 💾 **Per-Project Memory**: Remembers watched folders per `.prproj` / `.aep` file. Switching projects automatically switches watched folders.
- 🪟 **Cross-Platform**: Fully compatible with both **Windows** (10 & 11) and **macOS** (Intel & Apple Silicon).
- 🪶 **Ultra Lightweight**: Self-contained with zero npm dependencies, consuming virtually no background CPU.

---

## Compatibility

| Host Application | Supported Versions |
| :--- | :--- |
| **Adobe Premiere Pro** | 2020 through 2025+ (v14.0 – v25.x+) |
| **Adobe After Effects** | 2020 through 2025+ (v17.0 – v25.x+) |
| **Operating Systems** | Windows 10 / 11 & macOS 10.15+ (Catalina through Sequoia) |

---

## Installation

You can download either the **`.zxp`** package or the **`.zip`** installer from the [**Releases**](../../releases) section.

### Option A: Install via ZXP (Recommended if you have a ZXP Installer)

1. Download **`AssetSync-v1.0.0.zxp`** from the [**Releases**](../../releases) section.
2. Drag and drop the `.zxp` file into any standard extension installer:
   - [aescripts + aeplugins ZXP Installer](https://aescripts.com/learn/zxp-installer/)
   - [Anastasiy's Extension Manager](https://install.anastasiy.com/)
   - [ZXP Installer](https://zxpinstaller.com/)
3. Restart Premiere Pro or After Effects.
4. Open **Window → Extensions → AssetSync**.

---

### Option B: 1-Click Native Installer (No extra software needed)

Download **`AssetSync-v1.0.0.zip`** from the [**Releases**](../../releases) section and unzip it.

#### 🪟 Windows:
1. Double-click **`install.bat`** (or right-click **`install.ps1`** → *Run with PowerShell*).
2. Restart Premiere Pro or After Effects.
3. Open **Window → Extensions → AssetSync**.

> [!NOTE]
> The script configures `PlayerDebugMode` in your user registry (`HKCU\Software\Adobe\CSXS`) and installs to `%APPDATA%\Adobe\CEP\extensions\com.assetsync`. No administrator privileges are required.

#### 🍎 macOS:
1. Double-click **`install.command`** (or run `./install.sh` in Terminal).
2. Restart Premiere Pro or After Effects.
3. Open **Window → Extensions → AssetSync**.

> [!NOTE]
> The script configures `PlayerDebugMode` via `defaults write` and installs to `~/Library/Application Support/Adobe/CEP/extensions/com.assetsync`.

---

### Developer Mode (Symlink Install)

If you clone the repo and want to develop or customize the extension:

- **Windows**: Run `install.bat /dev` (creates a directory junction)
- **macOS**: Run `./install.sh --dev` (creates a symlink)

Changes to HTML, CSS, or JS take effect upon reloading the panel; changes to `jsx/` take effect when closing and reopening the panel.

---

## How to Use

1. **Open the panel**: Go to **Window → Extensions → AssetSync**.
2. **Dock the panel**: Place the panel anywhere in your workspace (it can be minimized or kept tiny).
   > *Note: CEP panels only execute while open/docked in the workspace.*
3. **Add a folder to watch**: Click **`+ Watch folder`** and choose your target folder (e.g., your browser's `Downloads` folder or a project `Assets` folder).
4. **Download or drop assets**: Save or download any audio, video, or image file into the folder. Within ~1.5 seconds, AssetSync verifies the file is completely written and imports it into your project bin.
5. **Mirroring Subfolders**: Keep "Mirror subfolders as bins" checked if you want nested folders (e.g. `Downloads/SFX/Whooshes`) to automatically create nested bins (`SFX > Whooshes`) in your project.
6. **Sync Now**: Click **`Sync now`** at any time to trigger a full rescan of all watched folders.

---

## Supported File Types

AssetSync supports all common media formats out of the box:

- **Video**: `.mp4`, `.mov`, `.m4v`, `.avi`, `.mxf`, `.mts`, `.m2ts`, `.webm`, `.r3d`, `.braw`
- **Audio**: `.wav`, `.mp3`, `.aif`, `.aiff`, `.m4a`, `.aac`, `.flac`, `.ogg`
- **Images & Graphics**: `.png`, `.jpg`, `.jpeg`, `.psd`, `.ai`, `.eps`, `.gif`, `.tif`, `.tiff`, `.bmp`, `.webp`, `.heic`, `.exr`, `.tga`, `.dpx`

### Customizing File Types
Click the **⚙ (Settings)** button in the panel header to add or remove extensions or adjust the periodic safety rescan interval (default: 60s).

---

## Debugging

To inspect the panel DOM or debug scripts via Chrome DevTools:
1. Open Google Chrome.
2. Navigate to:
   - Premiere Pro: `http://localhost:8098`
   - After Effects: `http://localhost:8099`

---

## Uninstallation

To remove AssetSync from your system:

- **Windows**: Double-click **`uninstall.bat`**
- **macOS**: Double-click **`uninstall.command`** (or run `./uninstall.sh`)

---

## Packaging a Release

To generate a new release zip ready for GitHub Releases:

```bash
./package.sh
```

This packages the extension and installers into `dist/AssetSync-v1.0.0.zip`.

---

## License

This project is licensed under the [MIT License](LICENSE).
