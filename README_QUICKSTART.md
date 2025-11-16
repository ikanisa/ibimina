# Ibimina - Quick Start Guide

> SACCO+ Digital Platform for Rwanda's Umurenge SACCOs

## ⚡ Quick Start (5 minutes)

### Prerequisites

- Node.js 20.x
- pnpm 10.x
- PostgreSQL (for RLS tests)

### Installation

```bash
# Clone
git clone https://github.com/your-org/ibimina.git
cd ibimina

# Install dependencies
pnpm install

# Setup environment
cp apps/pwa/staff-admin/.env.example apps/pwa/staff-admin/.env.local
# Edit .env.local with your Supabase credentials

# Build packages
pnpm --filter './packages/**' build

# Start dev server
pnpm dev
```

Visit: http://localhost:3100

## 📦 Repository Structure

```
ibimina/
├── apps/
│   ├── pwa/
│   │   ├── staff-admin/    # Staff console (Next.js 15)
│   │   └── client/         # Member PWA
│   ├── mobile/             # Native apps (Android/iOS)
│   └── website/            # Marketing site
├── packages/               # Shared packages
│   ├── lib/               # Core utilities
│   ├── ui/                # Design system
│   ├── config/            # Configuration
│   └── ...
└── supabase/              # Database & Edge Functions
```

## 🚀 Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build all packages
pnpm test                   # Run tests

# Quality
pnpm lint                   # Lint code
pnpm typecheck              # Type check
pnpm format                 # Format code

# Testing
pnpm test:unit              # Unit tests
pnpm test:auth              # Auth tests
pnpm test:rls               # Database policies
pnpm test:e2e               # E2E tests

# Deployment
pnpm check:deploy           # Full validation
```

## 🔧 Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript 5
- **Styling:** Tailwind CSS v3
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Mobile:** Capacitor (Android/iOS)
- **Monorepo:** pnpm workspaces

## 📚 Documentation

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Cleanup Success Report](./CLEANUP_SUCCESS_REPORT.md)
- [Architecture](./ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)

## 🎯 Recent Updates (2025-11-14)

### ✅ Comprehensive Cleanup Complete

- Fixed Tailwind CSS v4→v3 (stability)
- Unified React 19 across all apps
- Archived 140 old docs
- Build validated successfully
- Repository cleaned & organized

### ✅ Production Ready

- ✅ Build succeeds
- ✅ Dependencies consistent
- ✅ TypeScript validated
- ✅ Tests passing
- ✅ Documentation complete

## 🐛 Troubleshooting

### Dev server won't start

```bash
# Clean and restart
rm -rf apps/pwa/staff-admin/.next
rm -rf node_modules
pnpm install
pnpm dev
```

### Build fails

```bash
# Check environment variables
cat apps/pwa/staff-admin/.env.local

# Rebuild packages
pnpm --filter './packages/**' build
```

## 📞 Support

- **Issues:** GitHub Issues
- **Docs:** `/docs` directory
- **Security:** See SECURITY.md

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** 2025-11-14
