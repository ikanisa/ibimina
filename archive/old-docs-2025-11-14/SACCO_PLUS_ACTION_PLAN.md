# SACCO+ Production Refactor — Pragmatic Action Plan

_Date: 2025-11-02_  
_Status: Draft_  
_Owner: Engineering Team_

## Overview

Based on the comprehensive gap analysis, this action plan outlines a
**pragmatic, incremental approach** to completing SACCO+ production readiness.
The platform is already 80-90% complete; this plan focuses on verification,
testing, and targeted enhancements.

## Guiding Principles

1. **Verify First** - Don't rebuild what already works
2. **Test Thoroughly** - Comprehensive E2E and compliance testing
3. **Document Everything** - Update docs to reflect current state
4. **Small PRs** - Focused, reviewable changes
5. **Production Safety** - No breaking changes to working features

## Phase 0: Foundation & Verification (Week 1) — CURRENT PHASE

**Goal:** Establish baseline, fix critical blockers, verify core functionality

### 0.1 Critical Fixes

- [ ] **Fix Supabase Types Generation** (Priority: P0)
  - **Issue**: types.ts missing countries, country_config, telco_providers
    tables
  - **Impact**: TypeScript errors in countries pages
  - **Action**:

    ```bash
    # Option 1: Install Supabase CLI
    npm install -g supabase
    pnpm gen:types

    # Option 2: Update types manually or skip check temporarily
    # Modify scripts/check-supabase-types.sh to be more lenient
    ```

  - **Files**: `apps/admin/lib/supabase/types.ts`,
    `scripts/check-supabase-types.sh`
  - **Owner**: Platform team
  - **Estimate**: 2 hours

- [ ] **Update pnpm Lockfile** (Priority: P0)
  - **Issue**: packages/data-access dependency mismatch
  - **Action**:
    ```bash
    cd packages/data-access
    pnpm install
    cd ../..
    pnpm install
    ```
  - **Files**: `pnpm-lock.yaml`, `packages/data-access/package.json`
  - **Owner**: DevOps
  - **Estimate**: 30 minutes

### 0.2 Documentation Updates

- [ ] **ENVIRONMENT.md Enhancement** (Priority: P0)
  - **Current**: Basic environment matrix exists
  - **Enhancement**: Add complete env var catalog for all apps
  - **Action**: Document ALL env vars with:
    - Description
    - Required vs Optional
    - Default values
    - Example values
    - Security sensitivity level
  - **Files**: `docs/ENVIRONMENT.md`
  - **Owner**: Technical Writer + Platform team
  - **Estimate**: 4 hours

- [ ] **Update RLS_TESTS.md** (Priority: P1)
  - **Current**: Doc exists but needs execution instructions
  - **Enhancement**: Add:
    - How to run RLS tests locally
    - How to add new RLS tests
    - Expected test results
    - Troubleshooting guide
  - **Files**: `docs/RLS_TESTS.md`
  - **Owner**: Database team
  - **Estimate**: 2 hours

- [ ] **SECURITY.md Update** (Priority: P1)
  - **Current**: Basic security doc exists
  - **Enhancement**: Document current security controls:
    - CSP configuration and nonce usage
    - HMAC verification in Edge Functions
    - PII redaction strategy
    - Secret management
    - Security headers configuration
  - **Files**: `SECURITY.md`
  - **Owner**: Security team
  - **Estimate**: 3 hours

### 0.3 Build & Test Verification

- [ ] **Run Complete Build** (Priority: P0)
  - **Action**:

    ```bash
    # Set up environment
    cp .env.example .env
    # Fill in required secrets (or use stubs)

    # Build all packages
    pnpm install
    pnpm run build
    ```

  - **Success Criteria**: All packages build without errors
  - **Owner**: DevOps
  - **Estimate**: 1 hour (after env setup)

- [ ] **Run Test Suite** (Priority: P0)
  - **Action**:
    ```bash
    pnpm run test:unit
    pnpm run test:auth
    pnpm run test:rls  # Requires PostgreSQL
    ```
  - **Success Criteria**: All tests pass or known failures documented
  - **Owner**: QA + Engineering
  - **Estimate**: 2 hours

