# Artifacts Inventory

| Surface          | Artifact Path                         | SHA256    | Notes                                                                                                                                        |
| ---------------- | ------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Client PWA       | `apps/client/.next`                   | _pending_ | Build currently fails because shared packages lack compiled JS outputs.【89224b†L1-L38】                                                     |
| Staff PWA        | `apps/admin/.next`                    | _pending_ | Blocked on same shared package issue until client build fixed.【89224b†L1-L38】                                                              |
| Android AAB      | `apps/mobile/dist/ibimina-mobile.aab` | _pending_ | Generated via `pnpm --filter @ibimina/mobile run build:android:release` once Expo credentials provided.【F:apps/mobile/package.json†L1-L69】 |
| Android APK (QA) | `apps/mobile/dist/ibimina-mobile.apk` | _pending_ | Built with `pnpm --filter @ibimina/mobile run build:android:apk`; upload to QA testers.                                                      |
| iOS IPA          | `apps/mobile/dist/Ibimina.ipa`        | _pending_ | Produced by `pnpm --filter @ibimina/mobile run build:ios:release` after provisioning profiles uploaded.                                      |
