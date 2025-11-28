# Desktop App - Cross-Platform Build Guide

## Platforms Supported

- ✅ **macOS** (universal binary - Intel + Apple Silicon)
- ✅ **Windows** (x86_64)
- ✅ **Linux** (x86_64)

## Configuration Restored

### macOS Dependencies

- ✅ `cocoa = "0.25"` - macOS UI framework bindings
- ✅ `objc = "0.2"` - Objective-C runtime bindings
- ✅ `icon.icns` - macOS app icon format

### Cross-Platform Build Targets

- ✅ `targets: "all"` - Builds for all platforms
- ✅ All platform-specific icons included
- ✅ Linux Debian package configuration

### Build Scripts

- ✅ `build:windows` - Windows MSI/NSIS installers
- ✅ `build:macos` - macOS DMG (universal binary)
- ✅ `build:linux` - Linux AppImage and .deb
- ✅ `build:all` - Build for all platforms

## Fixing macOS Clang Compiler Crash

The clang compiler crash you encountered is a known issue with certain versions
of Xcode Command Line Tools. Here are the solutions:

### Solution 1: Update Xcode Command Line Tools (Recommended)

```bash
# Remove existing tools
sudo rm -rf /Library/Developer/CommandLineTools

# Reinstall latest version
xcode-select --install

# Verify installation
xcode-select -p
clang --version
```

### Solution 2: Use Xcode Beta

If the stable version continues to crash:

```bash
# Install Xcode from App Store
# Then select Xcode beta tools
sudo xcode-select --switch /Applications/Xcode-beta.app/Contents/Developer
```

### Solution 3: Downgrade to Stable Xcode Version

```bash
# Download specific Xcode version from Apple Developer
# Install and switch to it
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Solution 4: Use Rosetta 2 (Apple Silicon Macs)

If on Apple Silicon and getting crashes:

```bash
# Run terminal under Rosetta
arch -x86_64 zsh

# Then run build
cd apps/desktop/staff-admin
pnpm dev:tauri
```

### Solution 5: Clean Build

```bash
# Clean Rust build cache
cd apps/desktop/staff-admin/src-tauri
cargo clean

# Clean node modules
cd ..
rm -rf node_modules
pnpm install

# Try again
pnpm dev:tauri
```

## Development Workflow

### Run Development Server

```bash
cd apps/desktop/staff-admin
pnpm dev:tauri
```

This will:

1. Start Vite dev server on http://localhost:5173
2. Compile Rust backend
3. Launch desktop app window

### Build for Production

```bash
# Build for current platform
pnpm build:tauri

# Build for specific platform
pnpm build:macos      # macOS DMG
pnpm build:windows    # Windows MSI/NSIS
pnpm build:linux      # Linux AppImage/deb

# Build for all platforms (requires cross-compilation setup)
pnpm build:all
```

## Output Locations

### macOS

```
src-tauri/target/release/bundle/
├── dmg/
│   └── SACCO+ Staff Admin_0.1.0_universal.dmg
└── macos/
    └── SACCO+ Staff Admin.app
```

### Windows

```
src-tauri/target/release/bundle/
├── msi/
│   └── SACCO+ Staff Admin_0.1.0_x64_en-US.msi
└── nsis/
    └── SACCO+ Staff Admin_0.1.0_x64-setup.exe
```

### Linux

```
src-tauri/target/release/bundle/
├── appimage/
│   └── sacco-staff-admin_0.1.0_amd64.AppImage
└── deb/
    └── sacco-staff-admin_0.1.0_amd64.deb
```

## Troubleshooting

### Issue: Clang Segmentation Fault

**Error:**

```
clang: error: unable to execute command: Segmentation fault: 11
```

**Solution:** Follow Solution 1 above (Update Xcode CLT)

### Issue: Missing Dependencies

**Error:**

```
error: failed to run custom build command for `objc2-exception-helper`
```

**Solution:**

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Or install full Xcode from App Store
```

### Issue: Wrong Architecture

**Error:**

```
error: linking with `cc` failed
```

**Solution:**

```bash
# Ensure correct Rust target installed
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin

# For universal binary
rustup target add universal-apple-darwin
```

## Testing Authentication on macOS

Once the build succeeds:

1. **Login Flow:**
   - App opens to login page
   - Enter credentials
   - Redirects to dashboard or MFA challenge

2. **MFA Flow:**
   - Enter 6-digit TOTP code
   - Redirects to dashboard on success

3. **Session Persistence:**
   - Credentials stored in macOS Keychain
   - Close and reopen app
   - Should auto-login without credentials

4. **Logout:**
   - Click "Sign Out" in sidebar
   - Credentials cleared from Keychain
   - Redirects to login

## Next Steps

1. **Fix Xcode CLT:** Update Command Line Tools
2. **Test Build:** Run `pnpm dev:tauri`
3. **Test Auth:** Verify login, MFA, and session persistence
4. **Production Build:** Create DMG with `pnpm build:macos`
5. **Code Signing:** Set up Apple Developer certificates for distribution

## Cross-Platform Notes

- **macOS:** Uses Keychain for secure storage
- **Windows:** Uses Credential Manager
- **Linux:** Uses Secret Service (libsecret)

All platforms use the same authentication code - only the secure storage backend
differs.
