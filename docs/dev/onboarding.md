# 10-Minute Onboarding (Admin · Client · Mobile)

Follow this checklist to go from a fresh clone to running all three Ibimina
experiences in under 10 minutes.

## 1) Prepare the toolchain (2 minutes)

- Install **Node.js 20.18+** and enable Corepack.
- From the repo root, run the bootstrapper:

```bash
./scripts/bootstrap.sh
```

This installs the pinned pnpm release, installs workspace dependencies, hydrates
`.env` templates, validates required secrets, and runs a lint smoke test.

## 2) Fill in required env values (3 minutes)

- Edit `.env` / `.env.local` with real Supabase credentials and cryptographic
  secrets. Minimum required keys:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`, `KMS_DATA_KEY_BASE64`
  - `BACKUP_PEPPER`, `MFA_SESSION_SECRET`, `TRUSTED_COOKIE_SECRET`,
    `HMAC_SHARED_SECRET`
- Mirror the shared secrets into `supabase/.env.local` for Edge Functions.
- Re-run `pnpm run check:env` until it reports all required values are present.

## 3) Launch the admin console (2 minutes)

- Start the staff/admin PWA on port **3100**:

```bash
pnpm --filter @ibimina/staff-admin-pwa dev
```

- Visit http://localhost:3100 to verify MFA/login flows.

## 4) Launch the member/client PWA (1 minute)

- Start the member app on port **5000**:

```bash
pnpm --filter @ibimina/client dev
```

- Open http://localhost:5000 and confirm Supabase-backed pages load.

## 5) Build the native mobile shell (2 minutes)

- For a fast local check of the Android shell:

```bash
cd apps/mobile/staff-android
./gradlew assembleDebug
```

- Install the resulting APK onto a device/emulator to confirm the Compose
  scaffold and Supabase wiring come up.

## 6) Next steps (optional)

- Generate Supabase types after schema changes: `pnpm run gen:types`
- Run the full CI parity suite: `make quickstart`
- For Expo/React Native work, start from the root `App.tsx` entry and follow the
  platform-specific guides in `MOBILE_APPS_QUICKSTART.md` and
  `APPS_READY_FOR_STORES.md`.
