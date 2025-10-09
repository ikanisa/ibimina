# Vercel Readiness Checklist

## 1. Stack Detection (2025-10-09)
- Detected **Next.js (App Router)** because `next.config.ts` is present and the `app/` directory is used for routing.
- Existing PWA support is partial (custom `public/sw.js` and manifest referencing only SVG icons). We will harmonise these with Vercel + `next-pwa` requirements in later steps.

Further sections will be updated as the integration progresses.

## 2. PWA Assets & Config (2025-10-09)
- Standardised `public/manifest.json` to reference PNG icons and the new Ibimina brand colour `#0b1020`.
- Generated placeholder icons at 192×192 and 512×512 under `public/icons/`.
- Promoted the manifest + theme colour via `app/layout.tsx` metadata so the App Router emits `<link rel="manifest">` and `<meta name="theme-color">`.
- Introduced `service-worker.js` (registered by `next-pwa`) and removed the legacy `public/sw.js` to avoid double registration.
- Wrapped `next.config.ts` with `next-pwa` (dest `public`, skip waiting/register true) and disabled Next image optimisation to stay CDN-friendly on Vercel.

## 3. Tooling & Deployment Config (2025-10-09)
- Added `vercel.json` with cache-control and security headers plus default region `fra1` (override via `VERCEL_REGION`).
- Created `.env.example` and updated `.gitignore` to keep it tracked while ignoring real secrets.
- Expanded `package.json` scripts (`dev`/`start` on port 3000, `analyze:pwa`, `verify:pwa`) and set the Node engine to `>=18.18.0`.
- Introduced `scripts/verify-pwa.mjs` to lint manifest/head/service-worker, run `npm run build`, launch the app, and probe `/api/health`.
- Added the `/api/health` edge route for deployment smoke-tests.
- NOTE: `next-pwa` is declared in dependencies; install via `npm install` when network access to npm is available.
