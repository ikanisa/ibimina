# Release Checklist

## 1. Pre-flight

- [ ] Confirm `pnpm install --frozen-lockfile` succeeds on a clean clone.
- [ ] Ensure `pnpm --filter @ibimina/client run build` and
      `pnpm --filter @ibimina/admin run build` complete locally; investigate any
      missing compiled shared packages.
- [ ] Verify Supabase migrations are applied to staging using
      `pnpm --filter @ibimina/admin run supabase:deploy -- --dry-run`.

## 2. Client & Staff PWAs

1. `pnpm run lint`
2. `pnpm run typecheck`
3. `pnpm run test`
4. `pnpm --filter @ibimina/client run build`
5. `pnpm --filter @ibimina/admin run build`
6. Run Lighthouse with throttling:
   `npx @lhci/cli autorun --config=apps/client/lighthouse.config.cjs`
7. Deploy to Vercel once Lighthouse ≥90 PWA / ≥80 Performance:
   `pnpm --filter @ibimina/client run deploy:vercel:fallback`
8. Deploy Cloudflare Pages fallback:
   `pnpm --filter @ibimina/client run deploy:cloudflare`

## 3. Android (Expo) Release

1. Export credentials (keystore JSON, Expo token) into your shell.
2. Bump version via env vars if needed:
   ```bash
   export APP_VERSION=1.0.1
   export ANDROID_VERSION_CODE=101
   pnpm --filter @ibimina/mobile exec expo config --type public
   ```
3. Build release bundle (AAB):
   ```bash
   pnpm --filter @ibimina/mobile run build:android:release
   ```
4. Build QA APK for smoke tests:
   ```bash
   pnpm --filter @ibimina/mobile run build:android:apk
   ```
5. Upload `apps/mobile/dist/*.aab` to Play Console with matching Proguard
   mapping.

## 4. iOS (Expo) Release

1. Export credentials (Apple App Store Connect key, certificates, Expo token).
2. Align build number (defaults to app version, override via
   `IOS_BUILD_NUMBER`).
3. Build signed IPA:
   ```bash
   pnpm --filter @ibimina/mobile run build:ios:release
   ```
4. Validate output with Transporter or `eas submit --platform ios`.

## 5. Post-Deployment

- [ ] Smoke-test member PWA offline cache (`/offline`) and share target
      (`/share`).
- [ ] Validate Android/iOS builds on physical devices for cold start and
      analytics capture.
- [ ] Monitor Supabase logs and Vercel/Cloudflare dashboards for error spikes.
- [ ] Update `CHANGELOG.md` with release highlights and increment versions in
      affected packages.
