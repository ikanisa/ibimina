# Ibimina System Architecture

This document provides a comprehensive overview of the Ibimina SACCO Management Platform architecture.

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [System Components](#system-components)
3. [Data Flow](#data-flow)
4. [Security Architecture](#security-architecture)
5. [Deployment Architecture](#deployment-architecture)
6. [Technology Stack](#technology-stack)
7. [Integration Points](#integration-points)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Member     │    │    Staff     │    │   District   │              │
│  │  Client PWA  │    │  Admin PWA   │    │  Dashboard   │              │
│  │  (Next.js)   │    │  (Next.js)   │    │  (Next.js)   │              │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
│         │                   │                   │                        │
│  ┌──────▼───────┐    ┌──────▼───────┐                                   │
│  │ Android App  │    │  iOS App     │                                   │
│  │ (Capacitor)  │    │ (Capacitor)  │                                   │
│  └──────────────┘    └──────────────┘                                   │
│                                                                           │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │
                      │ HTTPS / WSS
                      │
┌─────────────────────▼───────────────────────────────────────────────────┐
│                          API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Next.js API Routes (Node.js 20)                    │   │
│  │                                                                   │   │
│  │  • Authentication     • Member Management    • Reports           │   │
│  │  • Group Operations   • Payment Processing   • Admin APIs        │   │
│  │  • OCR Upload        • Push Notifications    • Feature Flags     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │           Supabase Edge Functions (Deno Runtime)                 │   │
│  │                                                                   │   │
│  │  • WhatsApp OTP       • SMS Parsing          • Reconciliation    │   │
│  │  • Email Dispatch     • Analytics Forecast   • Scheduled Jobs    │   │
│  │  • Push Notifications • Report Export        • Payment Settlement│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │
                      │ PostgreSQL Protocol
                      │
┌─────────────────────▼───────────────────────────────────────────────────┐
│                          DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Supabase PostgreSQL 15 Database                     │   │
│  │                                                                   │   │
│  │  • Row-Level Security (RLS)      • Stored Procedures             │   │
│  │  • Multi-tenant isolation         • Triggers & Functions         │   │
│  │  • Real-time subscriptions        • Full-text search             │   │
│  │  • JSON/JSONB support            • pg_cron for scheduling        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   Supabase Storage                               │   │
│  │  • Document uploads    • Identity documents    • Reports (PDF)   │   │
│  │  • Member photos       • Export files          • Attachments     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │
                      │ External Integrations
                      │
┌─────────────────────▼───────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ WhatsApp     │  │  Email       │  │  Push        │                 │
│  │ Business API │  │  Service     │  │  Notifications│                 │
│  │ (Meta)       │  │  (Resend)    │  │  (Firebase)  │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ SMS Gateway  │  │  Analytics   │  │  Monitoring  │                 │
│  │ (Telco APIs) │  │  (PostHog)   │  │  (Sentry)    │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## System Components

### 1. Client Applications

#### Member Client PWA (apps/client)
- **Technology**: Next.js 15 (App Router), React 19, TypeScript
- **Purpose**: Member-facing Progressive Web App
- **Features**:
  - Group savings (ibimina) management
  - USSD payment instructions
  - Transaction history and statements
  - Loan applications
  - Wallet/token management
  - AI-powered support chat
- **Offline Support**: Service Worker with cache-first strategy
- **Mobile Apps**: Wrapped with Capacitor for Android/iOS

#### Staff Admin PWA (apps/admin)
- **Technology**: Next.js 15 (App Router), React 19, TypeScript
- **Purpose**: Staff operations and SACCO management
- **Features**:
  - Member and group management
  - Payment reconciliation
  - SMS ingestion and allocation
  - Reports and analytics
  - Staff user management
  - Multi-factor authentication (MFA)
- **Security**: Passkey authentication, device trust, session management

### 2. API Layer

#### Next.js API Routes
- **Runtime**: Node.js 20
- **Location**: `apps/{client,admin}/app/api/`
- **Authentication**: Supabase JWT + session cookies
- **Key Routes**:
  - `/api/groups/*` - Group operations
  - `/api/loans/*` - Loan management
  - `/api/admin/*` - Admin operations
  - `/api/push/*` - Push notification subscriptions

#### Supabase Edge Functions
- **Runtime**: Deno
- **Location**: `supabase/functions/`
- **Deployment**: Supabase serverless platform
- **Key Functions** (47+ total):
  - `whatsapp-send-otp` - WhatsApp OTP dispatch
  - `parse-sms` - Mobile money SMS parsing
  - `reconcile` - Payment reconciliation
  - `analytics-forecast` - Predictive analytics
  - `send-push-notification` - Push message dispatch

### 3. Data Layer

#### PostgreSQL Database
- **Version**: PostgreSQL 15
- **Provider**: Supabase
- **Key Features**:
  - Row-Level Security (RLS) for multi-tenancy
  - 40+ database migrations
  - JSON/JSONB for flexible schemas
  - Full-text search for member lookup
  - pg_cron for scheduled tasks

#### Core Tables
```sql
-- Organization hierarchy
- countries
- organizations (SACCOs, MFIs)
- districts, sectors, cells

-- Members and groups
- members
- groups (ibimina)
- group_members

-- Financial operations
- allocations (payment to member mapping)
- reference_tokens (USSD reference codes)
- transactions

-- Staff and access control
- staff
- staff_roles
- audit_logs

-- Features
- loans, loan_applications
- wallet_tokens
- support_tickets
```

#### Supabase Storage
- **Buckets**:
  - `documents` - Identity verification uploads
  - `reports` - Generated PDF reports
  - `attachments` - Support ticket attachments
  - `member-photos` - Profile pictures

### 4. External Services

#### Authentication & Communication
- **Meta WhatsApp Business API**: OTP delivery
- **Resend**: Transactional email
- **Firebase Cloud Messaging**: Push notifications

#### Observability & Analytics
- **Sentry**: Error tracking and performance monitoring
- **PostHog**: Product analytics and feature flags
- **Prometheus + Grafana**: Infrastructure metrics

## Data Flow

### 1. Member Payment Flow

```
Member → USSD Dial (tel:*###*CODE#) → Mobile Money (MTN/Airtel)
                                            ↓
                                  SMS Confirmation
                                            ↓
                            Android SMS Listener (opt-in)
                                            ↓
                            POST /ingest-sms (Edge Function)
                                            ↓
                            Parse SMS → Extract Details
                                            ↓
                        Match Reference Token → Allocate
                                            ↓
                          Update allocations table
                                            ↓
                      Real-time notification → Member + Staff
```

### 2. Authentication Flow (WhatsApp OTP)

```
Member → Enter Phone → POST /whatsapp-send-otp
                              ↓
                    Generate 6-digit OTP
                              ↓
                Store in DB (hashed, 5-min TTL)
                              ↓
                Send via WhatsApp Business API
                              ↓
Member receives OTP → POST /whatsapp-verify-otp
                              ↓
                    Verify code + create session
                              ↓
                Return JWT token + refresh token
                              ↓
Member authenticated → Access app features
```

### 3. Reconciliation Flow

```
Staff → Trigger Reconciliation → POST /reconcile (Edge Function)
                                        ↓
                            Load SMS messages (unprocessed)
                                        ↓
                              Parse each SMS
                                        ↓
                    Match to reference tokens or merchant codes
                                        ↓
                Create allocation records (group + member)
                                        ↓
            Update transaction statuses (pending → confirmed)
                                        ↓
        Generate exceptions report (unmatched payments)
                                        ↓
            Notify staff → Review exceptions manually
```

## Security Architecture

### 1. Authentication Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Stack                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Identity Verification                             │
│  ├─ WhatsApp OTP (primary)                                  │
│  ├─ Email OTP (fallback)                                    │
│  └─ QR Code (web-to-mobile handoff)                         │
│                                                               │
│  Layer 2: Session Management                                │
│  ├─ JWT tokens (access + refresh)                           │
│  ├─ HTTP-only secure cookies                                │
│  ├─ Token rotation on refresh                               │
│  └─ Session TTL: 30 days                                    │
│                                                               │
│  Layer 3: Multi-Factor Authentication (Staff)               │
│  ├─ Passkeys (WebAuthn)                                     │
│  ├─ TOTP (Time-based OTP)                                   │
│  ├─ Backup codes (recovery)                                 │
│  └─ Device trust (cookie-based)                             │
│                                                               │
│  Layer 4: Authorization                                     │
│  ├─ Row-Level Security (RLS) policies                       │
│  ├─ Role-based access control (RBAC)                        │
│  └─ Organization-scoped access                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2. Data Security

#### Encryption at Rest
- **Database**: All Supabase data encrypted with AES-256
- **PII Fields**: Additional encryption with `KMS_DATA_KEY_BASE64`
- **Storage**: Files encrypted by default

#### Encryption in Transit
- **TLS 1.3**: All API communication
- **Certificate Pinning**: Mobile apps (optional)
- **HTTPS-only**: Enforced via HSTS headers

#### Secrets Management
```
Environment Variables (never committed):
├─ SUPABASE_SERVICE_ROLE_KEY (server-only)
├─ KMS_DATA_KEY_BASE64 (encryption)
├─ HMAC_SHARED_SECRET (webhook verification)
├─ MFA_SESSION_SECRET (session signing)
└─ BACKUP_PEPPER (password hashing)
```

### 3. Row-Level Security (RLS)

Example RLS policies:

```sql
-- Members can only see their own data
CREATE POLICY "members_own_data" ON members
  FOR SELECT USING (auth.uid() = user_id);

-- Staff can see data for their SACCO only
CREATE POLICY "staff_sacco_access" ON groups
  FOR ALL USING (
    organization_id IN (
      SELECT org_id FROM staff
      WHERE user_id = auth.uid()
    )
  );

-- Admins have cross-SACCO access
CREATE POLICY "admin_full_access" ON allocations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

## Deployment Architecture

### Production Environment

```
┌────────────────────────────────────────────────────────────────┐
│                     Cloudflare (CDN + DDoS)                    │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     │ HTTPS
                     │
┌────────────────────▼───────────────────────────────────────────┐
│                  Vercel / Cloudflare Pages                     │
│                                                                 │
│  ┌──────────────┐        ┌──────────────┐                     │
│  │ Client PWA   │        │ Admin PWA    │                     │
│  │ (Edge)       │        │ (Edge)       │                     │
│  └──────────────┘        └──────────────┘                     │
│                                                                 │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     │ API Calls
                     │
┌────────────────────▼───────────────────────────────────────────┐
│                    Supabase (Managed)                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ PostgreSQL 15 (Primary + Read Replicas)                  │ │
│  │ - Automatic backups (daily)                              │ │
│  │ - Point-in-time recovery (7 days)                        │ │
│  │ - Connection pooling (PgBouncer)                         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Edge Functions (Deno Deploy)                              │ │
│  │ - Auto-scaling                                            │ │
│  │ - Global distribution                                     │ │
│  │ - Cold start < 50ms                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Storage (S3-compatible)                                   │ │
│  │ - Multi-region replication                                │ │
│  │ - CDN-backed                                              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Logs                          │
│  ├─ Next.js API Routes → Structured JSON logging            │
│  ├─ Edge Functions → Deno logger                            │
│  └─ Database → PostgreSQL logs                              │
│                       ↓                                      │
│                 Log Aggregation                              │
│  ├─ Sentry (errors + traces)                                │
│  └─ Custom log drain (optional)                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Metrics & Alerts                         │
│  ├─ Prometheus (system metrics)                             │
│  ├─ Grafana (dashboards)                                    │
│  ├─ PostHog (product analytics)                             │
│  └─ Supabase Studio (database stats)                        │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15.x | React framework with App Router |
| UI Library | React | 19.x | Component-based UI |
| Language | TypeScript | 5.9 | Type-safe development |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Animation | Framer Motion | 11.x | Smooth transitions |
| State | Zustand | 5.x | Lightweight state management |
| Forms | React Hook Form | 7.x | Form validation |

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| API Runtime | Node.js | 20.x | Next.js API routes |
| Edge Runtime | Deno | 1.x | Supabase Edge Functions |
| Database | PostgreSQL | 15.x | Primary datastore |
| ORM | Supabase Client | 2.x | Type-safe DB access |
| Authentication | Supabase Auth | 2.x | User management |
| Storage | Supabase Storage | 2.x | File uploads |

### Mobile

| Platform | Technology | Purpose |
|----------|-----------|---------|
| iOS/Android | Capacitor | 7.x | Native wrapper |
| iOS | Swift | 5.x | Platform-specific features |
| Android | Kotlin | 1.9 | Platform-specific features |

### Infrastructure

| Service | Provider | Purpose |
|---------|----------|---------|
| Hosting | Vercel / Cloudflare Pages | Web app deployment |
| Database | Supabase | Managed PostgreSQL |
| Edge Functions | Supabase / Deno Deploy | Serverless compute |
| CDN | Cloudflare | Global content delivery |
| Storage | Supabase Storage | File hosting |
| Monitoring | Sentry | Error tracking |
| Analytics | PostHog | Product analytics |

## Integration Points

### 1. Mobile Money Integration

**Current**: Manual SMS ingestion (Android SMS Listener)

**Future Roadmap**:
- MTN Mobile Money API (direct integration)
- Airtel Money API (direct integration)
- Real-time webhook notifications

### 2. WhatsApp Business API

**Provider**: Meta Business Platform

**Usage**:
- OTP delivery (authentication)
- Payment confirmations
- Group notifications
- Support messages

**Configuration**:
```typescript
{
  accessToken: META_WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: META_WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: META_WHATSAPP_BUSINESS_ACCOUNT_ID,
  webhookVerifyToken: META_WHATSAPP_VERIFY_TOKEN
}
```

### 3. Email Service

**Provider**: Resend

**Usage**:
- MFA email verification
- Password reset
- Transactional notifications
- Reports delivery

### 4. Analytics & Observability

**PostHog**:
- User behavior tracking
- Feature flag management
- A/B testing
- Funnel analysis

**Sentry**:
- Error tracking
- Performance monitoring
- Release health
- User feedback

## Scalability Considerations

### Database Optimization

1. **Connection Pooling**: PgBouncer for efficient connection management
2. **Indexes**: Strategic indexes on high-query tables
3. **Partitioning**: Table partitioning for large historical data
4. **Read Replicas**: For read-heavy operations

### Caching Strategy

1. **CDN Caching**: Static assets via Cloudflare
2. **API Caching**: Redis for frequently accessed data (future)
3. **Browser Caching**: Service Worker for offline capability
4. **Query Caching**: Supabase built-in query cache

### Horizontal Scaling

1. **Stateless API Routes**: Scale horizontally via Vercel
2. **Edge Functions**: Auto-scale via Deno Deploy
3. **Database**: Vertical scaling + read replicas
4. **Storage**: S3-compatible with unlimited capacity

## Disaster Recovery

### Backup Strategy

1. **Database Backups**: Daily automated backups (7-day retention)
2. **Point-in-Time Recovery**: 7-day recovery window
3. **Storage Backups**: Multi-region replication
4. **Code Backups**: Git repository (GitHub)

### Recovery Procedures

1. **Database Restore**: Supabase CLI or dashboard
2. **Rollback Deployment**: Vercel instant rollback
3. **Storage Recovery**: S3 versioning enabled

## Future Enhancements

### Planned Features

1. **AI-Powered Reconciliation**: Machine learning for SMS parsing
2. **Blockchain Integration**: Immutable audit trails
3. **Credit Scoring**: ML-based creditworthiness assessment
4. **IoT Integration**: Smart card readers for in-person payments
5. **Multi-Currency Support**: Cross-border remittances

### Infrastructure Improvements

1. **GraphQL API**: Alternative to REST
2. **WebSocket Support**: Real-time updates
3. **Redis Caching**: Reduce database load
4. **Kubernetes**: Self-hosted option for large enterprises

## Conclusion

The Ibimina architecture is designed for:

- **Scalability**: Handle growth from 100 to 100,000+ users
- **Security**: Multi-layered defense with RLS and encryption
- **Reliability**: 99.9% uptime SLA
- **Performance**: Sub-second response times
- **Maintainability**: Clean separation of concerns, comprehensive testing

For detailed component documentation, see individual READMEs in each app directory.
