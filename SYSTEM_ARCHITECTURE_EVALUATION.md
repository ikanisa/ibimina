# SACCO+ System Architecture Evaluation

## Executive Summary

The Ibimina/SACCO+ system comprises three distinct applications designed to
serve different user groups and operational needs:

1. **Staff/Admin App** (`apps/admin`) - Main staff console for SACCO operations
2. **Client App** (`apps/client`) - Member-facing Progressive Web App (PWA)
3. **Platform API** (`apps/platform-api`) - Backend workers and cron jobs

This document evaluates the current system structure, access patterns,
interlinking, and identifies gaps/issues that need to be addressed.

## System Overview

### Technology Stack

- **Frontend Framework**: Next.js (Admin: v16.0.0, Client: v15.5.4)
- **Package Manager**: pnpm v10.19.0 (monorepo workspace)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Runtime**: Node.js >= 18.18.0
- **Build Tool**: TypeScript 5.9.3

## Application Analysis

### 1. Staff/Admin App (`apps/admin`)

#### Purpose

Primary staff-facing application for SACCO operations management, including
member management, payment processing, reconciliation, and reporting.

#### Key Characteristics

- **Port**: 3000 (default)
- **Package**: `@ibimina/admin` v0.1.2
- **Framework**: Next.js 16.0.0 with App Router
- **PWA**: Yes (with service worker)
- **Auth**: Supabase + MFA (TOTP, Passkeys, Email OTP, Backup codes)

#### Routes Structure

```
/                           # Root redirect
/(auth)/                    # Authentication flows
  - /login                  # Staff login
  - /mfa                    # Multi-factor authentication
  - /setup-mfa              # MFA enrollment
/(main)/                    # Protected routes (requires auth + MFA)
  - /dashboard              # Main dashboard
  - /ikimina/               # Group savings management
  - /members/               # Member management
  - /payments/              # Payment processing
  - /reconciliation/        # Payment reconciliation
  - /reports/               # Reporting interface
  - /admin/(panel)/         # System admin features
    - /overview
    - /saccos
    - /staff
    - /members
    - /groups
    - /payments
    - /reconciliation
    - /reports
    - /audit
    - /notifications
    - /feature-flags
    - /settings
    - /ocr
    - /approvals
/offline                    # Offline fallback page
```

#### Features

- Multi-factor authentication (MFA)
- Role-based access control (RBAC)
- Semantic SACCO search
- Real-time data subscriptions
- Offline-first capabilities
- Bilingual interface (English, Kinyarwanda, French)
- Advanced security (CSP, HSTS, rate limiting)
- Audit logging

#### Security

- Content Security Policy (CSP) with nonce
- HTTP Strict Transport Security (HSTS)
- Rate limiting on auth endpoints
- Trusted device management
- Session-based MFA validation
- End-to-end encryption for PII (AES-256-GCM)

#### Dependencies

- Key shared packages: `@ibimina/config`, `@ibimina/ui`
- Supabase SSR (`@supabase/ssr`, `@supabase/supabase-js`)
- WebAuthn support (`@simplewebauthn/browser`, `@simplewebauthn/server`)
- React Table (`@tanstack/react-table`)
- Framer Motion (animations)

---

### 2. Client App (`apps/client`)

#### Purpose

Member-facing Progressive Web App (PWA) for SACCO members to onboard, view
groups, make payments, and manage their profile.

#### Key Characteristics

- **Port**: 3001
- **Package**: `@ibimina/client` v0.1.0
- **Framework**: Next.js 15.5.4 with App Router
- **PWA**: Yes (mobile-first, installable)
- **Auth**: Supabase (simplified, no MFA)

#### Routes Structure

```
/                           # Home dashboard
/(auth)/                    # Auth flows
  - /welcome                # Welcome/onboarding intro
  - /onboard                # Member onboarding form
/groups                     # Group explorer
  - /[id]                   # Group details
    - /members              # Group member list (guarded)
/pay-sheet                  # USSD payment instructions
/offline                    # Offline fallback
```