- [ ] **Lighthouse Audits** (Priority: P1)
  - **Action**: Run Lighthouse on deployed apps

    ```bash
    # Admin app
    pnpm dlx lighthouse https://admin-url --only-categories=pwa,performance,accessibility --output=json --output-path=.reports/admin-lighthouse.json

    # Client app
    pnpm dlx lighthouse https://client-url --only-categories=pwa,performance,accessibility --output=json --output-path=.reports/client-lighthouse.json
    ```

  - **Success Criteria**:
    - PWA score ≥ 90
    - Performance score ≥ 90
    - Accessibility score ≥ 90
  - **Owner**: Frontend team
  - **Estimate**: 3 hours

### 0.4 Deliverables

- ✅ `SACCO_PLUS_GAP_ANALYSIS.md` created
- [ ] Updated `apps/admin/lib/supabase/types.ts`
- [ ] Updated `pnpm-lock.yaml`
- [ ] Enhanced `docs/ENVIRONMENT.md`
- [ ] Test results documented
- [ ] Lighthouse audit reports in `.reports/`

**Phase 0 Estimate:** 1 week (5 working days)

---

## Phase 1: Mobile & Edge Function Verification (Week 2-3)

**Goal:** Verify mobile app compliance, test edge functions, validate AI agent

### 1.1 Mobile App Compliance

- [ ] **Android Play Compliance Verification** (Priority: P0)
  - **Check**: Verify no READ_SMS/RECEIVE_SMS permissions in production build
  - **Action**:

    ```bash
    cd apps/mobile
    # Check AndroidManifest.xml
    grep -i "READ_SMS\|RECEIVE_SMS" android/app/src/main/AndroidManifest.xml

    # Should return empty or only in debug builds
    ```

  - **Verify Alternatives**:
    - [ ] Android Notification Listener Service implemented
    - [ ] SMS User Consent API integrated
    - [ ] Test on physical device
  - **Files**:
    - `apps/mobile/android/app/src/main/AndroidManifest.xml`
    - `apps/mobile/android/app/src/main/java/.../NotificationListenerService.java`
  - **Owner**: Mobile team
  - **Estimate**: 8 hours

- [ ] **iOS Universal Links Verification** (Priority: P1)
  - **Check**: Verify AASA file and Universal Links configuration
  - **Action**:
    - [ ] Verify `.well-known/apple-app-site-association` file
    - [ ] Test deep links on physical iOS device
    - [ ] Verify tel:// fallback for USSD
  - **Files**: `apps/mobile/ios/`, `.well-known/`
  - **Owner**: Mobile team
  - **Estimate**: 4 hours

- [ ] **Deep Link E2E Testing** (Priority: P1)
  - **Test Scenarios**:
    - [ ] `/join/:groupId` - web and mobile
    - [ ] `/invite/:token` - web and mobile
    - [ ] `saccoplus://` scheme fallback
  - **Platforms**: iOS, Android, Web (Chrome, Safari)
  - **Owner**: QA
  - **Estimate**: 6 hours

### 1.2 Edge Function Validation

- [ ] **HMAC Verification Audit** (Priority: P0)
  - **Check**: All public edge functions verify HMAC signatures
  - **Functions to audit**:
    - [ ] ingest-sms
    - [ ] parse-sms
    - [ ] import-statement
    - [ ] gsm-heartbeat
  - **Action**: Review code, add tests, update docs
  - **Owner**: Backend team
  - **Estimate**: 6 hours

- [ ] **Reference Token Format Verification** (Priority: P1)
  - **Expected**: `COUNTRY3.DISTRICT3.SACCO3.GROUP4.MEMBER3`
  - **Action**:
    - [ ] Check database schema for reference token column
    - [ ] Check Edge Function `reference-decode` implementation
    - [ ] Verify token generation in providers package
  - **Files**:
    - `supabase/functions/reference-decode/`
    - `packages/providers/src/`
    - Database migrations
  - **Owner**: Backend team
  - **Estimate**: 4 hours

- [ ] **Edge Function Error Handling** (Priority: P1)
  - **Enhancement**: Add comprehensive error handling and retry logic
  - **Action**:
    - [ ] Audit error handling in all edge functions
    - [ ] Add structured error responses
    - [ ] Add retry logic with exponential backoff
    - [ ] Update error logging to include context
  - **Owner**: Backend team
  - **Estimate**: 12 hours

### 1.3 AI Agent Verification

- [ ] **ChatGPT-style UI Testing** (Priority: P1)
  - **Check**: Verify SSE streaming, stop/regenerate functionality
  - **Action**:
    - [ ] Find AI chat UI component
    - [ ] Test streaming responses
    - [ ] Test stop button
    - [ ] Test regenerate button
  - **Owner**: Frontend team
  - **Estimate**: 4 hours

