# Scripts overview

This repository includes shared scripts that support the main product surfaces.
The commands below use the root `pnpm` scripts so you can run them from the
repository root.

## Workspace-wide health check

- `pnpm run workspace:doctor` — Runs linting, type checking, Prettier
  verification, and a production dependency audit across all workspaces. This is
  wired into CI and the pre-push hook to keep checks consistent locally and in
  automation.

## Admin PWA (`@ibimina/admin`)

- Build: `pnpm run build:admin`
- Test: `pnpm --filter @ibimina/admin run test:unit` and
  `pnpm --filter @ibimina/admin run test:e2e`
- Deploy: `pnpm run deploy:netlify`

## Client PWA (`@ibimina/client`)

- Build: `pnpm run build:client`
- Test: `pnpm --filter @ibimina/client run test:unit` and
  `pnpm --filter @ibimina/client run test:e2e`
- Deploy: `pnpm run deploy:netlify`

## Mobile apps (`@ibimina/mobile` and native targets)

- Build: `pnpm run build:client-mobile` for the cross-platform bundle,
  `pnpm run build:staff-android` for the staff Android app, and
  `pnpm run build:client-android[:release]` for the client Android app.
- Test: `pnpm --filter @ibimina/mobile run test:detox` for Detox tests and
  `pnpm run test:client-android` for native unit tests.
- Deploy: Follow the platform-specific release guides after producing the
  release builds above.