#### Features

- Mobile-first design
- Member onboarding (WhatsApp, Mobile Money)
- Identity document upload (OCR stub)
- Group (Ikimina) discovery
- USSD payment instructions
- Web Push notifications (planned)
- PWA installable on mobile devices
- Offline support

#### Mobile Readiness

- ✅ Responsive design (mobile-first)
- ✅ PWA manifest configured
- ✅ Service worker for offline support
- ✅ Touch-friendly UI (tap targets ≥48px)
- ✅ Installable on Android/iOS
- ✅ Bottom navigation for one-thumb access
- ⚠️ TWA (Trusted Web Activity) configuration documented but not verified

#### Security

- Simplified CSP (less strict than admin)
- Supabase Row-Level Security (RLS)
- HTTPS required (for service worker)
- Session-based auth (no MFA)

#### Dependencies

- Key shared packages: `@ibimina/config`, `@ibimina/lib`, `@ibimina/ui`
- Supabase SSR
- Web Push (`web-push`)
- Service worker (Workbox)

---

### 3. Platform API (`apps/platform-api`)

#### Purpose

Backend services for scheduled jobs, workers, and business logic that doesn't
belong in frontend apps.

#### Key Characteristics

- **Port**: N/A (worker processes, not HTTP server)
- **Package**: `@ibimina/platform-api` v0.0.0
- **Type**: Node.js workers/cron jobs
- **Runtime**: ts-node-esm

#### Structure

```
src/
  - index.ts              # Main entry point
  - lib/                  # Shared utilities
  - workers/
    - momo-poller.ts      # Mobile Money polling worker
    - gsm-heartbeat.ts    # GSM modem heartbeat monitor
```

#### Workers

1. **Mobile Money Poller** (`momo-poller`)
   - Polls Mobile Money APIs for payment updates
   - Reconciles transactions with SACCO records
2. **GSM Heartbeat** (`gsm-heartbeat`)
   - Monitors GSM modem health
   - Ensures SMS gateway connectivity

#### Features

- Scheduled job execution
- Integration with Supabase
- Worker process management
- Background task processing

#### Current Status

- ⚠️ Minimal implementation (placeholder)
- ⚠️ No HTTP endpoints
- ⚠️ Limited documentation
- ⚠️ No production deployment strategy

---

## Shared Packages

The monorepo includes shared packages for code reuse:

### `@ibimina/config`

- Runtime configuration loader
- Environment variable validation
- Type-safe config access

### `@ibimina/core`

- Shared domain models
- Supabase helper functions
- Business logic utilities

### `@ibimina/ui`

- Shared UI components
- Design system tokens
- Reusable React components

### `@ibimina/lib`

- Utility functions
- Security helpers (headers, CSP)
- Common libraries

### `@ibimina/testing`

- Playwright utilities
- Vitest helpers
- Test fixtures

---

## App Interlinking

### 1. Database (Supabase)

All three apps connect to the same Supabase project:

- **Admin App**: Uses service role key for elevated privileges
- **Client App**: Uses anon key with RLS
- **Platform API**: Uses service role key

**Configuration**:

- `NEXT_PUBLIC_SUPABASE_URL` (shared across all apps)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend apps)
- `SUPABASE_SERVICE_ROLE_KEY` (backend operations)

### 2. Shared Authentication

- Both frontend apps use Supabase Auth
- Admin requires MFA, Client does not
- Session cookies are managed independently
- No cross-app session sharing

### 3. Data Isolation

- Admin staff see all SACCOs they're assigned to
- Client members see only their own data (via RLS)
- Platform API operates with elevated privileges

### 4. Communication Patterns

#### Current State:

- ❌ No direct app-to-app communication
- ✅ All apps communicate via Supabase database
- ✅ Real-time updates via Supabase subscriptions
- ❌ No API gateway or service mesh

#### Data Flow:

```
Admin App ──┐
            ├──> Supabase (Database, Auth, Storage) <──┐
Client App ─┘                                          │
                                                       │
Platform API ──────> Supabase Edge Functions ─────────┘
```

