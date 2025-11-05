# BUILD INSTRUCTIONS

Complete step-by-step guide to build the Staff Admin PWA locally.

## Prerequisites Verification

```bash
# Check Node.js version (must be 20.x)
node -v
# Expected: v20.11.0 or higher

# Check pnpm (install if missing)
pnpm -v
# Expected: 8.x or higher
# Install: npm install -g pnpm

# Verify git
git --version
```

---

## Step 1: Clone Repository

```bash
# Clone
git clone <repository-url>
cd staff-admin-pwa

# Verify structure
ls -la
# Should see: package.json, src/, public/, etc.
```

---

## Step 2: Install Dependencies

```bash
# Install all dependencies (~1-2 minutes)
pnpm install

# This installs:
# - 50+ packages
# - React ecosystem
# - Material UI
# - Build tools (Vite, TypeScript)
# - Testing libraries
# - MSW for mocking

# Verify installation
pnpm list --depth=0
```

---

## Step 3: Configure Environment

### Option A: Use Defaults (Recommended for First Build)

Default `.env.development` is already configured:
```bash
VITE_API_BASE_URL=http://localhost:8081
VITE_ENABLE_MOCKS=true
VITE_PWA_DISABLED=true
```

### Option B: Custom Configuration

Create `.env.local` for overrides:

```bash
cat > .env.local << 'EOF'
VITE_API_BASE_URL=http://localhost:8081
VITE_ENABLE_MOCKS=true
VITE_PWA_DISABLED=true
EOF
```

**Environment Variables Explained:**

| Variable | Purpose | Values |
|----------|---------|--------|
| `VITE_API_BASE_URL` | Backend API endpoint | URL string |
| `VITE_ENABLE_MOCKS` | Enable MSW mock API | `true`/`false` |
| `VITE_PWA_DISABLED` | Disable PWA in dev | `true`/`false` |
| `VITE_PUSH_PUBLIC_KEY` | Web Push VAPID key | Base64 string (optional) |

---

## Step 4: Generate Assets (Optional)

```bash
# Generate PWA icons from logo.svg
pnpm generate:icons

# This creates:
# - public/assets/icons/icon-192.png
# - public/assets/icons/icon-256.png
# - public/assets/icons/icon-384.png
# - public/assets/icons/icon-512.png
# - public/assets/icons/icon-maskable-192.png
# - public/assets/icons/icon-maskable-512.png

# Note: Placeholder icons are included, so this step is optional
```

---

## Step 5: Build

### Development Build

```bash
pnpm build:dev

# Uses .env.development
# Output: dist/ directory
# Time: ~30-60 seconds
# Size: ~2-3 MB uncompressed
```

### Production Build

```bash
pnpm build:production

# Uses .env.production
# Fully optimized and minified
# Output: dist/ directory
# Time: ~30-60 seconds
# Size: ~500-700 KB gzipped
```

### Generic Build

```bash
pnpm build

# Uses .env (or .env.local if present)
# Same as production build
```

---

## Step 6: Verify Build

```bash
# Check dist/ directory
ls -lh dist/

# Expected files:
# - index.html
# - assets/ (JS, CSS bundles)
# - sw.js (service worker)
# - manifest.webmanifest (PWA manifest)
# - offline.html
# - robots.txt

# Check sizes
du -sh dist/
# Expected: 2-3 MB total

# Preview build (optional)
pnpm preview
# Open http://localhost:4173
```

---

## Build Output Structure

```
dist/
├── index.html                  # Main HTML file
├── assets/
│   ├── index-[hash].js        # Main application bundle
│   ├── vendor-[hash].js       # React, ReactDOM, Router
│   ├── mui-[hash].js          # Material UI components
│   ├── query-[hash].js        # TanStack Query
│   ├── charts-[hash].js       # Chart.js
│   ├── index-[hash].css       # Styles
│   └── ...                    # Other assets
├── sw.js                       # Service worker
├── manifest.webmanifest        # PWA manifest
├── workbox-[hash].js          # Workbox runtime
├── offline.html               # Offline fallback page
├── robots.txt                 # Search engine directives
└── assets/
    ├── logo.svg               # App logo
    └── icons/                 # PWA icons (192, 256, 384, 512)
```

---

## Build Modes Comparison

| Mode | API Endpoint | Mocks | PWA | Minified | Source Maps |
|------|--------------|-------|-----|----------|-------------|
| Development | localhost:8081 | ✓ | ✗ | ✗ | ✓ |
| Staging | staging.api.example.com | ✗ | ✓ | ✓ | ✓ |
| Production | api.example.com | ✗ | ✓ | ✓ | ✗ |

---

## Troubleshooting

### Error: "Cannot find module"

```bash
# Clean and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Error: "VITE_API_BASE_URL is not defined"

```bash
# Set environment variable
export VITE_API_BASE_URL=http://localhost:8081
pnpm build
```

### Build takes too long

```bash
# Clear Vite cache
rm -rf node_modules/.vite
pnpm build
```

### Bundle size too large

```bash
# Analyze bundle
ANALYZE_BUNDLE=1 pnpm build

# Opens bundle analyzer in browser
# Identify large dependencies
```

---

## Advanced Build Options

### Custom Output Directory

```bash
# Edit vite.config.ts
# build: { outDir: 'custom-dist' }
pnpm build
```

### Disable Source Maps

```bash
# Edit vite.config.ts
# build: { sourcemap: false }
pnpm build:production
```

### Environment-Specific Build

```bash
# Create custom env file
cat > .env.custom << 'EOF'
VITE_API_BASE_URL=https://custom.api.com
VITE_ENABLE_MOCKS=false
EOF

# Build with custom env
pnpm build --mode custom
```

---

## CI/CD Build

### GitHub Actions

Builds automatically run on:
- Pull requests
- Pushes to main/develop
- Tag pushes (releases)

**Workflow:** `.github/workflows/ci.yml`

**Manual trigger:**
```bash
git push origin main
# Wait ~5 minutes for build to complete
# Check Actions tab on GitHub
```

### Local CI Simulation

```bash
# Run all checks
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# Or use Makefile
make ready
```

---

## Build Checklist

Before considering a build ready for deployment:

- [ ] `pnpm install` successful
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (all unit tests)
- [ ] `pnpm build` completes successfully
- [ ] `dist/` directory created
- [ ] `dist/index.html` exists
- [ ] `dist/sw.js` exists (for production)
- [ ] Preview works: `pnpm preview`
- [ ] Service worker registers (check DevTools → Application)
- [ ] App works offline (production build only)
- [ ] No console errors in browser

---

## Next Steps

After successful build:

1. **Preview Locally**: See [HOSTING.md](#) for preview options
2. **Run Tests**: See [RUNBOOK.md](RUNBOOK.md#testing)
3. **Deploy**: See [RUNBOOK.md](RUNBOOK.md#production-deployment)

---

## Quick Commands Reference

```bash
# Install
pnpm install

# Build (dev)
pnpm build:dev

# Build (production)
pnpm build:production

# Preview
pnpm preview

# Clean
pnpm clean

# All checks
make ready
```

---

**Need Help?** See [RUNBOOK.md](RUNBOOK.md) or open an issue.
