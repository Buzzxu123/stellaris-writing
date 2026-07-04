# Stellaris Writing

Stellaris Writing is a local-first desktop writing check-in app built with React, Vite, and Tauri.

## Quick Start

```sh
npm install
npm run desktop
```

This opens the app as a native desktop window. It does not require Chrome or a browser tab.

## Create A Desktop Launcher On macOS

Double-click:

```text
scripts/setup-desktop-mac.command
```

The setup script will:

- open the installed `/Applications/Stellaris Writing.app` when it exists
- fall back to source-mode launch only for developers
- create `Stellaris Writing.app` on your Desktop
- use the Stellaris star-map icon
- avoid requiring npm when the packaged app is already installed

If the DMG app has already been installed into `/Applications`, the desktop launcher does not need Node.js or npm.
For a cloned GitHub copy without an installed app, source-mode launch still requires Node.js.

## Build An Installable App

```sh
npm install
npm run desktop:build
```

The packaged macOS app will be created under:

```text
src-tauri/target/release/bundle/
```

That build is the better option when sending the app to someone who should not run it from source.
End users who install the DMG do not need Node.js, npm, Rust, Vite, or the source repository.

## Build Windows And macOS Installers

Installers are built by GitHub Actions from the repository:

```text
.github/workflows/build-installers.yml
```

Run the `Build Installers` workflow manually, or push a version tag like `v0.1.0`.
It produces:

- `Stellaris-Writing-macOS`: macOS DMG
- `Stellaris-Writing-Windows`: Windows NSIS `.exe` installer

The Windows installer:

- installs the app for the current user
- creates a desktop shortcut
- creates a Start Menu shortcut
- includes Tauri's offline WebView2 installer, so end users do not install Node.js, npm, Rust, or WebView2

Windows installers must be built on a Windows runner. Use the GitHub Actions workflow for that artifact.

## Development Commands

```sh
npm run dev            # browser dev server
npm run desktop        # Tauri desktop dev app
npm run desktop:build  # packaged desktop app
npm run desktop:build:windows # Windows NSIS build, run on Windows
npm run icons:generate # regenerate app icons
npm run build          # frontend production build
npm run lint           # oxlint
```
