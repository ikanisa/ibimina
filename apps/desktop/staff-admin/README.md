# SACCO+ Staff Admin Desktop

Desktop application for SACCO+ staff administration built with Tauri and Next.js.

## Features

- **Secure Credential Storage**: Uses OS keychain (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- **Native Printing**: Support for standard printers and thermal receipt printers (ESC/POS)
- **Hardware Integration**:
  - Barcode scanner support (HID)
  - NFC reader integration
  - Biometric authentication (Windows Hello / Touch ID)
- **Auto-Update System**: Automatic update checks and installation
- **System Tray**: Minimize to tray with quick access menu

## Development

### Prerequisites

- Node.js 20+
- pnpm 10.19.0+
- Rust 1.70+
- Platform-specific dependencies:
  - **Windows**: Visual Studio Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: libgtk-3-dev, libwebkit2gtk-4.0-dev, libappindicator3-dev

### Setup

# Ibimina Staff Admin Desktop

Native desktop application for the Ibimina Staff Admin panel using Tauri.

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev
```

### Building

```bash
# Build for current platform
pnpm build

# Build for specific platform
pnpm build:windows
pnpm build:macos
pnpm build:linux

# Build for all platforms (requires cross-compilation setup)
pnpm build:all
```

## Architecture

### Rust Backend (`src-tauri/`)

- **commands/auth.rs**: Secure credential storage using OS keychain
- **commands/print.rs**: Printer discovery and printing (HTML, thermal receipts)
- **commands/hardware.rs**: Barcode scanner, NFC, biometric authentication
- **commands/updates.rs**: Auto-update system
- **main.rs**: Tauri app setup with system tray

### Frontend (`src/`)

- **lib/tauri/**: Type-safe TypeScript bindings to Rust commands
- **components/desktop/**: Desktop-specific UI components
- **app/**: Next.js app with static export for Tauri

## TypeScript API

```typescript
import {
  // Auth
  getSecureCredentials,
  setSecureCredentials,
  deleteSecureCredentials,
  getDeviceId,
  
  // Printing
  getPrinters,
  printHtml,
  printReceipt,
  
  // Hardware
  isScannerAvailable,
  startBarcodeScan,
  isNfcAvailable,
  isBiometricsAvailable,
  authenticateBiometrics,
  
  // Updates
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  
  // Events
  onBarcodeScanned,
  onNfcDetected,
  onDownloadProgress,
  onUpdateAvailable,
} from '@/lib/tauri';
```

## Printing

### Standard HTML Printing

```typescript
import { printHtml, getPrinters } from '@/lib/tauri';

const printers = await getPrinters();
const defaultPrinter = printers.find(p => p.is_default);

await printHtml(defaultPrinter.name, '<html>...</html>');
```

### Thermal Receipt Printing

```typescript
import { printReceipt } from '@/lib/tauri';

await printReceipt('Thermal-Printer', {
  title: 'SACCO+ Receipt',
  items: [
    { label: 'Amount', value: 'RWF 10,000' },
    { label: 'Reference', value: 'TXN-12345' },
  ],
  total: 'RWF 10,000',
  footer: 'Thank you!',
});
```

## Hardware Integration

### Barcode Scanner

```typescript
import { startBarcodeScan, onBarcodeScanned } from '@/lib/tauri';

// Start scanning
await startBarcodeScan();

// Listen for scans
const unlisten = await onBarcodeScanned((result) => {
  console.log('Scanned:', result.data);
});
```

### Biometric Authentication

```typescript
import { authenticateBiometrics } from '@/lib/tauri';

const success = await authenticateBiometrics('Confirm transaction');
if (success) {
  // Proceed with authenticated action
}
```

## Auto-Updates

Updates are checked automatically on startup. When an update is available, the `UpdateNotification` component shows a banner with:

- Release notes
- Download progress
- Install button

Updates are signed and verified using Tauri's built-in updater.

## System Tray

The app minimizes to the system tray with:

- **Left Click**: Restore window
- **Right Click Menu**:
  - Show: Restore window
  - Quit: Exit application

## CI/CD

The GitHub Actions workflow (`.github/workflows/desktop-build.yml`) builds for all platforms:

- **Windows**: .msi installer
- **macOS**: .dmg universal binary (Intel + Apple Silicon)
- **Linux**: .AppImage and .deb packages

Artifacts are uploaded to GitHub Releases.

## Security

- Credentials stored in OS keychain (never in plaintext)
- Update signatures verified before installation
- Tauri security features (CSP, allowlist)
- No shell command execution (except controlled printing)

## License

MIT
pnpm dev:tauri

# Build for production
pnpm build:tauri
```

## Features

- **Cross-platform**: Windows, macOS, Linux
- **Native performance**: Built with Rust and Tauri
- **Offline-first**: Full offline support with sync
- **Auto-updates**: Automatic application updates
- **System integration**: Tray icon, notifications, deep links

## Platform Adapters

This desktop app uses the Tauri platform adapter from `@ibimina/admin-core` to provide:

- Secure credential storage via Tauri Store
- Native notifications
- Hardware printing support
- System updates via Tauri Updater

## Building

The build process requires:

1. Rust toolchain (install from https://rustup.rs)
2. Platform-specific build tools:
   - **Windows**: Visual Studio Build Tools
   - **macOS**: Xcode Command Line Tools
   - **Linux**: webkit2gtk, libayatana-appindicator

See [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) for details.
