# Scripts overview

This repository includes shared scripts that support the staff admin applications.
The commands below use the root `pnpm` scripts so you can run them from the
repository root.

## Workspace-wide health check

- `pnpm run workspace:doctor` — Runs linting, type checking, Prettier
  verification, and a production dependency audit across all workspaces. This is
  wired into CI and the pre-push hook to keep checks consistent locally and in
  automation.

## Staff Admin PWA (`@ibimina/staff-admin-pwa`)

- Build: `pnpm run build:admin`
- Test: `pnpm --filter @ibimina/staff-admin-pwa run test:unit` and
  `pnpm --filter @ibimina/staff-admin-pwa run test:e2e`
- Deploy: `pnpm run deploy:netlify`

## Staff Admin Desktop (`@ibimina/staff-admin-desktop`)

- Build: `pnpm --filter @ibimina/staff-admin-desktop build`
- The desktop app uses Tauri for cross-platform builds (Windows, macOS, Linux)
