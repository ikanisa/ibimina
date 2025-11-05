# Staff Admin PWA

A production-grade Progressive Web App for staff/admin management of users, orders, and tickets. Built with React, TypeScript, Material UI, and offline-first capabilities.

## Features

- 🔐 **Authentication**: JWT-based auth with token refresh
- 📊 **Dashboard**: KPI cards and charts
- 👥 **User Management**: CRUD operations with optimistic updates
- 📦 **Order Management**: Status transitions and filtering
- 🎫 **Ticket System**: Comments, status updates, offline queue
- 🎨 **Theming**: Light/Dark/System mode
- 🌐 **i18n Ready**: Multi-language support structure
- 📱 **PWA**: Installable, offline-capable, background sync
- 🔔 **Push Notifications**: Web Push API support
- 🐳 **Docker Ready**: Nginx configs for HTTP and HTTPS

## Tech Stack

- **Build**: Vite 5, TypeScript 5
- **UI**: React 18, Material UI 5, React Router 6
- **State**: React Query, Zustand
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios with interceptors
- **PWA**: vite-plugin-pwa (Workbox)
- **Storage**: IndexedDB (idb)
- **Charts**: Chart.js
- **Testing**: Vitest, Playwright, Testing Library

## Quick Start

### Prerequisites

- Node.js 20+ (LTS)
- pnpm 8+ (or npm)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd staff-admin-pwa

# Install dependencies
pnpm install

# Generate PWA icons (optional, placeholders included)
pnpm generate:icons

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

### Default Login Credentials (Mock Mode)

```
Email: admin@example.com
Password: password
```

## Development

```bash
# Start dev server with hot reload
pnpm dev

# Enable mock API (MSW)
VITE_ENABLE_MOCKS=true pnpm dev

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format code
pnpm format

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

## Build

```bash
# Build for development
pnpm build:dev

# Build for staging
pnpm build:staging

# Build for production
pnpm build:production

# Or generic build (uses .env)
pnpm build
```

Build output will be in `dist/`

## Preview

```bash
# Preview production build
pnpm preview
```

Available at `http://localhost:4173`

## Local Hosting Options

### 1. Vite Preview (Quick)

```bash
pnpm preview
# Visit http://localhost:4173
```

### 2. Node Static Server

```bash
pnpm build
npx serve dist -s -p 8080
# Visit http://localhost:8080
```

### 3. Docker + Nginx (HTTP)

```bash
pnpm build
docker compose up --build
# Visit http://localhost:8080
```

Or use Makefile:

```bash
make docker-up
```

### 4. Docker + Nginx (HTTPS with mkcert)

First, generate local TLS certificates:

```bash
# Install mkcert (one-time)
# macOS: brew install mkcert
# Linux/Windows: see https://github.com/FiloSottile/mkcert

# Generate certificates
bash scripts/mkcert.sh

# Add to /etc/hosts:
# 127.0.0.1  admin.local
```

Then start HTTPS server:

```bash
pnpm build
docker compose -f docker-compose.ssl.yml up --build
# Visit https://admin.local:8443
```

Or use Makefile:

```bash
make docker-ssl-up
```

## Environment Variables

Create `.env.local` for local overrides:

```bash
# API endpoint
VITE_API_BASE_URL=http://localhost:8081

# Enable mock API in development
VITE_ENABLE_MOCKS=true

# Disable PWA in development
VITE_PWA_DISABLED=true

# Web Push public key
VITE_PUSH_PUBLIC_KEY=your-vapid-public-key
```

For production builds, set:

```bash
VITE_API_BASE_URL=https://api.example.com
VITE_ENABLE_MOCKS=false
VITE_PWA_DISABLED=false
```

## PWA Features

### Service Worker

Automatically registered in production builds. Handles:

- App shell precaching
- Runtime caching (API, static assets, images)
- Offline fallback (`/offline.html`)
- Background sync for write operations

### Install Prompt

The app shows an "Install as App" option in Settings when installable.

### Offline Support

- Network state detection
- Offline indicator with retry action
- Background sync queue for POST/PUT/PATCH requests
- IndexedDB caching for GET requests