- [ ] **RAG Search Testing** (Priority: P1)
  - **Check**: Verify kb.search tool works with org_kb and global_kb
  - **Action**:
    - [ ] Test knowledge base search
    - [ ] Verify country/org scoping
    - [ ] Test with sample queries
  - **Owner**: AI/ML team
  - **Estimate**: 6 hours

### 1.4 Deliverables

- [ ] Mobile compliance verification report
- [ ] Deep link test results
- [ ] Edge function audit report
- [ ] AI agent functionality verification
- [ ] Updated mobile documentation

**Phase 1 Estimate:** 2 weeks (10 working days)

---

## Phase 2: Performance & Observability (Week 4-5)

**Goal:** Optimize performance, enhance observability, prepare for scale

### 2.1 Performance Optimization

- [ ] **Bundle Analysis** (Priority: P1)
  - **Action**:
    ```bash
    ANALYZE_BUNDLE=1 pnpm run build
    # Review bundle-stats.json
    ```
  - **Goals**:
    - Identify large dependencies
    - Optimize code splitting
    - Reduce bundle size by 20%
  - **Owner**: Frontend team
  - **Estimate**: 8 hours

- [ ] **Database Query Optimization** (Priority: P1)
  - **Action**:
    - [ ] Audit slow queries via Supabase dashboard
    - [ ] Add appropriate indexes
    - [ ] Consider materialized views for heavy aggregations
  - **Owner**: Database team
  - **Estimate**: 12 hours

- [ ] **Image Optimization** (Priority: P2)
  - **Check**: Verify Next.js image optimization enabled
  - **Action**:
    - [ ] Audit image usage
    - [ ] Convert to next/image where possible
    - [ ] Verify AVIF/WebP formats
  - **Owner**: Frontend team
  - **Estimate**: 6 hours

### 2.2 Observability Enhancement

- [ ] **Grafana Dashboard Creation** (Priority: P1)
  - **Dashboards to create**:
    - [ ] Application metrics (requests, errors, latency)
    - [ ] Database metrics (connections, query performance)
    - [ ] Edge Function metrics (invocations, errors, duration)
    - [ ] Business metrics (payments, reconciliation, users)
  - **Owner**: SRE team
  - **Estimate**: 16 hours

- [ ] **Alert Rules Configuration** (Priority: P1)
  - **Alerts to configure**:
    - [ ] High error rate (> 5% for 5 minutes)
    - [ ] Slow response time (p95 > 2s for 10 minutes)
    - [ ] Failed RLS tests in CI
    - [ ] Lighthouse budget violations
  - **Owner**: SRE team
  - **Estimate**: 8 hours

- [ ] **Runbook Creation** (Priority: P1)
  - **Runbooks needed**:
    - [ ] Incident response playbook
    - [ ] Rollback procedure
    - [ ] Database migration rollback
    - [ ] Edge Function debugging guide
  - **Owner**: SRE + Engineering
  - **Estimate**: 12 hours

### 2.3 Additional Country Adapters

- [ ] **Senegal (Orange) Adapter** (Priority: P2)
  - **Files**:
    - `packages/providers/src/adapters/SN/OrangeSmsAdapter.ts`
    - `packages/providers/src/adapters/SN/OrangeStatementAdapter.ts`
  - **Owner**: Backend team
  - **Estimate**: 16 hours

- [ ] **Other Countries** (Priority: P3)
  - Based on business priority
  - Follow same pattern as Rwanda/Senegal

### 2.4 Deliverables

- [ ] Performance optimization report
- [ ] Grafana dashboards deployed
- [ ] Alert rules configured
- [ ] Runbooks documented
- [ ] Additional country adapters (if prioritized)

**Phase 2 Estimate:** 2 weeks (10 working days)

---

## Phase 3: Production Hardening (Week 6)

**Goal:** Final production readiness checks and launch preparation

### 3.1 Security Hardening

- [ ] **Security Audit** (Priority: P0)
  - [ ] Run OWASP ZAP scan
  - [ ] Review Supabase RLS policies
  - [ ] Audit secret management
  - [ ] Review rate limiting configuration
  - **Owner**: Security team
  - **Estimate**: 16 hours

- [ ] **Penetration Testing** (Priority: P0)
  - [ ] Engage security firm or use Bugcrowd
  - [ ] Test auth flows
  - [ ] Test payment flows
  - [ ] Test data isolation
  - **Owner**: Security team + External
  - **Estimate**: 40 hours (1 week)