---

## Identified Gaps and Issues

### Critical Issues

#### 1. Platform API Incomplete

- **Gap**: Platform API is a placeholder with minimal implementation
- **Impact**: No automated background jobs running
- **Recommendation**: Complete MoMo poller and GSM heartbeat workers
- **Priority**: HIGH

#### 2. No API Gateway

- **Gap**: No centralized API for cross-app communication
- **Impact**: Apps can't communicate directly, must use database
- **Recommendation**: Consider implementing API gateway or use Supabase Edge
  Functions
- **Priority**: MEDIUM

#### 3. Client App Onboarding Flow Incomplete

- **Gap**: OCR upload is a stub implementation
- **Impact**: Members can't complete identity verification
- **Recommendation**: Integrate real OCR service (Google Vision, AWS Textract)
- **Recommendation**: Implement file storage (Supabase Storage)
- **Priority**: HIGH

#### 4. Duplicate Auth Stacks

- **Gap**: Admin app has both legacy `/api/mfa/*` and new `/api/authx/*`
  endpoints
- **Impact**: Inconsistent auth behavior, security risk
- **Recommendation**: Consolidate to single auth implementation
- **Priority**: HIGH

### High Priority Issues

#### 5. Mobile App Verification Missing

- **Gap**: Client app lacks TWA/mobile app testing
- **Impact**: Unknown if app works properly as installed mobile app
- **Recommendation**: Test on Android (TWA) and iOS (PWA)
- **Recommendation**: Verify install prompts, splash screens, navigation
- **Priority**: HIGH

#### 6. No Cross-App Monitoring

- **Gap**: No unified observability across all three apps
- **Impact**: Hard to troubleshoot issues spanning multiple apps
- **Recommendation**: Implement centralized logging (Grafana Loki)
- **Recommendation**: Add distributed tracing (OpenTelemetry)
- **Priority**: MEDIUM

#### 7. Deployment Strategy Unclear

- **Gap**: No documented deployment architecture
- **Impact**: Unclear how to deploy all three apps in production
- **Recommendation**: Document deployment topology
- **Recommendation**: Create Docker Compose or Kubernetes manifests
- **Priority**: HIGH

#### 8. Environment Configuration Scattered

- **Gap**: Each app has separate `.env` files with overlapping vars
- **Impact**: Configuration drift, potential security issues
- **Recommendation**: Centralize shared config in root `.env`
- **Recommendation**: Use app-specific `.env.local` only for overrides
- **Priority**: MEDIUM

### Medium Priority Issues

#### 9. Client App Feature Parity

- **Gap**: Client app missing features mentioned in implementation guide:
  - SACCO search and linking
  - Join request workflow
  - Invite acceptance
  - Notifications UI
- **Impact**: Incomplete member experience
- **Recommendation**: Complete Sprint 2-4 features from implementation guide
- **Priority**: MEDIUM

#### 10. No Rate Limiting in Client App

- **Gap**: Client app endpoints lack rate limiting
- **Impact**: Vulnerable to abuse
- **Recommendation**: Implement rate limiting middleware
- **Priority**: MEDIUM

#### 11. Platform API Testing Gap

- **Gap**: No E2E tests for worker processes
- **Impact**: Unknown if workers function correctly
- **Recommendation**: Add integration tests for workers
- **Priority**: MEDIUM

#### 12. Shared Packages Underutilized

- **Gap**: Client app re-implements some utilities instead of using shared
  packages
- **Impact**: Code duplication, maintenance burden
- **Recommendation**: Move common code to shared packages
- **Priority**: LOW

### Low Priority Issues

#### 13. Documentation Scattered

- **Gap**: Architecture docs spread across multiple files
- **Impact**: Hard to get holistic system understanding
- **Recommendation**: Consolidate into single architecture document
- **Priority**: LOW (this document addresses it)

#### 14. No Service Discovery