### Testing PWA Locally

1. Build for production: `pnpm build`
2. Preview: `pnpm preview`
3. Open DevTools → Application → Service Workers
4. Test offline: Network tab → Offline checkbox

Note: Service workers only work on `localhost` or HTTPS. For LAN testing on hostname/IP, use mkcert for HTTPS.

## Testing

### Unit Tests

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### E2E Tests

```bash
# Build first
pnpm build

# Run all E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui
```

Tests include:
- Login flow
- User CRUD operations
- Offline mode behavior

## Deployment

### Using GitHub Actions

Push a tag to trigger release workflow:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will:
1. Build production bundle
2. Run tests
3. Create GitHub release with `dist.zip` artifact
4. (Optional) Build and publish Docker image to GHCR

### Manual Deployment

1. Build: `pnpm build:production`
2. Upload `dist/` to your static host or CDN
3. Configure server:
   - SPA fallback (serve `index.html` for all routes)
   - Caching headers (see `deploy/nginx/nginx.conf`)
   - CSP headers

### Environment-Specific Builds

```bash
# Development
pnpm build:dev

# Staging
pnpm build:staging

# Production
pnpm build:production
```

Each uses corresponding `.env.<mode>` file.

## Project Structure

```
staff-admin-pwa/
├── src/
│   ├── api/              # API clients and DTOs
│   ├── components/       # React components
│   ├── features/         # Feature modules
│   ├── hooks/            # React Query hooks
│   ├── i18n/             # Internationalization
│   ├── lib/              # Utilities (auth, storage, sync)
│   ├── mocks/            # MSW mock handlers
│   ├── pages/            # Route pages
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types + Zod schemas
│   ├── workers/          # Service worker registration
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static assets
│   ├── assets/           # Icons, images
│   ├── offline.html      # Offline fallback page
│   └── robots.txt
├── deploy/               # Deployment configs
│   └── nginx/            # Nginx configs
├── scripts/              # Build scripts
├── tests/                # E2E tests
├── .github/workflows/    # CI/CD pipelines
├── docker-compose.yml    # Docker Compose (HTTP)
├── docker-compose.ssl.yml # Docker Compose (HTTPS)
├── Makefile              # Common commands
└── vite.config.ts        # Vite configuration
```

## CI/CD

### Required Secrets (GitHub Actions)

| Secret | Description | Required For |
|--------|-------------|--------------|
| `API_BASE_URL` | Production API URL | Release builds |
| `VAPID_PUBLIC_KEY` | Web Push public key | Push notifications |
| `PUBLISH_DOCKER` | Set to `true` to publish Docker image | Docker publish |
| `GHCR_TOKEN` | GitHub Container Registry token | Docker publish |

### Workflows

- **CI** (`.github/workflows/ci.yml`): Runs on PRs and pushes
  - Lint, type check, unit tests
  - Build
  - E2E tests
  
- **Release** (`.github/workflows/release.yml`): Runs on tag push
  - Build production bundle
  - Create GitHub release with `dist.zip`
  - (Optional) Publish Docker image to GHCR

## Troubleshooting

### Build fails with "VITE_API_BASE_URL is required"

Set the environment variable:

```bash
export VITE_API_BASE_URL=http://localhost:8081
pnpm build
```

### Service worker not registering

- Ensure you're on `localhost` or HTTPS
- Check DevTools → Application → Service Workers
- Verify `VITE_PWA_DISABLED` is not set to `true`

### E2E tests fail

Ensure preview server is running:

```bash
pnpm build
pnpm preview &
pnpm test:e2e
```

### Icons not generating

Install dependencies and run:

```bash
pnpm install
pnpm generate:icons
```

### HTTPS not working with mkcert

1. Install mkcert: https://github.com/FiloSottile/mkcert
2. Run `bash scripts/mkcert.sh`
3. Add `127.0.0.1 admin.local` to `/etc/hosts`
4. Trust the certificate (mkcert handles this automatically)

## License

Apache-2.0

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

For issues and feature requests, please open an issue on GitHub.
