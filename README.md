# Clipboard Manager

A floating clipboard history manager for macOS that stays on top of all windows, including fullscreen applications. Quickly access your clipboard history with a global shortcut and paste directly into any application.

![Clipboard Manager](https://img.shields.io/badge/macOS-Compatible-brightgreen)
![Electron](https://img.shields.io/badge/Electron-30.0.1-blue)

## Features

- 📋 **Clipboard History**: Automatically tracks text and images you copy
- 🪟 **Always on Top**: Floats over all windows, including fullscreen apps
- ⚡ **Global Shortcut**: Press `Cmd+Shift+V` anywhere to show/hide
- 🔍 **Search**: Quickly find items in your clipboard history
- 🖼️ **Image Support**: Works with both text and images
- 🎯 **Auto-Paste**: One-click paste directly into applications

## Installation

### Method 1: Download Pre-built App (Recommended)

1. **Download the latest release** from the [Releases page](https://github.com/kevmongare/MacClipboard/releases)
2. **Open the DMG file**
3. **Drag "Clipboard Manager" to your Applications folder**
4. **Open the app from Applications** (you may need to right-click and select "Open" the first time)

### Method 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/kevmongare/MacClipboard.git
cd MacClipboard

# Install dependencies
npm install

# Build the app
npm run build:app

# The built app will be in the 'release' folder
