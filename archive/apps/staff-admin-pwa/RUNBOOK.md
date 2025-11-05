# Staff Admin PWA - Runbook

Complete operational guide for building, testing, deploying, and hosting the Staff Admin PWA.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Development Workflow](#development-workflow)
4. [Building](#building)
5. [Testing](#testing)
6. [Local Hosting](#local-hosting)
7. [Production Deployment](#production-deployment)
8. [Monitoring & Debugging](#monitoring--debugging)
9. [Common Issues](#common-issues)

---

## Prerequisites

### Required

- **Node.js**: 20.x LTS (check with `node -v`)
- **pnpm**: 8.x or higher (install with `npm install -g pnpm`)

### Optional

- **Docker**: For containerized hosting
- **mkcert**: For local HTTPS (install via brew/apt/choco)
- **Playwright browsers**: Installed automatically with `pnpm install`

### Environment Check

```bash
node -v       # Should be v20.x.x
pnpm -v       # Should be 8.x.x or higher
docker -v     # (optional) Docker version
```

---

## Local Setup

### Step 1: Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd staff-admin-pwa

# Install dependencies
pnpm install

# This installs 50+ packages including:
# - React, TypeScript, Material UI
# - Vite build tools
# - Testing libraries
# - MSW for mocking
```

### Step 2: Generate Assets

```bash
# Generate PWA icons from logo.svg
pnpm generate:icons

# (Optional) Generate VAPID keys for Web Push
pnpm generate:vapid
# This creates .env.local.push with keys
```

### Step 3: Configure Environment

Create `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8081
VITE_ENABLE_MOCKS=true
VITE_PWA_DISABLED=true
```

Or use the included `.env.development` (already configured for local dev).

### Step 4: Start Development Server

```bash
pnpm dev
```

Open http://localhost:3000

**Default login:**
- Email: `admin@example.com`
- Password: `password`

---

## Development Workflow

### Running the Dev Server

```bash
# Standard dev server
pnpm dev

# With mock API enabled
VITE_ENABLE_MOCKS=true pnpm dev

# Different port
PORT=3001 pnpm dev
```

### Code Quality

```bash
# Type checking (strict mode)
pnpm typecheck

# Linting
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Format all files
pnpm format

# Check formatting without changes
pnpm format:check
```

### Git Hooks

Husky is configured to run:

- **pre-commit**: Lint-staged (lint + format changed files)
- **commit-msg**: Commitlint (enforce conventional commits)

Format: `type(scope): message`

Examples:
```
feat(auth): add biometric login support
fix(users): resolve pagination bug
docs(readme): update installation steps
```

---

## Building

### Development Build

```bash
pnpm build:dev
# or
pnpm build --mode development

# Uses .env.development
# - API: http://localhost:8081
# - Mocks: enabled
# - PWA: disabled
```

### Staging Build

```bash
pnpm build:staging
# or
pnpm build --mode staging

# Uses .env.staging
# - API: https://staging.api.example.com
# - Mocks: disabled
# - PWA: enabled
```

### Production Build

```bash
pnpm build:production
# or
pnpm build --mode production

# Uses .env.production
# - API: https://api.example.com
# - Mocks: disabled
# - PWA: enabled
# - Minified, optimized
```

### Build Output

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js      # Main bundle
│   ├── vendor-[hash].js     # React, ReactDOM, Router
│   ├── mui-[hash].js        # Material UI
│   ├── query-[hash].js      # TanStack Query
│   └── charts-[hash].js     # Chart.js
├── sw.js                     # Service worker
├── manifest.webmanifest      # PWA manifest
└── offline.html              # Offline fallback
```

### Build Verification

```bash
# Check bundle size
pnpm build
du -sh dist/

# Typical sizes:
# - Total: 2-3 MB
# - Gzipped: ~500-700 KB
```

---

## Testing

### Unit Tests

```bash
# Run once
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
# Opens coverage/index.html
```

**Test Structure:**
```
src/__tests__/
├── auth.test.tsx        # Authentication hooks
├── setup.ts             # Test setup
└── ...
```

### E2E Tests (Playwright)

```bash
# Install browsers (one-time)
pnpm exec playwright install --with-deps

# Build first (E2E tests run against preview server)
pnpm build

# Run E2E tests
pnpm test:e2e

# Run with UI mode
pnpm test:e2e:ui

# Run specific test
pnpm exec playwright test tests/e2e/app.spec.ts
```

**Test Coverage:**
- Login flow (valid/invalid credentials)
- User management (navigate, create dialog)
- Offline mode detection

### PWA Testing

1. Build for production:
   ```bash
   pnpm build:production
   ```

2. Preview:
   ```bash
   pnpm preview
   ```

3. Open DevTools → Application:
   - **Service Workers**: Check registration
   - **Manifest**: Verify PWA manifest
   - **Storage**: Check IndexedDB entries

4. Test offline:
   - DevTools → Network → Offline checkbox
   - App should show offline indicator
   - Navigate (should work from cache)

5. Test install:
   - Chrome: Address bar → Install icon
   - Or Settings page → "Install as App"

---

## Local Hosting

### Option 1: Vite Preview (Quickest)

```bash
pnpm build
pnpm preview
# http://localhost:4173
```

**Use case:** Quick local testing after build.

### Option 2: Node Static Server

```bash
pnpm build
npx serve dist -s -p 8080
# http://localhost:8080

# -s flag enables SPA fallback
```

**Use case:** Test with a static file server (similar to CDN behavior).

### Option 3: Docker + Nginx (HTTP)

```bash
# Build
pnpm build

# Start container
docker compose up --build

# Or detached
docker compose up --build -d

# Stop
docker compose down
```

Access at: http://localhost:8080

**Configuration:** `deploy/nginx/nginx.conf`

**Makefile shortcut:**
```bash
make docker-up
make docker-down
```

### Option 4: Docker + Nginx (HTTPS)

**First-time setup:**

1. Install mkcert:
   ```bash
   # macOS
   brew install mkcert
   
   # Linux (Debian/Ubuntu)
   sudo apt install mkcert
   
   # Windows
   choco install mkcert
   ```

2. Generate certificates:
   ```bash
   bash scripts/mkcert.sh
   ```

   This creates:
   - `deploy/nginx/certs/cert.pem`
   - `deploy/nginx/certs/key.pem`

3. Add to `/etc/hosts`:
   ```
   127.0.0.1  admin.local
   ```

**Start HTTPS server:**

```bash
# Build
pnpm build

# Start container
docker compose -f docker-compose.ssl.yml up --build -d

# Stop
docker compose -f docker-compose.ssl.yml down
```

Access at: https://admin.local:8443

**Makefile shortcut:**
```bash
make docker-ssl-up
make docker-ssl-down
```

**Why HTTPS?**
- Service workers require secure context (localhost or HTTPS)
- For LAN testing (e.g., 192.168.x.x), HTTPS is required
- Web Push API requires HTTPS

---

## Production Deployment

### Option A: Static Hosting (Netlify, Vercel, Cloudflare Pages)

1. Build:
   ```bash
   pnpm build:production
   ```

2. Deploy `dist/` folder to your host.

3. Configure:
   - **SPA Fallback**: Redirect all routes to `/index.html`
   - **Headers**: See `deploy/nginx/nginx.conf` for recommended headers

**Example (Netlify `_redirects`):**
```
/*  /index.html  200
```

**Example (Vercel `vercel.json`):**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

### Option B: Docker + Registry

1. Build image:
   ```bash
   docker build -f deploy/nginx/Dockerfile -t staff-admin-pwa:latest .
   ```

2. Push to registry:
   ```bash
   docker tag staff-admin-pwa:latest your-registry/staff-admin-pwa:v1.0.0
   docker push your-registry/staff-admin-pwa:v1.0.0
   ```

3. Deploy to Kubernetes/ECS/Cloud Run/etc.

### Option C: GitHub Actions Release

Push a tag to trigger automatic build and release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This workflow (`.github/workflows/release.yml`):
1. Builds production bundle
2. Creates GitHub release
3. Attaches `dist.zip` artifact
4. (Optional) Publishes Docker image to GHCR

**Required secrets:**
- `API_BASE_URL`: Production API endpoint
- `VAPID_PUBLIC_KEY`: Web Push public key
- `PUBLISH_DOCKER`: Set to `true` to enable Docker publish
- `GHCR_TOKEN`: GitHub Container Registry token

### Environment Variables for Production

```bash
VITE_API_BASE_URL=https://api.example.com
VITE_ENABLE_MOCKS=false
VITE_PWA_DISABLED=false
VITE_PUSH_PUBLIC_KEY=<your-vapid-public-key>
```

---

## Monitoring & Debugging

### Service Worker Debug

**Chrome DevTools:**
1. Open DevTools → Application → Service Workers
2. Check registration status
3. Inspect cached resources (Cache Storage)
4. Test "Update on reload" checkbox
5. Unregister if needed

**Console logs:**
- Service worker activated: Green checkmark
- Update available: Prompt to reload

### Network Debug

**DevTools → Network:**
1. Check API requests (should have `Authorization: Bearer ...` header)
2. Look for failed requests (401/500)
3. Verify retry behavior on refresh token expiry

**Offline simulation:**
- Network tab → Offline checkbox
- Verify offline indicator appears
- Check background sync queue (IndexedDB → offline-queue)

### IndexedDB Inspection

**DevTools → Application → IndexedDB:**

- `staff-admin-pwa`:
  - `api-cache`: Cached GET responses
  - `offline-queue`: Queued write operations

### Performance

**Lighthouse audit:**
```bash
pnpm build
pnpm preview
# Open in Chrome → DevTools → Lighthouse → Run audit
```

**PWA score should be 90+:**
- Installable ✓
- Service worker ✓
- Offline support ✓
- HTTPS ✓ (if deployed)

### Error Tracking

**In production, integrate error tracking:**

```typescript
// Example: Sentry integration
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-dsn',
  environment: import.meta.env.MODE,
});
```

---

## Common Issues

### Issue: Build fails with "Cannot find module '@mui/material'"

**Solution:**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: Service worker not updating

**Solution:**
1. DevTools → Application → Service Workers
2. Check "Update on reload"
3. Hard refresh (Cmd/Ctrl + Shift + R)
4. Or unregister and reload

### Issue: E2E tests fail with "page.goto: net::ERR_CONNECTION_REFUSED"

**Solution:**
```bash
# Ensure preview server is running
pnpm build
pnpm preview &

# Wait a moment, then run tests
pnpm test:e2e
```

### Issue: HTTPS certificate not trusted

**Solution:**
```bash
# Reinstall mkcert CA
mkcert -install

# Regenerate certificates
bash scripts/mkcert.sh

# Restart browser
```

### Issue: Push notifications not working

**Checklist:**
- [ ] HTTPS enabled (or localhost)
- [ ] `VITE_PUSH_PUBLIC_KEY` set
- [ ] Notification permission granted
- [ ] Service worker registered
- [ ] Browser supports Push API (check caniuse.com)

### Issue: Offline mode not working

**Checklist:**
- [ ] Production build (`pnpm build:production`)
- [ ] Service worker enabled (`VITE_PWA_DISABLED=false`)
- [ ] Service worker registered (check DevTools)
- [ ] Offline fallback page exists (`public/offline.html`)

### Issue: Docker build fails

**Solution:**
```bash
# Ensure dist/ exists
pnpm build

# Check Docker daemon is running
docker ps

# Rebuild without cache
docker compose build --no-cache
docker compose up
```

---

## Makefile Commands Summary

```bash
make setup           # Install deps + generate icons
make dev             # Start dev server
make build           # Build for production
make preview         # Preview build
make test            # Run unit tests
make test-e2e        # Run E2E tests
make lint            # Lint code
make format          # Format code
make clean           # Clean build artifacts
make docker-up       # Start Docker (HTTP)
make docker-down     # Stop Docker
make docker-ssl-up   # Start Docker (HTTPS)
make ready           # Lint + typecheck + test + build
```

---

## Quick Reference

### Default Ports

| Service | Port |
|---------|------|
| Vite dev server | 3000 |
| Vite preview | 4173 |
| Docker HTTP | 8080 |
| Docker HTTPS | 8443 |

### Key Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite + PWA configuration |
| `.env.*` | Environment variables |
| `src/main.tsx` | App entry point |
| `src/App.tsx` | Main app component + routing |
| `src/mocks/handlers.ts` | MSW mock API |
| `deploy/nginx/nginx.conf` | Nginx configuration |

### API Endpoints (Mock)

```
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /users?page&pageSize&query
POST /users
PUT  /users/:id
PATCH /users/:id/status
GET  /orders?page&pageSize&status
PATCH /orders/:id/status
GET  /tickets?page&pageSize&status
GET  /tickets/:id
POST /tickets/:id/comments
PATCH /tickets/:id/status
```

---

## Support

For issues and questions:
1. Check this runbook
2. Check README.md
3. Open GitHub issue
4. Contact team lead

---

**Last Updated:** 2024-03-15