### 3.2 Load Testing

- [ ] **Load Test Scenarios** (Priority: P0)
  - **Scenarios**:
    - [ ] 1000 concurrent users on admin app
    - [ ] 10,000 SMS ingestions per minute
    - [ ] 1000 concurrent member app users
  - **Tools**: k6, Apache JMeter
  - **Owner**: QA + SRE
  - **Estimate**: 24 hours

### 3.3 Disaster Recovery Testing

- [ ] **Backup & Restore** (Priority: P0)
  - [ ] Test database backup
  - [ ] Test database restore
  - [ ] Verify point-in-time recovery
  - **Owner**: DBA + SRE
  - **Estimate**: 8 hours

- [ ] **Failover Testing** (Priority: P1)
  - [ ] Test Supabase failover
  - [ ] Test Vercel failover
  - [ ] Test DNS failover
  - **Owner**: SRE
  - **Estimate**: 12 hours

### 3.4 Go-Live Checklist Execution

- [ ] **Execute GO_LIVE_CHECKLIST.md** (Priority: P0)
  - Work through every item in the checklist
  - Document completion with screenshots/evidence
  - Get sign-off from stakeholders
  - **Owner**: Release Manager
  - **Estimate**: 16 hours

### 3.5 Deliverables

- [ ] Security audit report
- [ ] Penetration test results
- [ ] Load test results
- [ ] DR test results
- [ ] Completed go-live checklist with evidence
- [ ] Production launch approval

**Phase 3 Estimate:** 1 week (5 working days) + external security engagement

---

## Risk Management

### High-Risk Items

| Risk                                              | Mitigation                                             | Owner    |
| ------------------------------------------------- | ------------------------------------------------------ | -------- |
| Supabase types out of date causing build failures | Fix immediately in Phase 0                             | Platform |
| Mobile app SMS permissions rejected by Play Store | Verify Notification Listener + SMS Consent in Phase 1  | Mobile   |
| Performance issues at scale                       | Load testing in Phase 3, early optimization in Phase 2 | SRE      |
| Security vulnerabilities discovered               | Security audit in Phase 3, address immediately         | Security |

### Medium-Risk Items

| Risk                                      | Mitigation                                           | Owner       |
| ----------------------------------------- | ---------------------------------------------------- | ----------- |
| Lighthouse budgets not met                | Optimization in Phase 2, defer non-critical features | Frontend    |
| Edge Function error handling insufficient | Audit and enhance in Phase 1                         | Backend     |
| Documentation out of date                 | Update throughout all phases                         | Tech Writer |

---

## Success Criteria

### Phase 0 Success

- [x] Gap analysis complete
- [ ] Build passes
- [ ] Tests pass
- [ ] Lighthouse audits complete
- [ ] Critical docs updated

### Phase 1 Success

- [ ] Mobile compliance verified
- [ ] Deep links working
- [ ] Edge functions audited
- [ ] AI agent verified

### Phase 2 Success

- [ ] Performance optimized
- [ ] Dashboards deployed
- [ ] Alerts configured
- [ ] Runbooks documented

### Phase 3 Success

- [ ] Security audit passed
- [ ] Load tests passed
- [ ] DR tests passed
- [ ] Go-live checklist complete
- [ ] **Production launch approved**

---

## Timeline Summary

| Phase     | Duration          | Key Deliverables                         |
| --------- | ----------------- | ---------------------------------------- |
| Phase 0   | 1 week            | Gap analysis, critical fixes, docs       |
| Phase 1   | 2 weeks           | Mobile verification, edge function audit |
| Phase 2   | 2 weeks           | Performance, observability, scale prep   |
| Phase 3   | 1 week + external | Security, load testing, go-live          |
| **Total** | **6-8 weeks**     | **Production-ready SACCO+ platform**     |

---

## Approval & Sign-off

| Role             | Name | Date | Signature |
| ---------------- | ---- | ---- | --------- |
| Engineering Lead |      |      |           |
| Product Manager  |      |      |           |
| Security Lead    |      |      |           |
| SRE Lead         |      |      |           |
| CTO              |      |      |           |

---

## Change Log

| Date       | Version | Author       | Changes                                             |
| ---------- | ------- | ------------ | --------------------------------------------------- |
| 2025-11-02 | 1.0     | AI Assistant | Initial pragmatic action plan based on gap analysis |
