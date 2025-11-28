# Desktop App - Windows Only Configuration

## Changes Made

### Removed macOS-Specific Code

- ✅ Removed `cocoa` and `objc` dependencies from `Cargo.toml`
- ✅ Removed macOS platform-specific dependencies section
- ✅ Removed `icon.icns` from bundle configuration
- ✅ Removed `build:macos` script from `package.json`

### Removed Linux-Specific Code

- ✅ Removed Linux bundle configuration from `tauri.conf.json`
- ✅ Removed `build:linux` script from `package.json`
- ✅ Removed `build:all` script (was building for all platforms)

### Windows-Only Configuration

- ✅ Bundle targets set to `["msi", "nsis"]` (Windows installers only)
- ✅ Icons limited to Windows formats (`.ico`, `.png`)
- ✅ Build script: `pnpm build:windows` for x86_64-pc-windows-msvc

## Build Commands

### Development

```bash
pnpm dev:tauri
```

### Production Build (Windows)

```bash
pnpm build:windows
```

This will create:

- `.msi` installer (Windows Installer)
- `.exe` with NSIS installer

## Output Location

Built installers will be in:

```
src-tauri/target/release/bundle/
├── msi/
│   └── SACCO+ Staff Admin_0.1.0_x64_en-US.msi
└── nsis/
    └── SACCO+ Staff Admin_0.1.0_x64-setup.exe
```

## Testing on Windows

The app should now compile successfully on Windows without any macOS/Linux
dependencies.

### Requirements

- Windows 10/11
- Rust toolchain for Windows
- Node.js and pnpm
- Visual Studio Build Tools (for Rust compilation)

### First-Time Setup on Windows

```bash
# Install Rust
winget install Rustlang.Rustup

# Install dependencies
cd apps/desktop/staff-admin
pnpm install

# Run in development
pnpm dev:tauri
```