- **Gap**: Apps hardcode Supabase URLs
- **Impact**: Harder to switch environments
- **Recommendation**: Use environment-based service discovery
- **Priority**: LOW

---

## Access Patterns Analysis

### Admin App Access

- **Who**: SACCO staff, system administrators
- **How**: Web browser (desktop/mobile)
- **Auth**: Email/password + MFA (TOTP/Passkeys)
- **Network**: Public internet (with HTTPS)
- **Data Scope**: All SACCOs assigned to staff member

### Client App Access

- **Who**: SACCO members (general public)
- **How**: Mobile browser (PWA) or installed app
- **Auth**: Email/password (simplified)
- **Network**: Public internet (with HTTPS), offline-capable
- **Data Scope**: Only member's own data (RLS enforced)

### Platform API Access

- **Who**: System (automated processes)
- **How**: Scheduled cron jobs, worker processes
- **Auth**: Service role key (elevated privileges)
- **Network**: Internal network or VPN (recommended)
- **Data Scope**: Full database access (careful coding required)

---

## Recommendations

### Immediate Actions

1. **Complete Platform API Implementation**
   - Implement MoMo poller with error handling
   - Implement GSM heartbeat with alerting
   - Add worker health checks
   - Document deployment requirements

2. **Fix Client App OCR Flow**
   - Integrate real OCR service
   - Implement file upload to Supabase Storage
   - Add validation and error handling
   - Update member profile with extracted data

3. **Consolidate Admin Auth**
   - Remove duplicate auth endpoints
   - Standardize on AuthX or legacy MFA (choose one)
   - Update all auth flows to use single implementation
   - Test thoroughly

4. **Mobile App Testing**
   - Test client app on Android devices (TWA)
   - Test client app on iOS devices (PWA)
   - Verify install prompts and splash screens
   - Test offline functionality
   - Document device compatibility

5. **Create Deployment Guide**
   - Document how to deploy each app
   - Provide Docker Compose configuration
   - Include environment variable reference
   - Add health check endpoints

### Short-Term Improvements

6. **Implement API Gateway** (optional)
   - Consider using Supabase Edge Functions as API layer
   - Or implement lightweight API gateway (Kong, Traefik)
   - Centralize cross-cutting concerns (auth, logging, rate limiting)

7. **Centralize Configuration**
   - Create root `.env.example` with all shared variables
   - Document which vars are required per app
   - Use config package for type-safe access

8. **Add Monitoring and Alerting**
   - Implement centralized logging
   - Add application metrics
   - Set up health checks for all apps
   - Configure alerting for critical issues

9. **Complete Client App Features**
   - Implement SACCO search and linking
   - Add join request workflow
   - Implement invite acceptance
   - Build notifications UI

### Long-Term Enhancements

10. **Consider Native Mobile Apps**
    - Evaluate React Native or Flutter for native experience
    - If PWA proves insufficient for member needs
    - Would provide better platform integration

11. **Implement Service Mesh** (for scale)
    - If system grows beyond 3 apps
    - Use Istio or Linkerd for service-to-service communication
    - Provides advanced traffic management and observability

12. **Add E2E Integration Tests**
    - Test flows spanning multiple apps
    - Ensure data consistency across apps
    - Verify auth and authorization boundaries

---

## Conclusion

The Ibimina/SACCO+ system has a solid foundation with three distinct apps
serving different user groups. The main gaps are:

1. **Platform API is incomplete** - needs worker implementation
2. **Client app onboarding flow is incomplete** - OCR is stub
3. **Admin app has duplicate auth stacks** - needs consolidation
4. **Mobile readiness is unverified** - needs testing
5. **Deployment architecture is unclear** - needs documentation

Addressing these gaps will result in a production-ready system that:

- Separates concerns appropriately across apps
- Provides secure, role-based access to different user groups
- Supports both staff operations and member self-service
- Runs automated background jobs reliably
- Works seamlessly on mobile devices

The interlinking via Supabase is appropriate for the current scale, though an
API gateway may be beneficial as the system grows.
