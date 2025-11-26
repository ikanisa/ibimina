# Ibimina Staff Admin Desktop

Native desktop application for the Ibimina Staff Admin panel using Tauri.

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
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
